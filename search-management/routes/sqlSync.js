const express = require("express");
const router = express.Router();
const sqlsync_service = require("../services/sqlSync-service");

/**
 * Route List Databases
 * @name get/api/sqlSync/v1/listDatabases/:baseDbName/:baseDbTableName
 * @function
 * @memberof module:routers/sqlSync~sqlSyncRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.get(
  "/v1/listDatabases/:baseDbName/:baseDbTableName",
  sqlsync_service.listDatabases
);

/**
 * Route List Tables
 * @name get/api/sqlSync/v1/listTables/:db
 * @function
 * @memberof module:routers/sqlSync~sqlSyncRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */

router.get("/v1/listTables/:db", sqlsync_service.listTables);

/**
 * Route Describe base table
 * @name get/api/sqlSync/v1/descBaseTable/:db/:table
 * @function
 * @memberof module:routers/sqlSync~sqlSyncRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */

router.get("/v1/descBaseTable/:db/:table", sqlsync_service.describeBaseTable);

/**
 * Route Verify Base Table Equivalence
 * @name get/api/sqlSync/v1/verifyBaseTadTableColumnEquiv
 * @function
 * @memberof module:routers/sqlSync~sqlSyncRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.post(
  "/v1/verifyBaseTadTableColumnEquiv",
  sqlsync_service.verifyBaseTadTableColumnEquiv
);

/**
 * Route Construct mappings
 * @name get/api/sqlSync/v1/constructMappings
 * @function
 * @memberof module:routers/sqlSync~sqlSyncRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */

router.post("/v1/constructMappings", sqlsync_service.constructMappings);

/**
 * Route List other Mysql Databases(excluding tenant databases)
 * @name get/api/sqlSync/v1/listOtherMysqlDatabases
 * @function
 * @memberof module:routers/sqlSync~sqlSyncRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */

router.get(
  "/v1/listOtherMysqlDatabases",
  sqlsync_service.getOtherDatabasesList
);
/**
 * Route get Mappings
 * @name get/api/sqlSync/v1/getMappings
 * @function
 * @memberof module:routers/sqlSync~sqlSyncRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.post("/v1/getMappings", sqlsync_service.getMappings);

module.exports = router;
