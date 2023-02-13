const express = require("express");
const app = express();
const pipeline = require("./routes/pipeline");
const sqlSync = require("./routes/sqlSync");
const mongoSync = require("./routes/mongoSync");
const elastic = require("./routes/elastic");
const search_client = require("./routes/client");
const role_mgmt = require("./routes/role_mgmt");
const compression = require("compression");
const PORT = 6600;
const db = require("./databaseCon");
const logger = require("./logger");
const mongo_conn_native = require("./mongo_conn_native").Connection;
const queueCon = require("./mqCon");
const { error } = require("./logger");
// queueCon.start().then(() => {
//   const delete_index_worker = require("./workers/deleteIndex-worker");
//   const publisher = require("./publisher");
// });

/**
 * worker initialization
 */

app.use(express.urlencoded({ extended: false }));
app.use(express.json()); //Used to parse JSON bodies
// compress all responses
app.use(compression());

// For CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "*");
  res.header("Access-Control-Allow-Headers", "*");
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

//pipelines
app.use("/api/pipeline", pipeline);

// Connecting to the database
db.checkConnection().then(
  () => {
    console.log("connection to mysql successful");
  },

  (err) => {
    console.error(err);
    logger.error("mysqldb connection failed");
  }
);

mongo_conn_native
  .connectToMongo()
  .then(() => {
    app.use("/api/sqlSync", sqlSync);
    app.use("/api/mongoSync", mongoSync);
    app.use("/api/elastic", elastic);
    app.use("/api/role_mgmt", role_mgmt);
    app.use("/api/search", search_client);
    console.log("mongo connected!");
  })
  .catch((err) => {
    console.log(err);
  });

let server = app.listen(PORT, () => {
  console.log(`Search Management service listening to ${PORT}`);
});

module.exports.io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

app.use((req, res, next) => {
  console.log(req.originalUrl);
  req.io = this.io;
  return next();
});
