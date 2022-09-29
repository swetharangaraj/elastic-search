const mongo = require("../mongo_conn_native").Connection;
const _ = require("underscore");
const logger = require("../logger");
const { rpool, pool } = require("../databaseCon");
/**
 * Role_managenment module
 * @module Role_managenment
 */
module.exports = {
  /**
   * list all roleGroups in base database
   * @param  {*} req
   * @param  {*} res
   * @author Amal Anush a
   * @version 1.0
   */

  getBaseDbRoleGroups: async (req, res) => {
    try {
      let base_db_mysql_result = await mongo.client
        .db("elastic_management")
        .collection("m_db_sync_config")
        .findOne({ database_type: "mysql" });
      let base_db_mysql = base_db_mysql_result.base_database;
      let base_db_role_grp_query = `SELECT role_id, role_name, role_description from ${base_db_mysql}.m_role_group`;
      let base_db_role_grp_result = await rpool(base_db_role_grp_query);
      res.status(200).send({
        err: false,
        data: base_db_role_grp_result,
        message: "role group details retrieved successfully!",
      });
    } catch (err) {
      logger.error(err);
      console.error(err);
      res.status(500).send({
        err: true,
        message: err,
      });
    }
  },

  /**
   * update roles of index
   * @param  {*} req
   * @param  {*} res
   * @author Amal Anush a
   * @version 1.0
   */

  updateIndexRoles: async (req, res) => {
    try {
      let indices = req.body.indices;
      let roles = req.body.roles;
      let update_result = await mongo.client
        .db("elastic_management")
        .collection("t_indices")
        .updateMany(
          { index_name: { $in: indices } },
          { $set: { accessible_roleGroups: roles } }
        );
      res.status(200).send({
        err: false,
        message: "Indices roles updated successfully",
        data: update_result,
      });
    } catch (err) {
      logger.error(err);
      console.error(err);
      res.status(500).send({
        err: true,
        message: err,
      });
    }
  },

 
};
