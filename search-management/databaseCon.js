const mysql = require("mysql");
const config = require("config");
const fs = require("fs");
const logger = require("./logger")
const util = require("util");

let dbConfig = {
  connectionLimit: config.connectionLimit,
  host: config.host,
  user: config.user,
  password: config.password,
  port: config.port,
  debug: config.debug,
  waitForConnections: true,
  multipleStatements: true,
  acquireTimeout:1000000
};

let rdbConfig = {
  connectionLimit: config.connectionLimit,
  host: config.rr_host,
  user: config.rr_user,
  password: config.rr_password,
  port: config.port,
  debug: config.debug,
  waitForConnections: true,
  multipleStatements: true,
  acquireTimeout:1000000
};


if (config.ssl) {
  dbConfig.ssl = {
    ca: fs.readFileSync(__dirname + "/kebs.crt.pem")
  };

  rdbConfig.ssl = {
    ca: fs.readFileSync(__dirname + "/kebs.crt.pem")
  };
}
const pool = mysql.createPool(dbConfig);
const rpool = mysql.createPool(rdbConfig)

module.exports.checkConnection = () => {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
      if (err) {
        logger.error(err);
        if (err.code === "PROTOCOL_CONNECTION_LOST") {
          reject("Database connection was closed.");
        }
        if (err.code === "ER_CON_COUNT_ERROR") {
          reject("Database has too many connections.");
        }
        if (err.code === "ECONNREFUSED") {
          reject("Database connection was refused.");
        }
        reject(err);
      }
      if (connection) {
        logger.info("Connected to database")
        connection.release();
        resolve();
      }
      return;
    });
  });
};

module.exports.checkConnectionR = () => {
  return new Promise((resolve, reject) => {
    rpool.getConnection((err, connection) => {
      if (err) {
        logger.error(err);
        if (err.code === "PROTOCOL_CONNECTION_LOST") {
          reject("Database connection was closed.");
        }
        if (err.code === "ER_CON_COUNT_ERROR") {
          reject("Database has too many connections.");
        }
        if (err.code === "ECONNREFUSED") {
          reject("Database connection was refused.");
        }
        reject(err);
      }
      if (connection) {
        logger.info("Connected to database")
        connection.release();
        resolve();
      }
      return;
    });
  });
};

module.exports.pool = util.promisify(pool.query).bind(pool);

module.exports.rpool = util.promisify(rpool.query).bind(rpool);
