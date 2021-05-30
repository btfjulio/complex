module.exports = {
  redisHost: process.env.REDIS_HOST,
  redisPort: process.env.REDIS_PORT
}
// anytime we want to connect to redis, we are going to look
// to the host and the port we supose to connect on our env variables