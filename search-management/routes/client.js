const express = require("express");
const router = express.Router();
const client_service = require("../services/client-service");
/**
 * Route serving login form.
 * @name get/api/search/v1/getRoleIndex
 * @function
 * @memberof module:routers/client~clientRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.post("/v1/getRoleIndex", client_service.getRoleIndex);
/**
 * Route getSuggestions
 * @name get/api/search/v1/getSuggestions
 * @function
 * @memberof module:routers/client~clientRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.post("/v1/getSuggestions", client_service.getSuggestions);

/**
 * Route getCompletions
 * @name get/api/search/v1/getCompletions
 * @function
 * @memberof module:routers/client~clientRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.post("/v1/getCompletions", client_service.getCompletions);

/**
 * Route getSearchResults
 * @name POST/api/search/v1/getSearchResults
 * @function
 * @memberof module:routers/client~clientRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.post("/v1/getSearchResults", client_service.getSearchResults);

/**
 * Route getIndexUIFieldMapping
 * @name POST/api/search/v1/getIndexUIFieldMapping
 * @function
 * @memberof module:routers/client~clientRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.post(
  "/v1/getIndexUIFieldMapping",
  client_service.getIndexUIFieldMapping
);

/**
 * Route getIndexFilterResponseTypes
 * @name POST/api/search/v1/getIndexFilterResponseTypes
 * @function
 * @memberof module:routers/client~clientRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.post(
  "/v1/getIndexFilterResponseTypes",
  client_service.getIndexFilterResponseTypes
);

/**
 * Route getFilterFieldValues
 * @name POST/api/search/v1/getFilterFieldValues
 * @function
 * @memberof module:routers/client~clientRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.post("/v1/getFilterFieldValues", client_service.getFilterFieldValues);

/**
 * Route getFilterRangeTypes
 * @name GET/api/search/v1/getFilterRangeTypes
 * @function
 * @memberof module:routers/client~clientRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.get("/v1/getFilterRangeTypes", client_service.getFilterRangeTypes);

/**
 * Route getFilteredResults
 * @name GET/api/search/v1/getFilteredResults
 * @function
 * @memberof module:routers/client~clientRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.post("/v1/getFilteredResults", client_service.getFilteredResults);

/**
 * Route getMinMaxNoFilter
 * @name GET/api/search/v1/getMinMaxNoFilter
 * @function
 * @memberof module:routers/client~clientRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.post("/v1/getMinMaxNoFilter", client_service.getMinMaxNoFilter);

/**
 * Route saveRecentSearchEntry
 * @name GET/api/search/v1/saveRecentSearchEntry
 * @function
 * @memberof module:routers/client~clientRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.post("/v1/saveRecentSearchEntry", client_service.saveRecentSearchEntry);

/**
 * Route getRecentSearches
 * @name GET/api/search/v1/getRecentSearches
 * @function
 * @memberof module:routers/client~clientRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.post("/v1/getRecentSearches", client_service.getRecentSearches);

/**
 * Route getRecentSearches
 * @name GET/api/search/v1/clearRecentSearches
 * @function
 * @memberof module:routers/client~clientRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.post("/v1/clearRecentSearches", client_service.clearRecentSearches);

/**
 * Route getSearchBarRoles
 * @name GET/api/search/v1/getSearchBarRoles
 * @function
 * @memberof module:routers/client~clientRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.get("/v1/getSearchBarRoles", client_service.getSearchBarRoles);

module.exports = router;
