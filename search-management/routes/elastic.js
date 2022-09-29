const express = require("express");
const router = express.Router();

/**Service imports */
const elastic_service = require("../services/elastic-service")


/**
 * Route getIndexStats
 * @name get/api/elastic/v1/getIndexStats
 * @function
 * @memberof module:routers/elastic~elasticRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */

router.get("/v1/getIndexStats", elastic_service.getIndexStats);


/**
 * Route to createIndex
 * @name get/api/elastic/v1/createIndex
 * @function
 * @memberof module:routers/elastic~elasticRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
 router.post("/v1/createIndex", elastic_service.createIndex);


 
/**
 * Route createIndexInMongo
 * @name get/api/elastic/v1/createIndexInMongo
 * @function
 * @memberof module:routers/elastic~elasticRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
 router.post("/v1/createIndexInMongo", elastic_service.createIndexInMongo);

 
/**
 * Route getAllIndices
 * @name get/api/elastic/v1/getAllIndices
 * @function
 * @memberof module:routers/elastic~elasticRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
 router.get("/v1/getAllIndices", elastic_service.getAllIndices);
/**
 * Route getIndicesStats
 * @name get/api/elastic/v1/getIndicesStats
 * @function
 * @memberof module:routers/elastic~elasticRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
 router.get("/v1/getIndicesStats", elastic_service.getIndicesStats);
 
/**
 * Route getIndicesStats
 * @name get/api/elastic/v1/deleteIndices
 * @function
 * @memberof module:routers/elastic~elasticRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
 router.delete("/v1/deleteIndices", elastic_service.deleteIndices);


module.exports = router