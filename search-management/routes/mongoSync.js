const express = require("express");
const router = express.Router();
const mongo_sync_service = require("../services/mongoSync-service");

/**
 * Route serving  base database collection list
 * @name get/api/mongoSync/v1/listBaseCollections
 * @function
 * @memberof module:routers/mongoSync~mongoSyncRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */

router.get("/v1/listBaseCollections", mongo_sync_service.listBaseCollections);

/**
 * Route serving all database list
 * @name get/api/mongoSync/v1/getDatabases
 * @function
 * @memberof module:routers/mongoSync~mongoSyncRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */

router.get("/v1/getDatabases", mongo_sync_service.getDatabases);

/**
 * Route serving all database list
 * @name get/api/mongoSync/v1/checkCollectionExistInTenantDbs
 * @function
 * @memberof module:routers/mongoSync~mongoSyncRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */

router.post(
  "/v1/checkCollectionExistInTenantDbs",
  mongo_sync_service.checkCollectionExistInTenantDbs
);

/**
 * Route serving all database list
 * @name get/api/mongoSync/v1/createMongoPipelines
 * @function
 * @memberof module:routers/mongoSync~mongoSyncRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */

router.post(
  "/v1/createMongoPipelines",
  mongo_sync_service.createMongoPipelines
);

/**
 * Route serving all database list
 * @name get/api/mongoSync/v1/listCollectionsOfDatabase
 * @function
 * @memberof module:routers/mongoSync~mongoSyncRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */

router.post(
  "/v1/listCollectionsOfDatabase",
  mongo_sync_service.listCollectionsOfDatabase
);

module.exports = router;
