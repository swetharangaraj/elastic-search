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
const stream_worker = require("./stream_worker");

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
        `mongo_elastic_queue_${process.env.NODE_ENV}`,
        {
          exclusive: is_exclusive,
        },
        (error2, q) => {
          if (error2) {
            throw error2;
          }
          console.log(
            " [*] Waiting for Messages from ",
            `mongo_elastic_queue_${process.env.NODE_ENV}`
          );
          ch.bindQueue(
            q.queue,
            exchange,
            `mongo_elastic_queue_key_${process.env.NODE_ENV}`
          );

          ch.consume(
            q.queue,
            async (msg) => {
              let parsedMsg = msg.content.toString();
              let msg_obj = JSON.parse(parsedMsg);
              bulkBatchUpload(msg_obj).then(() => {
                // console.log(q.queue);
                // console.log(msg_obj);
                console.log("-----------------------------");
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

async function bulkBatchUpload(message) {
  try {
    if (message == null) {
      return Promise.resolve(1);
    }
    let db = message.db_name;
    let collection_name = message.collection_name;
    let pointer_location = message.pointer_location;
    let batch_size = message.batch_size;
    let fields_to_be_indexed = message.fields_to_be_indexed;
    let alias_name = message.alias;
    let index_name = message.index_name;
    let project_obj = {};
    fields_to_be_indexed.forEach((element) => {
      project_obj[element] = 1;
    });

    let pipeline = [
      { $project: project_obj },
      { $skip: pointer_location },
      { $limit: batch_size },
    ];

    let mongo_result = await mongo.client
      .db(db)
      .collection(collection_name)
      .aggregate(pipeline)
      .toArray();

    if (mongo_result.length > 0) {
      //bulk upload batch to elastic search
      let data = mongo_result.flatMap((doc) => [
        { index: { _index: index_name, _id: doc._id + "" } },
        { ...getDocExcludingID(doc), index_alias_name: alias_name },
      ]);

      const bulkResponse = await elastic_client.bulk({
        refresh: true,
        body: data,
      });
      console.log(bulkResponse);
      if (bulkResponse.errors) {
        const erroredDocuments = [];
        // The items array has the same order of the dataset we just indexed.
        // The presence of the `error` key indicates that the operation
        // that we did for the document has failed.
        bulkResponse.items.forEach((action, i) => {
          const operation = Object.keys(action)[0];
          if (action[operation].error) {
            erroredDocuments.push({
              // If the status is 429 it means that you can retry the document,
              // otherwise it's very likely a mapping error, and you should
              // fix the document before to try it again.
              status: action[operation].status,
              error: action[operation].error,
              operation: data[i * 2],
              document: data[i * 2 + 1],
              pipeline_detail: message,
            });
          }
        });
        await mongo.client
          .db("elastic_management")
          .collection("batch_upload_fails")
          .insertMany(erroredDocuments);
      }

      return Promise.resolve(1);
    } else {
      /**
       * delete the key in redis
       * make is_batch_process_completed :true
       * delete the job from agendJobs
       */

      let mongo_agenda_update = await mongo.client
        .db("elastic_management")
        .collection("agendaJobs")
        .deleteOne({ name: `job-${message.pipeline_id}` });

      let mongo_pipeline_update = await mongo.client
        .db("elastic_management")
        .collection("t_mongo_pipelines")
        .updateOne(
          { pipeline_id: message.pipeline_id },
          {
            $set: {
              is_batch_process_completed: true,
            },
          }
        );

      let redis_del = await redis.del(`job-${message.pipeline_id}`);
      return Promise.resolve(1);
    }
  } catch (error) {
    console.log(error);
    return Promise.reject(error);
  }
}

getDocExcludingID = (doc) => {
  doc.document_id = doc._id;
  delete doc._id;
  return doc;
};

mongo
  .connectToMongo()
  .then(async () => {
    console.log("mongo connected!");

    redis
      .get(`test`)
      .then((val) => {
        console.log(val);
        start();
      })
      .catch((err) => {
        console.log("redis not connected!");
      });
  })
  .catch((err) => {
    console.log(err);
  });
