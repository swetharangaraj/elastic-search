const express = require("express");
const router = express.Router();

/**Service imports */
const pipeline_service = require("../services/pipeline-service");

/**
 * Route listAllLogstashPipelinesm.
 * @name get/api/v1/listAllLogstashPipelines
 * @function
 * @memberof module:routers/pipeline~pipelineRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.get(
  "/v1/listAllLogstashPipelines",
  pipeline_service.listAllLogstashPipelines
);

/**
 * Route getPipeline
 * @name get/api/v1/getPipeline/:pipelineId
 * @function
 * @memberof module:routers/pipeline~pipelineRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */

router.get("/v1/getPipeline/:pipelineId", pipeline_service.getPipelineDetails);

/**
 * Route constructPipeline
 * @name get/api/v1/constructPipeline
 * @function
 * @memberof module:routers/pipeline~pipelineRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */

router.post("/v1/constructPipeline", pipeline_service.constructPipeline);

/**
 * Route createPipeline
 * @name get/api/v1/createPipeline
 * @function
 * @memberof module:routers/pipeline~pipelineRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */

router.post("/v1/createPipeline", pipeline_service.createPipeline);

/**
 * Route listAllMongoPipelines
 * @name get/api/v1/listAllMongoPipelines
 * @function
 * @memberof module:routers/pipeline~pipelineRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */

router.get("/v1/listAllMongoPipelines", pipeline_service.listAllMongoPipelines);

module.exports = router;
