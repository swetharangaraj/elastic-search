const express = require("express");
const app = express();
const compression = require("compression");
const PORT = 6700;
const logger = require("./logger");
const mongo_conn_native = require("./mongo_conn_native").Connection;

require("./redis-connect")

app.use(express.urlencoded({ extended: false }));
app.use(express.json()); //Used to parse JSON bodies
// compress all responses
app.use(compression());

mongo_conn_native
  .connectToMongo()
  .then(() => {
    console.log("mongo connected!");
    require("./batch_processor");
    require("./stream_processor");
  
  })
  .catch((err) => {
    console.log(err);
  });

app.listen(PORT, () => {
  console.log(`mongolistener listening to ${PORT}`);
});
