/*
### For one-off queries
```
  await db.query(sql, [param]);
```

### If transactions are needed (no need to call end() or release() or ROLLBACK) 
```
  let client = await db.newClient();
  await client.query('BEGIN');
  await client.query(sql, [param]);
  await client.query('COMMIT');
```
*/

import pgpkg from 'pg';
import pgErrorCodes from '../pgErrorCodes.js';

const { Pool } = pgpkg;

function getErroMsg(error) {
  let code = '';
  if (error.code) {
    code = pgErrorCodes[error.code] || '';
  }
  if (error.details) {
    code += ` ${error.details}`;
  }
  console.log(error.stack); // Full stack error will be returned to CloudWatch
  return `${error.message} ${code}`;
}

async function getDb(connection) {
  let _connection = connection;

  let pool = new Pool(_connection);

  // Use this function for single queries with no transactions. No need to call connect() or end()
  async function query(text, params) {
    try {
      const res = await pool.query(text, params);
      return res;
    } catch (error) {
      throw (`PG query error: ${getErroMsg(error)}`);
    }
  }

  // Use with transactions. Call newClient() to get a client object. Call query() on the client object.
  async function newClient() {
    let _client;
    try {
      _client = await pool.connect();
    } catch (error) {
      throw (`PG connecting error: ${getErroMsg(error)}`);
    }
    async function query(text, params) {
      try {
        const res = await _client.query(text, params);
        if (text === 'COMMIT') {
          await _client.release();
        }
        return res;
      } catch (error) {
        await _client.query('ROLLBACK');
        await _client.release();
        throw (`PG transaction error: ${getErroMsg(error)}`);
      }
    }

    return { query };
  }

  return { query, newClient };

}

export { getDb };
