const { Client } = require('@elastic/elasticsearch')
const config = require("config");

module.exports.client = new Client({
  node: config.elastic_url,
  auth: {
    apiKey: config.elasticApiKey
  }
})