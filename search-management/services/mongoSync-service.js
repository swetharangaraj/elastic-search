const mongo = require("../mongo_conn_native").Connection;
const _ = require("underscore");
const logger = require("../logger");
const mongo_pipeline_batch_size = 100;

module.exports = {
  /**
   * list all collections in base database
   * @param  {*} req
   * @param  {*} res
   * @author Amal Anush a
   * @version 1.0
   */

  listBaseCollections: async (req, res) => {
    try {
      let db = mongo.client.db("elastic_management");
      let result = await db
        .collection("m_db_sync_config")
        .findOne({ database_type: "mongodb" });

      let base_db = result.base_database;

      let collections = await mongo.client
        .db(base_db)
        .listCollections()
        .toArray();
      collections = _.pluck(collections, "name");
      res.status(200).send({
        err: false,
        message: "collections retrieved successfully",
        data: collections,
      });
    } catch (err) {
      logger.error(error);
      console.error(error);
      res.status(500).send({
        err: true,
        message: err,
      });
    }
  },

  /**
   * list all the databases
   * @param  {*} req
   * @param  {*} res
   * @author Amal Anush a
   * @version 1.0
   */

  getDatabases: async (req, res) => {
    try {
      let tenant_dbs = await mongo.client
        .db("tenants_management")
        .collection("m_tenants")
        .find()
        .project({ tad: 1 })
        .toArray();
      let all_dbs = await mongo.client.db("test").admin().listDatabases();
      all_dbs = all_dbs.databases;
      all_dbs = _.pluck(all_dbs, "name");
      tenant_dbs = _.uniq(tenant_dbs, "tad");
      tenant_dbs = _.pluck(tenant_dbs, "tad");
      res.send({
        err: false,
        message: "Databases retrieved successfully",
        data: {
          tenant_dbs: tenant_dbs,
          other_dbs: _.difference(all_dbs, tenant_dbs),
        },
      });
    } catch (error) {
      logger.error(error);
      console.error(error);
      res.status(500).send({
        err: true,
        message: error,
      });
    }
  },

  /**
   * check whether collection exists in a database
   * @param  {*} req
   * @param  {*} res
   * @author Amal Anush a
   * @version 1.0
   */

  checkCollectionExistInTenantDbs: async (req, res) => {
    try {
      let tenant_dbs = req.body.tenant_dbs;
      let collection_name = req.body.collection_name;
      let result = [];

      for (let i = 0; i < tenant_dbs.length; i++) {
        let collections = await mongo.client
          .db(tenant_dbs[i])
          .listCollections()
          .toArray();
        collections = _.pluck(collections, "name");
        result.push({
          db: tenant_dbs[i],
          col: collection_name,
          does_col_exist: collections.includes(collection_name),
        });
        if (i == tenant_dbs.length - 1) {
          res.status(200).send({
            err: false,
            data: result,
          });
        }
      }
    } catch (err) {
      logger.error(error);
      console.error(error);
      res.status(500).send({
        err: true,
        message: error,
      });
    }
  },

  /**
   * stores the index and pipeline information
   * @param  {*} req
   * @param  {*} res
   * @author Amal Anush a
   * @version 1.0
   */

  createMongoPipelines: async (req, res) => {
    try {
      let col_to_be_indexed = req.body.colToBeIndexed;
      let fields_to_be_indexed = req.body.fieldsToBeIndexed;
      let selectedRoleGroups = req.body.selectedRoleGroups;
      let executed_on = req.body.executed_on;
      let route_url = req.body.route_url;
      let auth_filter_api = req.body.authFilterApi;

      let index_doc = {
        index_name: col_to_be_indexed.index_name,
        ingestion_mode: "database_sync",
        database_type: "mongodb",
        pipeline_type: "mongo_pipeline",
        pipeline_id: `${col_to_be_indexed.index_name}-pipe`,
        executed_on: executed_on,
        table_name: col_to_be_indexed.col,
        db_name: col_to_be_indexed.db,
        app_name: col_to_be_indexed.alias,
        fetch_method: "collection_fetch",
        route_url: route_url,
        auth_filter_api: auth_filter_api,
        accessible_roleGroups: selectedRoleGroups,
      };

      let pipeline_doc = {
        pipeline_id: `${col_to_be_indexed.index_name}-pipe`,
        index_name: col_to_be_indexed.index_name,
        db_name: col_to_be_indexed.db,
        alias: col_to_be_indexed.alias,
        collection_name: col_to_be_indexed.col,
        fields_to_be_indexed: fields_to_be_indexed,
        is_batch_process_completed: false,
        pointer_location: 0,
        batch_size: mongo_pipeline_batch_size,
      };

      let index_update_result = await mongo.client
        .db("elastic_management")
        .collection("t_indices")
        .insertOne(index_doc);
      let pipeline_update_result = await mongo.client
        .db("elastic_management")
        .collection("t_mongo_pipelines")
        .insertOne(pipeline_doc);

      res.status(200).send({
        err: false,
        message: "pipeline created!",
        data: {
          index_update_result: index_update_result,
          pipeline_update_result: pipeline_update_result,
        },
      });
    } catch (error) {
      logger.error(error);
      console.error(error);
      res.status(500).send({
        err: true,
        message: error,
      });
    }
  },

  /**
   * get the collection names of the database
   * @param  {*} req
   * @param  {*} res
   * @author Amal Anush a
   * @version 1.0
   */

  listCollectionsOfDatabase: async (req, res) => {
    try {
      let db_name = req.body.db_name;
      let collections = await mongo.client
        .db(db_name)
        .listCollections()
        .toArray();
      collections = _.pluck(collections, "name");
      res.status(200).send({
        err: false,
        message: "collections retrieved successfully",
        data: collections,
      });
    } catch (err) {
      logger.error(error);
      console.error(error);
      res.status(500).send({
        err: true,
        message: error,
      });
    }
  },
};
