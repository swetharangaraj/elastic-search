const mongo = require("./mongo_conn_native").Connection;
let rabbit_mq = require("./publish");
const _ = require("underscore");
const { ObjectId } = require("mongodb");
const options = { fullDocument: "updateLookup" };
// This could be any pipeline.
const pipeline = [];
let t_mongo_pipelines = [];

mongo.client
  .db("elastic_management")
  .collection("t_mongo_pipelines")
  .find()
  .toArray()
  .then(
    (result) => {
      if (result.length > 0) {
        t_mongo_pipelines = result;
        watchMongo();
      }
    },
    (error) => {
      console.log(error);
    }
  );

function watchMongo() {
  mongo.client.watch(pipeline, options).on("change", (changeEvent) => {
    let operation_type = changeEvent.operationType;
    let full_doc = changeEvent.fullDocument;
    let doc_id;
    if (operation_type == "delete" || operation_type == "update")
      doc_id = changeEvent.documentKey._id + "";
    let ns = changeEvent.ns;
    if (ns.db == "elastic_management" && ns.coll == "t_mongo_pipelines") {
      updateMongoPipelines(operation_type, full_doc, doc_id);
    }
    let matched_docs = _.where(t_mongo_pipelines, {
      db_name: ns.db,
      collection_name: ns.coll,
    });
    if (matched_docs.length > 0) {
      for (let i = 0; i < matched_docs.length; i++) {
        if (matched_docs[i].fields_to_be_indexed.length > 0) {
          full_doc = _.pick(full_doc, ...matched_docs[i].fields_to_be_indexed);
        }

        let message = {
          operation_type: operation_type,
          full_doc: full_doc,
          index_name: matched_docs[i].index_name,
          fields_to_be_indexed: matched_docs[i].fields_to_be_indexed,
          index_alias_name: matched_docs[i].alias,
          doc_id: doc_id,
        };

        rabbit_mq
          .publishToBroadCastQueue(
            message,
            `mongo_elastic_stream_queue_key_${process.env.NODE_ENV}`
          )
          .then(() => {
            console.log("Changes sent to queue!");
          });
      }
    }
  });
}

function updateMongoPipelines(operation_type, full_doc, doc_id) {
  try {
    if (operation_type == "insert") {
      t_mongo_pipelines.push(full_doc);
    } else if (operation_type == "update") {
      let index = _.findIndex(t_mongo_pipelines, function (x) {
        let _id = x._id + "";
        return _id == doc_id + "";
      });
      t_mongo_pipelines[index] = full_doc;
    } else if (operation_type == "delete") {
      let index = _.findIndex(t_mongo_pipelines, function (x) {
        let _id = x._id + "";
        return _id == doc_id + "";
      });
      t_mongo_pipelines.splice(index, 1);
    }
  } catch (err) {
    console.log(err);
  }
}
