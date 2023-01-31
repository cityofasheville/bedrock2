const { Client } = require('pg');
const pgErrorCodes = require('./pgErrorCodes');

async function pgSql(connection, sql) {
  try {
    const client = new Client({
      host: connection.host,
      port: connection.port,
      user: connection.username,
      password: connection.password,
      database: connection.database,
      max: 10,
      idleTimeoutMillis: 10000,
    });
    await client.connect();
    const res = await client.query(sql);

    await client.end();
    return res.rowCount ? `Row count: ${res.rowCount}` : 'Completed';
  } catch (err) {
    const errmsg = pgErrorCodes[err.code];
    throw (new Error(errmsg));
  }
}

module.exports = pgSql;
