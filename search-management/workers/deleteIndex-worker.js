const logger = require("../logger");
const config = require("config");
const { ObjectId } = require("mongodb");
const mongo = require("../mongo_conn_native").Connection;
const axios = require("axios");
const channel = require("../mqCon").channel;
const is_exclusive = false;
var exchange = "publish_process_exchange";
const no_ack = false;
const io = require("../index").io;

channel.assertQueue(
  `delete_index_queue_${process.env.NODE_ENV}`,
  {
    exclusive: is_exclusive,
  },
  (error2, q) => {
    if (error2) {
      throw error2;
    }
    console.log(
      " [*] Waiting for Messages from ",
      `delete_index_queue_${process.env.NODE_ENV}`
    );
    channel.bindQueue(
      q.queue,
      exchange,
      `delete_index_queue_key_${process.env.NODE_ENV}`
    );

    channel.consume(
      q.queue,
      async (msg) => {
        let parsedMsg = msg.content.toString();
        let msg_obj = JSON.parse(parsedMsg);
        deleteIndex(msg_obj).then(() => {
          channel.ack(msg);
        });
      },
      {
        noAck: no_ack,
      }
    );
  }
);

async function deleteIndex(msg) {
  try {
    console.log(msg);
    if (msg.database_type == "mysql") {
      let logstash_res = await deleteLogstashPipeline(msg.pipeline_id);
    } else if (msg.database_type == "mongodb") {
      let del_job_res = await deleteJobIfExists(msg.pipeline_id);
      let del_pipeline_res = await deletePipleLineInMongo(msg.pipeline_id);
    }
    let delete_mongo_index = await deleteIndexInMongo(msg._id, msg.index_name);
    let delete_es_index_res = await deleteESindex(msg.index_name);
    return Promise.resolve(1);
  } catch (err) {
    console.log(err);
    logger.error(err);
    return Promise.reject(err);
  }
}

async function deleteLogstashPipeline(pipeline_id) {
  try {
    console.log(pipeline_id);

    const API_KEY = config.elasticApiKey;
    const URL = `${config.elastic_url}/_logstash/pipeline/${pipeline_id}`;
    const axios_config = {
      method: "DELETE",
      url: URL,
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
        "kbn-xsrf": "true",
        Authorization: `ApiKey ${API_KEY}`,
      },
    };
    let response = await axios(axios_config);
    return Promise.resolve(response);
  } catch (err) {
    console.log(err);
    logger.error(err);
    return Promise.reject(err);
  }
}

async function deleteIndexInMongo(index_id, index_name) {
  try {
    let res = await mongo.client
      .db("elastic_management")
      .collection("t_indices")
      .deleteOne({ _id: ObjectId(index_id) });
    return Promise.resolve(res);
  } catch (err) {
    console.log(err);
    logger.error(err);
    return Promise.reject(err);
  }
}

async function deleteESindex(index_name) {
  try {
    const API_KEY = config.elasticApiKey;
    const URL = `${config.elastic_url}/${index_name}`;
    const axios_config = {
      method: "DELETE",
      url: URL,
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
        "kbn-xsrf": "true",
        Authorization: `ApiKey ${API_KEY}`,
      },
    };
    let response = await axios(axios_config);
    return Promise.resolve(response);
  } catch (err) {
    console.log(err);
    logger.error(err);
    return Promise.reject(err);
  }
}

async function deletePipleLineInMongo(pipeline_id) {
  try {
    let res = await mongo.client
      .db("elastic_management")
      .collection("t_mongo_pipelines")
      .deleteOne({ pipeline_id: pipeline_id });
    return Promise.resolve(res);
  } catch (err) {
    console.log(err);
    logger.error(err);
    return Promise.reject(err);
  }
}

async function deleteJobIfExists(pipeline_id) {
  try {
    let job_name = `job-${pipeline_id}`;
    let deleteResult = await mongo.client
      .db("elastic_management")
      .collection("agendaJobs")
      .deleteOne({ name: job_name });
    return Promise.resolve(deleteResult);
  } catch (err) {
    console.log(err);
    logger.error(err);
    return Promise.reject(err);
  }
}
