const amqp = require("amqplib/callback_api");
const config = require("config");
const CONNECTION_URL = config.rabbit_mq_str;
let ch = null;
const exchange = "publish_process_exchange";
const exchange_type = "direct";
const is_durable = true;
const is_exclusive = false;
const no_ack = false;
const prefetch_limit = 500;
let mongo = require("./mongo_conn_native").Connection;
const { ObjectId } = require("mongodb");
const { Client } = require("@elastic/elasticsearch");
let redis = require("./redis-connect").redisClient;
const elastic_client = new Client({
  node: config.elastic_url,
  auth: {
    apiKey: config.elasticApiKey,
  },
});

function start() {
  amqp.connect(CONNECTION_URL + "?heartbeat=60", (err, connection) => {
    if (err) {
      console.log("Failed to connect to the URL");
      throw err;
    }
    connection.on("error", function (err) {
      if (err.message !== "Connection closing") {
        console.error("[AMQP] conn error", err.message);
      }
    });
    connection.on("close", function () {
      console.error("[AMQP] reconnecting");
      return setTimeout(start, 1000);
    });
    connection.createChannel(async (err, channel) => {
      if (err) {
        console.log("Failed to create a Channel");
        throw err;
      }
      ch = channel;

      ch.assertExchange(exchange, exchange_type, {
        durable: is_durable,
      });

      channel.prefetch(prefetch_limit);

      ch.assertQueue(
        `mongo_elastic_stream_queue_${process.env.NODE_ENV}`,
        {
          exclusive: is_exclusive,
        },
        (error2, q) => {
          if (error2) {
            throw error2;
          }
          console.log(
            " [*] Waiting for Messages from ",
            `mongo_elastic_stream_queue_${process.env.NODE_ENV}`
          );
          ch.bindQueue(
            q.queue,
            exchange,
            `mongo_elastic_stream_queue_key_${process.env.NODE_ENV}`
          );

          ch.consume(
            q.queue,
            async (msg) => {
              let parsedMsg = msg.content.toString();
              let msg_obj = JSON.parse(parsedMsg);
              console.log(msg_obj);
              performElasticOperation(msg_obj).then(() => {
                ch.ack(msg);
              });
            },
            {
              noAck: no_ack,
            }
          );
        }
      );
    });
  });
}

async function performElasticOperation(msg_obj) {
  try {
    let index_name = msg_obj.index_name;
    if (msg_obj.operation_type == "update") {
      let full_doc = msg_obj.full_doc;
      full_doc.index_alias_name = msg_obj.index_alias_name;
      full_doc.document_id = full_doc._id;
      delete full_doc._id;

      let exists = false;
      exists = await elastic_client.exists({
        index: index_name,
        id: full_doc.document_id,
      });

      if (exists) {
        /* Update a Document */
        elastic_client
          .update({
            index: index_name,
            id: full_doc.document_id,
            body: {
              // put the partial document under the `doc` key
              doc: full_doc,
            },
          })
          .then(
            function (resp) {
              console.log("Successful update! The response was: ", resp);
              return Promise.resolve(1);
            },
            function (err) {
              console.log(err);
              return Promise.reject(err);
            }
          );
      } else {
        return Promise.resolve(1);
      }
    } else if (msg_obj.operation_type == "insert") {
      let full_doc = msg_obj.full_doc;
      full_doc.index_alias_name = msg_obj.index_alias_name;
      full_doc.document_id = full_doc._id;
      delete full_doc._id;
      console.log(index_name);
      console.log(full_doc);

      /**insert a doc */

      elastic_client
        .create({
          index: index_name,
          id: full_doc.document_id,
          body: full_doc,
        })
        .then((response) => {
          console.log("Successful insert! The response was: ", response);
          return Promise.resolve(1);
        })
        .catch((err) => {
          console.log(err);
          return Promise.reject(err);
        });
    } else if (msg_obj.operation_type == "delete") {
      let exists = false;
      exists = await elastic_client.exists({
        index: index_name,
        id: msg_obj.doc_id,
      });
      if (exists) {
        elastic_client
          .delete({
            index: index_name,
            id: msg_obj.doc_id,
          })
          .then(
            function (resp) {
              console.log("Successful delete! The response was: ", resp);
              return Promise.resolve(1);
            },
            function (err) {
              console.log(err);
              return Promise.reject(err);
            }
          );
      } else {
        return Promise.resolve(1);
      }
    }
  } catch (err) {
    console.log(err);
    return Promise.reject(err);
  }
}

start();
