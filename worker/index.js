const keys = require('./keys');
const redis = require('redis');

const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000
});

// sub stands for subscription
const sub = redisClient.duplicate();

function fib(index) {
  if (index < 2) return 1;
  return fib(index - 1) + fib(index - 2);
}

// watch redis and execute callback function whenever we receive a message
sub.on('message', (channel, message) => {
  // insert into a hash called values with key { message: fib(message) }
  redisClient.hset('values', message, fib(parseInt(message)))
});
// anytime someone inserts a value to form, call
sub.subscribe('insert');