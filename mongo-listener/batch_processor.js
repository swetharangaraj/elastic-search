const Agenda = require("agenda");
const config = require("config");
let mongo = require("./mongo_conn_native").Connection;
let redis = require("./redis-connect").redisClient;
let rabbit_mq = require("./publish");

const agenda = new Agenda({ mongo: mongo.client.db("elastic_management") });
agenda.maxConcurrency(30);
agenda.defaultConcurrency(10);

agenda.start();

mongo.client
  .db("elastic_management")
  .collection("agendaJobs")
  .drop()
  .then((res) => {
    mongo.client
      .db("elastic_management")
      .collection("t_mongo_pipelines")
      .find({ is_batch_process_completed: false })
      .toArray()
      .then((openPipelines) => {
        for (let i = 0; i < openPipelines.length; i++) {
          addJob(openPipelines[i]);
        }
      });
  });

async function addJob(pipeline) {
  console.log("job added");
  let pipeline_history = await redis.get(`job-${pipeline.pipeline_id}`);
  if (!pipeline_history)
    redis.set(`job-${pipeline.pipeline_id}`, JSON.stringify(pipeline));

  agenda.define(`job-${pipeline.pipeline_id}`, async (job) => {
    let pipeline_detail = await redis.get(job.attrs.name);
    let parsed_pipeline_detail = JSON.parse(pipeline_detail);
    rabbit_mq
      .publishToBroadCastQueue(
        parsed_pipeline_detail,
        `mongo_elastic_queue_key_${process.env.NODE_ENV}`
      )
      .then(() => {
        if (parsed_pipeline_detail) {
          parsed_pipeline_detail.pointer_location =
            parsed_pipeline_detail.pointer_location +
            parsed_pipeline_detail.batch_size;

          redis.set(
            `job-${parsed_pipeline_detail.pipeline_id}`,
            JSON.stringify(parsed_pipeline_detail)
          );
        }
      });
  });

  agenda.every("3 seconds", `job-${pipeline.pipeline_id}`);
}

const options = { fullDocument: "updateLookup" };
const pipeline = [];
let change_stream = mongo.client
  .db("elastic_management")
  .collection("t_mongo_pipelines")
  .watch(pipeline, options);
change_stream.on("change", (changeEvent) => {
  console.log(changeEvent)
  let operation_type = changeEvent.operationType;
  let full_doc = changeEvent.fullDocument;
  if (operation_type === "insert") {
    if (!full_doc.is_batch_process_completed) addJob(full_doc);
  }
});
