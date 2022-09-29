const express = require("express");
const router = express.Router();
const role_mgmt_service = require("../services/role_mgmt-service");

/**
 * Route serving login form.
 * @name get/api/v1/getBaseDbRoleGroups
 * @function
 * @memberof module:routers/role_mgmt~role_mgmtRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */

router.get("/v1/getBaseDbRoleGroups", role_mgmt_service.getBaseDbRoleGroups);

/**
 * Route serving login form.
 * @name get/api/v1/updateIndexRoles
 * @function
 * @memberof module:routers/role_mgmt~role_mgmtRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */

router.put("/v1/updateIndexRoles", role_mgmt_service.updateIndexRoles);



module.exports = router;
