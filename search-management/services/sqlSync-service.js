const { rpool, pool } = require("../databaseCon");
const logger = require("../logger");
const mongo = require("../mongo_conn_native").Connection;
const _ = require("underscore");

/**
 * List all available databases (tenant databases)
 * @param  {*} req
 * @param  {*} res
 * @author Amal Anush a
 * @version 1.0
 */

module.exports.listDatabases = async (req, res) => {
  try {
    const base_table_name = req.params.baseDbTableName;
    let list_db_query = `SHOW DATABASES`;
    let mysql_available_dbs = await rpool(list_db_query);

    let active_tenants = await getAllActiveTenantDbs();
    let tenant_tads = _.pluck(active_tenants, "tad");
    tenant_tads = _.uniq(tenant_tads);
    mysql_available_dbs = _.pluck(mysql_available_dbs, "Database");
    processed_mysql_available_dbs = [];

    /**
     * check whether table exists in all available schemas
     */

    let check_table_exist_q = `select * from information_schema.tables where TABLE_NAME = ? ;`;
    let table_exist_result = await rpool(check_table_exist_q, [
      base_table_name,
    ]);

    /**
     * check all the available indexes from collection
     */

    let indexed_tads = await mongo.client
      .db("elastic_management")
      .collection("t_indices")
      .find()
      .toArray();

    /**
     * Retrieving the list of databases where the selected table is present along with
     *
     * status whether its already indexed or non indexed
     * Datatypes of the field in these table are same accross tenand DBS
     */

    for (let index = 0; index < table_exist_result.length; index++) {
      let tad = table_exist_result[index];
      does_table_exits_in_active_tads = tenant_tads.includes(tad.TABLE_SCHEMA);
      if (does_table_exits_in_active_tads) {
        let do_index_exist = _.find(indexed_tads, {
          ingestion_mode: "database_sync",
          database_type: "mysql",
          db_name: tad.TABLE_SCHEMA,
          table_name: base_table_name,
        })
          ? true
          : false;
        let describe_table_q = `DESCRIBE ${tad.TABLE_SCHEMA}.${base_table_name}`;
        let desc_table_result = await rpool(describe_table_q);

        /**check whether it has a changed on field */
        let is_changed_on = false;
        let correct_changed_on_type = {
          Field: "changed_on",
          Type: "timestamp",
          Null: "NO",
          Default: "CURRENT_TIMESTAMP",
        };
        let changed_on = _.where(desc_table_result, correct_changed_on_type);
        let active_record_presence = _.where(desc_table_result, {
          Field: "is_active",
        });

        let is_active = false;

        if (changed_on.length > 0) is_changed_on = true;
        if (active_record_presence.length > 0) is_active = true;
        processed_mysql_available_dbs.push({
          database: tad.TABLE_SCHEMA,
          is_index_available: do_index_exist,
          is_changed_on_valid: is_changed_on,
          is_active_present: is_active,
          correct_changed_on_type: correct_changed_on_type,
        });
      }
      if (index == table_exist_result.length - 1) {
        res.status(200).send({
          err: false,
          msg: "databases retieved!",
          data: processed_mysql_available_dbs,
        });
      }
    }
  } catch (err) {
    console.log(err);
    logger.error(err);
    res.status(500).send({
      err: true,
      msg: "error retrieval failed",
    });
  }
};

/**
 * List all available tables in database
 * @param  {*} req
 * @param  {*} res
 * @author Amal Anush a
 * @version 1.0
 */

module.exports.listTables = async (req, res) => {
  try {
    let base_db_configs = await mongo.client
      .db("elastic_management")
      .collection("m_db_sync_config")
      .findOne({ database_type: "mysql" });
    let base_db = base_db_configs.base_database;
    let list_table_query = `SHOW TABLES FROM ${base_db}`;
    let result = await rpool(list_table_query);

    const transformed = result.map((a) => Object.values(a)[0]);

    res.status(200).send({
      err: false,
      msg: "tables retieved!",
      data: transformed,
    });
  } catch (err) {
    logger.error(err);
    res.status(500).send({
      err: true,
      msg: "error retrieval failed",
      data: err,
    });
  }
};

/**
 * describe the datatypes of base table
 * @param  {*} req
 * @param  {*} res
 * @author Amal Anush a
 * @version 1.0
 */

module.exports.describeBaseTable = async (req, res) => {
  try {
    let base_db_configs = await mongo.client
      .db("elastic_management")
      .collection("m_db_sync_config")
      .findOne({ database_type: "mysql" });
    let base_db = base_db_configs.base_database;

    let desc_query = `DESCRIBE ${base_db}.${req.params.table}`;
    let result = await rpool(desc_query);

    res.status(200).send({
      err: false,
      msg: "info retieved!",
      data: result,
    });
  } catch (err) {
    logger.error(err);
    res.status(500).send({
      err: true,
      msg: "error retrieval failed",
      data: err,
    });
  }
};

/**
 * get all the active tenant dbs
 * @param  {*} req
 * @param  {*} res
 * @author Amal Anush a
 * @version 1.0
 */

getAllActiveTenantDbs = () => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("hi");
      let active_tenants = await mongo.client
        .db("tenants_management")
        .collection("m_tenants")
        .find({
          is_active: true,
          is_local: false,
          // environment: process.env.NODE_ENV,
        })
        .toArray();

      console.log(active_tenants);

      resolve(active_tenants);
    } catch (err) {
      console.log(err);
      logger.error(err);
      reject(err);
    }
  });
};

/**
 * Verify base table column datatype equivalence
 * @param  {*} req
 * @param  {*} res
 * @author Amal Anush a
 * @version 1.0
 */

module.exports.verifyBaseTadTableColumnEquiv = async (req, res) => {
  try {
    let base_db_table = req.body.base_db_table;
    let selected_tad = req.body.selected_tad;
    let columns_to_be_indexed = req.body.columns_to_be_indexed;

    columns_to_be_indexed = columns_to_be_indexed.map((column) => {
      return {
        Field: column.Field,
        Type: column.Type,
      };
    });

    let allowed_databases = [];

    for (let index = 0; index < selected_tad.length; index++) {
      let db = selected_tad[index].database;

      let desc_query = `DESC ${db}.${base_db_table}`;
      let desc_res = await rpool(desc_query);
      desc_res = desc_res.map((column) => {
        return {
          Field: column.Field,
          Type: column.Type,
        };
      });

      let col_res = [];
      let restricSync;
      for (
        let col_index = 0;
        col_index < columns_to_be_indexed.length;
        col_index++
      ) {
        if (_.where(desc_res, columns_to_be_indexed[col_index]).length > 0) {
          col_res.push({
            ..._.where(desc_res, columns_to_be_indexed[col_index])[0],
            mismatch: false,
          });
        } else {
          col_res.push({
            ..._.where(desc_res, {
              Field: columns_to_be_indexed[col_index].Field,
            })[0],
            mismatch: true,
          });
          restricSync = true;
        }

        if (col_index == columns_to_be_indexed.length - 1) {
          allowed_databases.push({
            database: selected_tad[index].database,
            restricSync: restricSync,
            columns_status: col_res,
          });
        }

        if (
          col_index == columns_to_be_indexed.length - 1 &&
          index == selected_tad.length - 1
        ) {
          res.send({
            err: false,
            message: "data retrieved successfully!",
            data: allowed_databases,
          });
        }
      }
    }
  } catch (err) {
    console.error(err);
    logger.error(err);
    res.status(500).send({
      err: true,
      message: err,
    });
  }
};

/**
 *  construct mapping json
 * @param  {*} req
 * @param  {*} res
 * @author Amal Anush a
 * @version 1.0
 */

module.exports.constructMappings = async (req, res) => {
  try {
    let fields = req.body.data.selectedFields;
    let jsonFields = _.where(fields, { Type: "json" });
    console.log(jsonFields);
    let mapping = await this.applyFilters({
      is_default: true,
    });

    res.send({
      err: false,
      message: "mapping constructed succesfully",
      data: mapping,
    });
  } catch (err) {
    res.status(501).send({
      err: true,
      message: err,
    });
  }
};

/**
 * getMappings
 * @param  {*} req
 * @param  {*} res
 * @author Amal Anush a
 * @version 1.0
 */

module.exports.getMappings = async (req, res) => {
  try {
    let filter = req.body.filter;
    let result = await this.applyFilters(filter);
    res.status(200).send({
      err: false,
      message: "Mapping retrieved successfully",
      data: result,
    });
  } catch (err) {
    console.log(err);
    res.status(501).send({
      err: true,
      message: err,
    });
  }
};
/**
 * Apply Filters in mapping
 * @param  {*} req
 * @param  {*} res
 * @author Amal Anush a
 * @version 1.0
 */

module.exports.applyFilters = async (filter) => {
  try {
    let result = await mongo.client
      .db("elastic_management")
      .collection("t_mappings")
      .findOne(filter);
    return Promise.resolve(result.mapping_json);
  } catch (err) {
    console.log(err);
    res.status(501).send({
      err: true,
      message: err,
    });
  }
};

/**
 * Get other databases (Excluding tenant databases)
 * @param  {*} req
 * @param  {*} res
 * @author Amal Anush a
 * @version 1.0
 */

module.exports.getOtherDatabasesList = async (req, res) => {
  try {
    let list_db_query = `SHOW DATABASES`;
    let mysql_available_dbs = await rpool(list_db_query);
    let active_tenants = await getAllActiveTenantDbs();
    let tenant_tads = _.pluck(active_tenants, "tad");
    tenant_tads = _.uniq(tenant_tads);
    mysql_available_dbs = _.pluck(mysql_available_dbs, "Database");
    let other_dbs = _.difference(mysql_available_dbs, tenant_tads);
    final_other_dbs = [];
    other_dbs.forEach((db) => {
      if (!db.includes("integration")) final_other_dbs.push(db);
    });
    res.send({
      err: false,
      data: final_other_dbs,
      message: "Other databases retrieved successfully!",
    });
  } catch (err) {
    console.error(err);
    logger.error(err);
    res.status(501).send({
      err: true,
      message: err,
    });
  }
};

/**
 * testQuery
 * @param  {*} req
 * @param  {*} res
 * @author Amal Anush a
 * @version 1.0
 */

module.exports.testQuery = async (req, res) => {
  try {
    let query = req.body.query_string;

    let result = await pool(query);
    res.status(200).send({
      err: false,
      message: "success",
    });
  } catch (err) {
    console.error(err);
    logger.error(err);
    res.status(501).send({
      err: true,
      message: err,
    });
  }
};
