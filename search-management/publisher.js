const no_ack = false;
const is_durable = true;
const exchange = "publish_process_exchange";
const exchange_type = "direct";
const channel = require("./mqCon").channel;

module.exports.publishToBroadCastQueue = async (msg, message_routing_key) => {
  try {
    channel.assertExchange(exchange, exchange_type, {
      durable: is_durable,
    });

    var options = {
      persistent: true,
      noAck: no_ack,
    };

    channel.publish(
      exchange,
      message_routing_key,
      Buffer.from(JSON.stringify(msg)),
      options
    );
    return Promise.resolve(1);
  } catch (err) {
    console.log(err);
    return Promise.reject(err);
  }
};
