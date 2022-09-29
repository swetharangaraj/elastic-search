const amqp = require("amqplib/callback_api");
const config = require("config");
const CONNECTION_URL = config.rabbit_mq_str;

let ch = null;
var exchange = "publish_process_exchange";
var exchange_type = "direct";

function start() {
  amqp.connect(CONNECTION_URL + "?heartbeat=60", (err, connection) => {
    if (err) {
      console.log("Failed to connect to the URL");
      throw err;
    }
    connection.on("error", function (err) {
      if (err.message !== "Connection closing") {
        console.error("[AMQP] conn error", err.message);
      }
    });
    connection.on("close", function () {
      console.error("[AMQP] reconnecting");
      return setTimeout(start, 1000);
    });
    connection.createChannel(async (err, channel) => {
      if (err) {
        console.log("Failed to create a Channel");
        throw err;
      }
      ch = channel;

      ch.assertExchange(exchange, exchange_type, {
        durable: true,
      });
    });
  });
}

module.exports.publishToBroadCastQueue = async (msg, message_routing_key) => {
  try {
    if (ch) {
      ch.assertExchange(exchange, exchange_type, {
        durable: true,
      });

      var options = {
        persistent: true,
        noAck: false,
      };

      ch.publish(
        exchange,
        message_routing_key,
        Buffer.from(JSON.stringify(msg)),
        options
      );
    } else {
      start();
    }

    return Promise.resolve(1);
  } catch (err) {
    console.log(err);
    return Promise.reject(err);
  }
};

start();
