const { Client } = require('pg');
const fs = require('fs');

lambda_handler = async function (event, context) {
  let sql = fs.readFileSync('./createNewBedrockDB.sql').toString();
  const host = process.env.BEDROCK_DB_HOST_ENDPOINT.split(':')[0];
  console.log('The host is ', host);
  const client = new Client({
    host: host,
    user: 'bedrock',
    password: 'test-bedrock',
    database: 'bedrock',
    max: 10,
    idleTimeoutMillis: 10000,
  });
  await client.connect()
  const res = await client.query(sql);

  await client.end()
  return res;
}

lambda_handler()
