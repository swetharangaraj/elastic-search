const { createLogger, format, transports } = require('winston');
// Import mongodb
require('winston-mongodb');
const config = require("config");

module.exports = createLogger({
transports:[

// File transport
    new transports.File({
    filename: 'logs/server.log',
    format:format.combine(
        format.timestamp({format: 'MMM-DD-YYYY HH:mm:ss'}),
        format.align(),
        format.printf(info => `${info.level}: ${[info.timestamp]}: ${info.message}`),
)}),

// MongoDB transport
    new transports.MongoDB({
        level: 'error',
        //mongo database connection link
        db : `${config.mongo_conn_str}/elastic_management`,
        options: {
            useUnifiedTopology: true
        },  
        // A collection to save json formatted logs
        collection: 'search_mgmt_logs',
        cappedMax: 1000,
        format: format.combine(
        format.timestamp(),
        // Convert logs to a json format
        format.json())
    })]
});