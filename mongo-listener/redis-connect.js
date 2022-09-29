const redis = require("redis");

const redisClient = redis.createClient({
    url: `redis://:redisroot@${process.env.REDIS_SERVER_PORT || '127.0.0.1:6379'}`
});

redisClient.connect().then(() => {
    console.log("Redis connected");
})
.catch(err => {
    console.log("Redis connection error", err);
});

redisClient.on("error", err => {
    console.log("Redis error", err);
});

module.exports.redisClient = redisClient;