const { Client } = require('pg');

exports.lambda_handler = async function (event, context) {
  let sql = `
  create table bedrock.assets (
    asset_name text primary key not null,
    location text null,
    active bool not null
  );
  `;
  const client = new Client({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: 'postgres',
    max: 10,
    idleTimeoutMillis: 10000,
  });
  await client.connect()
  const res = await client.query(sql)

  await client.end()
  return res;
}
