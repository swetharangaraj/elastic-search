const logger = require("../logger");
const mongo = require("../mongo_conn_native").Connection;
const axios = require("axios");
const config = require("config");
const ObjectId = require('mongodb').ObjectId

/**
 * elastic search module
 * @module elastic_search
 */
module.exports = {
  /**
   * get index statistics
   * @param  {*} req
   * @param  {*} res
   * @author Amal Anush a
   * @version 1.0
   */
  getIndexStats: async (req, res) => {
    try {
      const API_KEY = config.elasticApiKey;
      const URL = `${config.elastic_url}/_search`;

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
          res.status(200).send({
            err: false,
            message: "stats retrieved succesfully",
            data: response.data,
          });
        })
        .catch(function (error) {
          logger.error(error);
          console.error(error);
          res.status(500).send({
            err: true,
            message: err,
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

  /**
   * create index with mapping
   * @param  {*} req
   * @param  {*} res
   * @author Amal Anush a
   * @version 1.0
   */

  createIndex: async (req, res) => {
    try {
      let index = req.body.index;
      let mapping = req.body.mapping.mappings;

      const API_KEY = config.elasticApiKey;
      const URL = `${config.elastic_url}/${index}`;

      const axios_config = {
        method: "PUT",
        url: URL,
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
          "kbn-xsrf": "true",
          Authorization: `ApiKey ${API_KEY}`,
        },
        data: {
          settings: {
            // "index.mapping.total_fields.limit": 100,
            // "index.mapping.depth.limit": 3,
            // "index.mapping.nested_fields.limit": 10,
            // "index.mapping.nested_objects.limit": 100,
          },
          mappings: mapping,
        },
      };
      axios(axios_config)
        .then(function (response) {
          res.status(200).send({
            err: false,
            message: "index created successfully",
            data: response.data,
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

  /**
   * create index in mongo
   * @param  {*} req
   * @param  {*} res
   * @author Amal Anush a
   * @version 1.0
   */

  createIndexInMongo: async (req, res) => {
    try {
      let doc = req.body.doc;
      mongo.client
        .db("elastic_management")
        .collection("t_indices")
        .insertOne(doc)
        .then((result) => {
          res.status(200).send({
            err: false,
            message: "index created in mongodb",
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

  /**
   * getAllIndices
   * @param  {*} req
   * @param  {*} res
   * @author Amal Anush a
   * @version 1.0
   */

  getAllIndices: async (req, res) => {
    try {
      let all_indices = await mongo.client
        .db("elastic_management")
        .collection("t_indices")
        .find()
        .toArray();
      res.status(200).send({
        err: false,
        message: "indices retrieved successfully",
        data: all_indices,
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

  /**
   * getIndicesStats
   * @param  {*} req
   * @param  {*} res
   * @author Amal Anush a
   * @version 1.0
   */

  getIndicesStats: async (req, res) => {
    try {
      const API_KEY = config.elasticApiKey;
      const URL = `${config.elastic_url}/_cat/indices?v=true&format=json`;

      const axios_config = {
        method: "GET",
        url: URL,
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
          "kbn-xsrf": "true",
          Authorization: `ApiKey ${API_KEY}`,
        },
      };
      let result = await axios(axios_config);

      res.status(200).send({
        err: false,
        message: "indices stats retrieved successfully",
        data: result.data,
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

  /**
   * deleteIndices
   * @param  {*} req
   * @param  {*} res
   * @author Amal Anush a
   * @version 1.0
   */

  deleteIndices: async (req, res) => {
    try {
      const publisher = await require("../publisher");
      let deletion_info = req.body.delete_info;

      for (let i = 0; i < deletion_info.length; i++) {
        publisher.publishToBroadCastQueue(
          deletion_info[i],
          `delete_index_queue_key_${process.env.NODE_ENV}`
        );
      }

      res.send({
        err: false,
        message: "Deletion job added!",
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

  /**
  * deleteIndices
  * @param  {*} req
  * @param  {*} res
  * @author Amal Anush a
  * @version 1.0
  */


  syncIndexUiMap: async (req, res) => {
    try {
      let source_index = req.body.source_index;
      let target_index = req.body.target_index;
      let doc = await mongo.client.db('elastic_management').collection('t_index_ui_field_mapping')
        .findOne({ index_name: source_index });

      doc.index_name = target_index;
      delete doc['_id'];
      // let insertion = await mongo.client.db('elastic_management').collection('t_index_ui_field_mapping')
      //   .insertOne(doc);
      const query = { index_name: target_index };
      const update = { $set: doc };
      const options = { upsert: true };
      let update_result = await mongo.client.db('elastic_management').collection('t_index_ui_field_mapping').updateOne(query, update, options);


      res.send({
        err: false,
        message: "ui map sync successfull",
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


  getIndexConfigs: async (req, res) => {
    try {
      let index = req.body.index;
      let index_ui_mapping = await mongo.client.db('elastic_management').collection('t_index_ui_field_mapping').findOne({
        index_name: index
      })

      let t_filter_response_types = await mongo.client.db('elastic_management').collection('t_filter_response_types').find({
        index: index
      }).toArray();

      let index_result = await mongo.client.db('elastic_management').collection('t_indices').findOne({ index_name: index })
      let highlight_fields = index_result.highlight_fields;
      let config = {
        index_ui_mapping: index_ui_mapping,
        t_filter_response_types: t_filter_response_types,
        highlight_fields: highlight_fields
      }

      res.send({
        err: false,
        message: "ui map sync successfull",
        data: config
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

  updateUiMapping: async (req, res) => {
    try {
      let index = req.body.index;
      let fields = req.body.fields

      const query = { index_name: index };
      const update = { $set: { index_name: index, fields: fields } };
      const options = { upsert: true };
      let update_result = await mongo.client.db('elastic_management').collection('t_index_ui_field_mapping').updateOne(query, update, options);

      res.send({
        err: false,
        message: "ui map update successfull",
        data: update_result
      });

    }
    catch (err) {
      console.log(err);
      logger.error(err);
      res.status(500).send({
        err: true,
        message: err,
      });
    }
  },


  updateIndexRole: async (req, res) => {
    try {
      let roles = req.body.roles;
      let index_id = req.body.index_id;

      let update_result = await mongo.client.db('elastic_management').collection('t_indices').updateOne(
        { _id: ObjectId(index_id) },
        {
          $set: { accessible_roleGroups: roles }
        }
      )
      res.send({
        err: false,
        message: "role update successfull",
        data: update_result
      });

    }
    catch (err) {
      console.log(err);
      logger.error(err);
      res.status(500).send({
        err: true,
        message: err,
      });
    }
  },

  updateHighLightedFields: async (req, res) => {
    try {

      let index = req.body.index;
      let highlight_fields = req.body.highlight_fields;

      let update_result = await mongo.client.db('elastic_management').collection('t_indices').updateOne(
        { index_name: index },
        {
          $set: { highlight_fields: highlight_fields }
        }
      )
      res.send({
        err: false,
        message: "highlights update successfull",
        data: update_result
      });

    }
    catch (err) {
      console.log(err);
      logger.error(err);
      res.status(500).send({
        err: true,
        message: err,
      });
    }
  }
};
