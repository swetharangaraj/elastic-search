const amqp = require("amqplib/callback_api");
const config = require("config");
const CONNECTION_URL = config.rabbit_mq_str;

module.exports.channel = null;
var exchange = "publish_process_exchange";
var exchange_type = "direct";

module.exports.start = async () => {
  return new Promise((resolve, reject) => {
    amqp.connect(CONNECTION_URL + "?heartbeat=60", (err, connection) => {
      if (err) {
        console.log("Failed to connect to the URL");
        reject("Failed to connect to the URL");
        throw err;
      }
      connection.on("error", function (err) {
        if (err.message !== "Connection closing") {
          console.error("[AMQP] conn error", err.message);
          reject(err.message);
        }
      });
      connection.on("close", function () {
        console.error("[AMQP] reconnecting");
        return setTimeout(start, 1000);
      });

      console.log("connection to rabbit mq success!");

      connection.createChannel(async (err, channel) => {
        if (err) {
          console.log("Failed to create a Channel");
          throw err;
        }
        channel.assertExchange(exchange, exchange_type, {
          durable: true,
        });
        this.channel = channel;
        console.log("channel,created");
        resolve("channel created");
      });
    });
  });
};
