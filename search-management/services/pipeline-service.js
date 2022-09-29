const config = require("config");
const axios = require("axios");
const logger = require("../logger");
const { pipe } = require("../logger");
const template = require("../pipelineTemplates/logstash-pipe-mysql").template;
const mongo = require("../mongo_conn_native").Connection;
const _ = require("underscore");

/**
 * pipelines module
 * @module pipelines
 */
module.exports = {
  /**
   * get all pipeline details from logstash
   * @param {*} req
   * @param {*} res
   * @author amal anush
   * @version 1.0
   */

  listAllLogstashPipelines: async (req, res) => {
    try {
      const API_KEY = config.elasticApiKey;
      const URL = `${config.elastic_url}/_logstash/pipeline`;

      const axios_config = {
        method: "GET",
        url: URL,
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
          "kbn-xsrf": "true",
          Authorization: `ApiKey ${API_KEY}`,
        },
      };
      let response = await axios(axios_config);
      let pipeline_detail_in_indices = await mongo.client
        .db("elastic_management")
        .collection("t_indices")
        .aggregate([
          {
            $project: {
              index_name:1,
              pipeline_id: 1,
              db_name: 1,
              table_name: 1,
            },
          },
        ])
        .toArray();
      let pipelines = [];
      var size = Object.keys(response.data).length;
      var i = 0;
      for (var property in response.data) {
        let pipeline = _.where(pipeline_detail_in_indices, {
          pipeline_id: property,
        });
        pipelines.push({
          pipeline_name: property,
          index_name:pipeline.length > 0 ? pipeline[0].index_name : null,
          table_name: pipeline.length > 0 ? pipeline[0].table_name : null,
          db_name: pipeline.length > 0 ? pipeline[0].db_name : null,
          last_modified: response.data[property].last_modified,
          content: response.data[property].pipeline,
        });
        if (i == size - 1) {
          res.status(200).send({
            err: false,
            message: "pipelines retrieved",
            data: pipelines,
          });
          return;
        }

        i++;
      }
    } catch (err) {
      console.log(err);
      logger.error(err);
      res.status(501).send({
        err: true,
        message: err,
      });
    }
  },

  /**
   * Get active pipeline detail from logstash
   * @param {*} req
   * @param {*} res
   * @author amal anush
   * @version 1.0
   */

  getPipelineDetails: async (req, res) => {
    try {
      let pipeline_id = req.params.pipelineId;
      const API_KEY = config.elasticApiKey;
      const URL = `${config.elastic_url}/api/logstash/pipeline/${pipeline_id}`;

      const axios_config = {
        method: "GET",
        url: URL,
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
          "kbn-xsrf": "true",
          Authorization: `ApiKey ${API_KEY}`,
        },
      };
      axios(axios_config)
        .then(function (response) {
          res.status(200).send(response.data);
        })
        .catch(function (err) {
          console.log(err);
          logger.error(err);
          res.status(501).send({
            err: true,
            message: err,
          });
        });
    } catch (err) {
      console.log(err);
      logger.error(err);
      res.status(501).send({
        err: true,
        message: err,
      });
    }
  },

  /**
   * Construct dynamic pipelines
   * @param {*} req
   * @param {*} res
   * @author amal anush
   * @version 1.0
   */

  constructPipeline: async (req, res) => {
    try {
      let selected_dbs = req.body.data.selectedDbs;
      let index_alias = req.body.data.indexAlias;
      let table = req.body.data.selectedBaseTable;
      let selected_fields = req.body.data.selectedFields.toString();
      let primary_key_field = req.body.data.primaryKeyField;
      let pipelines = [];

      for (let i = 0; i < selected_dbs.length; i++) {
        let implicit_template = template + "";
        implicit_template = implicit_template.replace(
          "[mysql_host]",
          config.host
        );
        implicit_template = implicit_template.replace(
          "[mysqlPass]",
          config.password
        );
        implicit_template = implicit_template.replace(
          "[database]",
          selected_dbs[i]
        );
        implicit_template = implicit_template.replace(
          "[index_alias_name]",
          index_alias
        );
        implicit_template = implicit_template.replace(
          "[cloud_id]",
          config.elastic_cloud_id
        );
        implicit_template = implicit_template.replace(
          "[elastic_user]",
          config.elastic_user
        );
        implicit_template = implicit_template.replace(
          "[elastic_password]",
          config.elastic_password
        );
        implicit_template = implicit_template.replace(
          "[index_name]",
          `${table}_${selected_dbs[i]}`
        );
        implicit_template = implicit_template.replace("[table]", table);
        implicit_template = implicit_template.replace(
          "[columns]",
          selected_fields
        );
        implicit_template = implicit_template.replace(
          "[primary_key]",
          primary_key_field
        );

        let pipelineObj = {
          description: "",
          last_modified: new Date(),
          pipeline_metadata: {
            type: "logstash_pipeline",
            version: "1",
          },
          username: config.elastic_user,
          pipeline: implicit_template,
          pipeline_settings: {
            "pipeline.workers": 1,
            "pipeline.batch.size": 125,
            "pipeline.batch.delay": 50,
            "queue.type": "memory",
            "queue.max_bytes.number": 1,
            // "queue.max_bytes.units": "gb",
            "queue.checkpoint.writes": 1024,
          },
        };
        pipelines.push({
          pipeline_name: `${table}_${selected_dbs[i]}-pipe`,
          pipeline_obj: pipelineObj,
        });
      }
      res.status(200).send({
        err: false,
        message: "pipelines constructed succesfully",
        data: pipelines,
      });
    } catch (err) {
      console.log(err);
      logger.error(err);
      res.status(501).send({
        err: true,
        message: err,
      });
    }
  },

  /**
   * create dynamic pipelines
   * @param {*} req
   * @param {*} res
   * @author amal anush
   * @version 1.0
   */

  createPipeline: async (req, res) => {
    try {
      let pipeline_name = req.body.pipeline.pipeline_name;
      let pipeline_obj = req.body.pipeline.pipeline_obj;
      const API_KEY = config.elasticApiKey;
      const URL = `${config.elastic_url}/_logstash/pipeline/${pipeline_name}`;

      const axios_config = {
        method: "PUT",
        url: URL,
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
          "kbn-xsrf": "true",
          Authorization: `ApiKey ${API_KEY}`,
        },
        data: pipeline_obj,
      };
      axios(axios_config)
        .then(function (response) {
          res.status(200).send({
            err: false,
            message: "pipeline created successfully!",
            data: "success",
          });
        })
        .catch(function (error) {
          logger.error(error);
          console.error(error);
          res.status(500).send({
            err: true,
            message: error,
          });
        });
    } catch (err) {
      logger.error(err);
      res.status(500).send({
        err: true,
        message: err,
      });
    }
  },

  listAllMongoPipelines: async (req, res) => {
    try {
      let mongo_pipelines = await mongo.client
        .db("elastic_management")
        .collection('t_mongo_pipelines')
        .find()
        .toArray();
      res.status(200).send({
        err: false,
        message: "mongo pipelines retrieved",
        data: mongo_pipelines,
      });
    } catch (err) {
      console.log(err);
      logger.error(err);
      res.status(500).send({
        err: true,
        message: err,
      });
    }
  },
};
