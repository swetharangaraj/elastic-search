const mongo = require("../mongo_conn_native").Connection;
const _ = require("underscore");
const logger = require("../logger");
const { rpool, pool } = require("../databaseCon");
const axios = require("axios");
const config = require("config");
const bodybuilder = require("bodybuilder");
const e = require("express");
/**
 * client_service module
 * @module client_service
 */

module.exports = {
  /**
   * get my role's indices
   * @param  {*} req
   * @param  {*} res
   * @author Amal Anush a
   * @version 1.0
   */

  getRoleIndex: async (req, res) => {
    try {
      let tad = req.body.tad;
      let oid = req.body.oid;

      let result = await pool(
        `SELECT role_id from ${tad}.m_user_role WHERE oid = '${oid}'`
      );
      if (result.length > 0) {
        let role_id = result[0].role_id;
        let allowed_indices = await mongo.client
          .db("elastic_management")
          .collection("t_indices")
          .aggregate([
            {
              $match: {
                $or: [
                  {
                    db_name: tad,
                    executed_on: "tad",
                    accessible_roleGroups: {
                      $elemMatch: { role_id: role_id },
                    },
                  },
                  {
                    executed_on: "other_db",
                    accessible_roleGroups: {
                      $elemMatch: { role_id: role_id },
                    },
                  },
                ],
              },
            },
            {
              $project: {
                index_name: 1,
                app_name: 1,
                route_url: 1,
              },
            },
          ])
          .toArray();

        res.status(200).send({
          err: false,
          message: "indices retrived successfully!",
          data: allowed_indices,
        });
      } else {
        throw "no roles found";
      }
    } catch (err) {
      logger.error(err);
      console.error(err);
      res.send({
        err: true,
        message: err,
      });
    }
  },

  /**
   * getSuggestions
   * @param  {*} req
   * @param  {*} res
   * @author Amal Anush a
   * @version 1.0
   */

  getSuggestions: async (req, res) => {
    try {
      let indices = req.body.indices;
      let search_key = req.body.search_key;
      const URL = `${config.elastic_url}/${indices.toString()}/_search`;
      const API_KEY = config.elasticApiKey;

      let b_params = {
        // _source: false,
        query: {
          match_phrase_prefix: {
            suggestion_any: search_key,
          },
        },
        fields: ["index_alias_name", "suggestion_any"],
        highlight: {
          fields: {
            suggestion_any: {
              pre_tags: ["<strong>"],
              post_tags: ["</strong>"],
              type: "unified",
            },
          },
        },
      };

      const axios_config = {
        method: "POST",
        url: URL,
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
          "kbn-xsrf": "true",
          Authorization: `ApiKey ${API_KEY}`,
        },
        data: b_params,
      };

      let response = await axios(axios_config);
      let raw_suggestions = response.data.hits.hits;
      let final = [];
      for (let i = 0; i < raw_suggestions.length; i++) {
        if (raw_suggestions[i].highlight) {
          for (
            let j = 0;
            j < raw_suggestions[i].highlight.suggestion_any.length;
            j++
          ) {
            final.push({
              _index: raw_suggestions[i]._index,
              index_alias_name: raw_suggestions[i].fields.index_alias_name[0],
              text: raw_suggestions[i].highlight.suggestion_any[j],
              detail: raw_suggestions[i]._source,
            });
            if (
              i == raw_suggestions.length - 1 &&
              j == raw_suggestions[i].highlight.suggestion_any.length - 1
            ) {
              let formatted_result = final.filter(function (a) {
                var key = a._index + "|" + a.text;
                if (!this[key]) {
                  this[key] = true;
                  return true;
                }
              }, Object.create(null));

              res.status(200).send({
                err: false,
                message: "suggestion retrieved suggessfully",
                data: formatted_result,
              });
            }
          }
        } else {
          final.push({
            _index: raw_suggestions[i]._index,
            index_alias_name: raw_suggestions[i].fields.index_alias_name[0],
            text: raw_suggestions[i].fields.suggestion_any.join(" | "),
            detail: raw_suggestions[i]._source,
          });

          if (i == raw_suggestions.length - 1) {
            let formatted_result = final.filter(function (a) {
              var key = a._index + "|" + a.text;
              if (!this[key]) {
                this[key] = true;
                return true;
              }
            }, Object.create(null));

            res.status(200).send({
              err: false,
              message: "suggestion retrieved suggessfully",
              data: formatted_result,
            });
          }
        }
      }

      // raw_suggestions.forEach((element) => {
      //   if (element.highlight) {
      //     element.highlight.suggestion_any.forEach((suggestion) => {
      //       final.push({
      //         _index: element._index,
      //         index_alias_name: element.fields.index_alias_name[0],
      //         text: suggestion,
      //       });
      //     });
      //   } else {
      //     final.push({
      //       _index: element._index,
      //       index_alias_name: element.fields.index_alias_name[0],
      //       text: element.fields.suggestion_any.join(" | "),
      //     });
      //   }
      // });
      // let formatted_result = final.filter(function (a) {
      //   var key = a.index + "|" + a.term;
      //   if (!this[key]) {
      //     this[key] = true;
      //     return true;
      //   }
      // }, Object.create(null));

      // res.status(200).send({
      //   err: false,
      //   message: "suggestion retrieved suggessfully",
      //   data: formatted_result,
      //   raw: raw_suggestions,
      // });
    } catch (err) {
      logger.error(err);
      console.error(err);
      res.send({
        err: true,
        message: err,
      });
    }
  },

  /**
   * getCompletions
   * @param  {*} req
   * @param  {*} res
   * @author Amal Anush a
   * @version 1.0
   */

  getCompletions: async (req, res) => {
    try {
      let indices = req.body.indices;
      let search_key = req.body.search_key;
      const URL = `${config.elastic_url}/${indices.toString()}/_search`;
      const API_KEY = config.elasticApiKey;

      let b_params = {
        suggest: {
          completer: {
            prefix: search_key,
            completion: {
              field: "complete_any",
              skip_duplicates: true,
              fuzzy: {
                fuzziness: "auto",
              },
            },
          },
        },
      };

      console.log(b_params);

      const axios_config = {
        method: "POST",
        url: URL,
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
          "kbn-xsrf": "true",
          Authorization: `ApiKey ${API_KEY}`,
        },
        data: b_params,
      };

      let response = await axios(axios_config);
      console.log(response.data);
      res.status(200).send({
        err: false,
        message: "completions retrieved suggessfully",
        data: response.data.suggest.completer[0].options,
      });
    } catch (err) {
      logger.error(err);
      console.error(err);
      res.send({
        err: true,
        message: err,
      });
    }
  },

  /**
   * getSearchResults
   * @param  {*} req
   * @param  {*} res
   * @author Amal Anush a
   * @version 1.0
   */

  getSearchResults: async (req, res) => {
    try {
      let indices = req.body.indices;
      let search_key = req.body.search_key;
      let from = req.body.from;
      let size = req.body.size;
      const URL = `${config.elastic_url}/${indices.toString()}/_search`;
      const API_KEY = config.elasticApiKey;

      let b_params = {
        from: from,
        size: size,
        query: {
          query_string: {
            query: `${search_key}~`,
          },
        },
        highlight: {
          fields: {
            "*": {},
          },
          require_field_match: false,
        },
        aggs: {
          apps: {
            terms: { field: "index_alias_name.raw" },
          },
        },
      };

      const axios_config = {
        method: "POST",
        url: URL,
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
          "kbn-xsrf": "true",
          Authorization: `ApiKey ${API_KEY}`,
        },
        data: b_params,
      };

      let response = await axios(axios_config);
      res.status(200).send({
        err: false,
        message: "search results retrieved suggessfully",
        data: {
          took: response.data.took,
          total_count: response.data.hits.total.value,
          search_results: response.data.hits.hits,
          buckets: response.data.aggregations.apps.buckets,
        },
      });
    } catch (err) {
      logger.error(err);
      console.error(err);
      res.send({
        err: true,
        message: err,
      });
    }
  },

  /**
   * getIndexUIFieldMapping
   * @param  {*} req
   * @param  {*} res
   * @author Amal Anush a
   * @version 1.0
   */

  getIndexUIFieldMapping: async (req, res) => {
    try {
      let indices = req.body.indices;
      let result = await mongo.client
        .db("elastic_management")
        .collection("t_index_ui_field_mapping")
        .find({ index_name: { $in: indices } })
        .toArray();
      res.status(200).send({
        err: false,
        message: "ui field mappings retrieved successfully",
        data: result,
      });
    } catch (err) {
      logger.error(err);
      console.error(err);
      res.send({
        err: true,
        message: err,
      });
    }
  },
  /**
   * getIndexFilterResponseTypes
   * @param  {*} req
   * @param  {*} res
   * @author Amal Anush a
   * @version 1.0
   */

  getIndexFilterResponseTypes: async (req, res) => {
    try {
      let index_name = req.body.index_name;
      let responseTypes = await mongo.client
        .db("elastic_management")
        .collection("t_filter_response_types")
        .find({ index: index_name })
        .toArray();
      res.status(200).send({
        err: false,
        message: "index filter response types retrieved successfully!",
        data: responseTypes,
      });
    } catch (err) {
      logger.error(err);
      console.error(err);
      res.send({
        err: true,
        message: err,
      });
    }
  },

  /**
   * getFilterFieldValues
   * @param  {*} req
   * @param  {*} res
   * @author Amal Anush a
   * @version 1.0
   */

  getFilterFieldValues: async (req, res) => {
    try {
      let field_name = req.body.field_name;
      let search_key = req.body.search_key;
      let index = req.body.index;
      let size = req.body.size;
      const URL = `${config.elastic_url}/${index}/_search`;
      const API_KEY = config.elasticApiKey;
      const raw_filter_data = req.body.rawFilterData;
      var query = null;

      let b_params = {};
      if (raw_filter_data) {
        /**
         * Build query body
         */
        var body = bodybuilder();
        body.orQuery("query_string", "query", search_key);

        for (const item in raw_filter_data) {
          // console.log(raw_filter_data[item]);

          let field_data = raw_filter_data[item].fieldData;

          if (field_data.data_type == "text") {
            if (raw_filter_data[item].selectedValues.length > 0)
              body.addFilter(
                "terms",
                `${field_data.field}.raw`,
                raw_filter_data[item].selectedValues
              );
          } else if (
            field_data.data_type == "number" ||
            field_data.data_type == "date"
          ) {
            if (field_data.rangeType == "equal") {
              body.addFilter("term", field_data.field, field_data.expression);
            } else {
              body.addFilter("range", field_data.field, field_data.expression);
            }
          }
        }

        query = body.build().query;
        b_params.query = query;
      } else {
        b_params.query = {
          query_string: {},
        };
        b_params.query.query_string.query = `${search_key}~`;
      }
      b_params.aggs = {
        filter_values: {
          terms: {
            field: `${field_name}.raw`,
            size: size ? size : 100,
          },
        },
      };

      const axios_config = {
        method: "POST",
        url: URL,
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
          "kbn-xsrf": "true",
          Authorization: `ApiKey ${API_KEY}`,
        },
        data: b_params,
      };

      let response = await axios(axios_config);
      res.status(200).send({
        err: false,
        message: "filter values retrieved suggessfully",
        data: response.data.aggregations.filter_values.buckets,
      });
    } catch (err) {
      logger.error(err);
      console.error(err);
      res.send({
        err: true,
        message: err,
      });
    }
  },

  /**
   * getFilterRangeTypes
   * @param  {*} req
   * @param  {*} res
   * @author Amal Anush a
   * @version 1.0
   */

  getFilterRangeTypes: async (req, res) => {
    try {
      let result = await mongo.client
        .db("elastic_management")
        .collection("m_filter_range_types")
        .find()
        .toArray();

      res.status(200).send({
        err: false,
        message: "filter values retrieved suggessfully",
        data: result,
      });
    } catch (err) {
      logger.error(err);
      console.error(err);
      res.send({
        err: true,
        message: err,
      });
    }
  },

  /**
   * getFilteredResults
   * @param  {*} req
   * @param  {*} res
   * @author Amal Anush a
   * @version 1.0
   */

  getFilteredResults: async (req, res) => {
    try {
      let raw_filter_data = req.body.rawFilterData;
      let search_key = req.body.searchKey;

      var body = bodybuilder();
      body.orQuery("query_string", "query", search_key);

      for (const item in raw_filter_data) {
        // console.log(raw_filter_data[item]);

        let field_data = raw_filter_data[item].fieldData;

        if (field_data.data_type == "text") {
          if (raw_filter_data[item].selectedValues.length > 0)
            body.addFilter(
              "terms",
              `${field_data.field}.raw`,
              raw_filter_data[item].selectedValues
            );
        } else if (
          field_data.data_type == "number" ||
          field_data.data_type == "date"
        ) {
          if (field_data.rangeType == "equal") {
            body.addFilter("term", field_data.field, field_data.expression);
          } else {
            body.addFilter("range", field_data.field, field_data.expression);
          }
        }
      }

      console.log(body.build());

      let index = req.body.index;
      let from = req.body.from;
      let size = req.body.size;
      const URL = `${config.elastic_url}/${index}/_search`;
      const API_KEY = config.elasticApiKey;

      let b_params = {
        from: from,
        size: size,
        query: body.build().query,
        highlight: {
          fields: {
            "*": {},
          },
          require_field_match: false,
        },
        aggs: {
          apps: {
            terms: { field: "index_alias_name.raw" },
          },
        },
      };

      const axios_config = {
        method: "POST",
        url: URL,
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
          "kbn-xsrf": "true",
          Authorization: `ApiKey ${API_KEY}`,
        },
        data: b_params,
      };

      let response = await axios(axios_config);
      res.status(200).send({
        err: false,
        message: "search results retrieved suggessfully",
        data: {
          took: response.data.took,
          total_count: response.data.hits.total.value,
          search_results: response.data.hits.hits,
          buckets: response.data.aggregations.apps.buckets,
        },
        b_params: b_params,
      });
    } catch (err) {
      logger.error(err);
      console.error(err);
      res.send({
        err: true,
        message: err,
      });
    }
  },
  /**
   * getMinMaxNoFilter
   * @param  {*} req
   * @param  {*} res
   * @author Amal Anush a
   * @version 1.0
   */

  getMinMaxNoFilter: async (req, res) => {
    try {
      let index = req.body.index;
      const field_name = req.body.fieldName;
      let raw_filter_data = req.body.rawFilterData;
      let search_key = req.body.searchKey;
      let from = req.body.from;
      let size = req.body.size;

      let b_params = {
        aggs: {
          min_val: { min: { field: field_name } },
          max_val: { max: { field: field_name } },
        },
      };

      var body = bodybuilder();
      body.orQuery("query_string", "query", search_key);

      for (const item in raw_filter_data) {
        // console.log(raw_filter_data[item]);

        let field_data = raw_filter_data[item].fieldData;

        if (field_data.data_type == "text") {
          if (raw_filter_data[item].selectedValues.length > 0)
            body.addFilter(
              "terms",
              `${field_data.field}.raw`,
              raw_filter_data[item].selectedValues
            );
        } else if (
          field_data.data_type == "number" &&
          field_data.field != field_name
        ) {
          if (field_data.rangeType == "equal") {
            body.addFilter("term", field_data.field, field_data.expression);
          } else {
            body.addFilter("range", field_data.field, field_data.expression);
          }
        } else if (field_data.data_type == "date") {
          // console.log("hello");
        }
      }

      if (raw_filter_data) {
        b_params.from = from;
        b_params.size = size;
        b_params.query = body.build().query;
      }

      const URL = `${config.elastic_url}/${index}/_search`;
      const API_KEY = config.elasticApiKey;

      const axios_config = {
        method: "POST",
        url: URL,
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
          "kbn-xsrf": "true",
          Authorization: `ApiKey ${API_KEY}`,
        },
        data: b_params,
      };

      let response = await axios(axios_config);

      res.status(200).send({
        err: false,
        message: "num filter min max retrieved suggessfully",
        data: response.data.aggregations,
        b_params: b_params,
      });
    } catch (err) {
      logger.error(err);
      console.error(err);
      res.send({
        err: true,
        message: err,
      });
    }
  },

  /**
   * saveRecentSearchEntry
   * @param  {*} req
   * @param  {*} res
   * @author Amal Anush a
   * @version 1.0
   */

  saveRecentSearchEntry: async (req, res) => {
    try {
      let entry = req.body;
      if (entry.row_data == null || entry.row_data == undefined) {
        let row_data_result = await mongo.client
          .db("elastic_management")
          .collection("t_index_ui_field_mapping")
          .findOne({
            index_name: entry.index_info.index_name,
          });
        entry.row_data = row_data_result.fields;
      }
      entry.timestamp = new Date();
      let result = await mongo.client
        .db("elastic_management")
        .collection("t_recent_searches")
        .insertOne(entry);
      res.status(200).send({
        err: false,
        message: "Entry saved successfully",
        result: result,
      });
    } catch (err) {
      logger.error(err);
      console.error(err);
      res.send({
        err: true,
        message: err,
      });
    }
  },

  /**
   * getRecentSearches
   * @param  {*} req
   * @param  {*} res
   * @author Amal Anush a
   * @version 1.0
   */

  getRecentSearches: async (req, res) => {
    try {
      let domain = req.body.domain;
      let user = req.body.user;
      let result = await mongo.client
        .db("elastic_management")
        .collection("t_recent_searches")
        .find({
          domain: domain,
          user: user,
        })
        .sort({ timestamp: -1 })
        .toArray();
      res.status(200).send({
        err: false,
        message: "recent searches retrieved successfully",
        data: result,
      });
    } catch (err) {
      logger.error(err);
      console.error(err);
      res.send({
        err: true,
        message: err,
      });
    }
  },

  /**
   * clearRecentSearches
   * @param  {*} req
   * @param  {*} res
   * @author Amal Anush a
   * @version 1.0
   */

  clearRecentSearches: async (req, res) => {
    try {
      let domain = req.body.domain;
      let user = req.body.user;
      let result = await mongo.client
        .db("elastic_management")
        .collection("t_recent_searches")
        .deleteMany({
          domain: domain,
          user: user,
        });
      res.status(200).send({
        err: false,
        message: "recent searches deleted successfully",
        data: result,
      });
    } catch (err) {
      logger.error(err);
      console.error(err);
      res.send({
        err: true,
        message: err,
      });
    }
  },

  /**
   * getSearchBarRoles
   * @param  {*} req
   * @param  {*} res
   * @author Amal Anush a
   * @version 1.0
   */

  getSearchBarRoles: async (req, res) => {
    try {
      let feature_enabled_tenants;
      let general_configs = await mongo.client
        .db("elastic_management")
        .collection("m_general_configurations")
        .find()
        .toArray();
      if (general_configs.length > 0) {
        feature_enabled_tenants = general_configs[0].deployed_tenants;
      }

      console.log(feature_enabled_tenants);

      res.status(200).send({
        err: false,
        message: "search bar accessible roleids retrieved",
        data: {
          feature_enabled_tenants: feature_enabled_tenants,
          roles: [1],
        },
      });
    } catch (err) {
      logger.error(err);
      console.error(err);
      res.send({
        err: true,
        message: err,
      });
    }
  },
};
