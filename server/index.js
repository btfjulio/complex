const keys = require('./keys');

//Express App Setup
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser(bodyParser.json()));

// Postgres Client Setup
const { Pool } = require('pg');
const pgClient = new Pool({
  user: keys.pgUser,
  host: keys.pgHost,
  database: keys.pgDatabase,
  password: keys.pgPassword,
  port: keys.pgPort
});
pgClient.on('error', () => console.log('Lost PG connection'));

pgClient.on("connect", (client) => {
  client
    .query("CREATE TABLE IF NOT EXISTS values (number INT)")
    .catch((err) => console.error(err));
});

// Redis Client Setup
const redis = require('redis');
const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000
});
// if we have a client that is listening or publishing info
// it has to have one connection dedicated to its own
// there for we will have a client and a publisher
const redisPublisher = redisClient.duplicate();

// Express route handlers
app.get('/', (req, res) => {
  res.send('Hi');
});

app.get('/values/all', async(req, res) => {
  const values = await pgClient.query('SELECT * from values');

  res.send(values.rows);
});

app.get('/values/current', async(req, res) => {
  // return values hash
  redisClient.hgetall('values', (err, values) => {
    res.send(values);
  })
})

app.post('/values', async(req, res) => {
  const index = req.body.index;

  if(parseInt(index) > 40) {
    return res.status(422).send('Index too high');
  }

  // set a default values in redis hash for index
  redisClient.hset('values', index, 'Nothing yet!');
  // publish a new message to worker
  redisPublisher.publish('insert', index);
  // store the record which was submitted
  pgClient.query('INSERT INTO values(number) VALUES($1)', [index]);

  res.send({ working: true })
})

app.listen(500, err => {
  console.log('Listening')
})