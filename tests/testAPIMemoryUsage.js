// Testing memory usage of DB queries by pounding on the server in a loop
// (move to bedrock_api-backend folder to run)

// New version, using pool
// doesn't need end() or release() for every query

import { getDBConnection } from 'bedrock_common';
import { getDb } from './utilities/db_utilities.js';

(async () => {
  const formatMemoryUsage = (data) => `${Math.round(data / 1024 / 1024 * 100) / 100} MB`;

  try {
    const connection = await getDBConnection();


    // call this in handler:
    // This creates new Pool, but does NOT connect to any db, so no error likely
    let db = await getDb(connection);

    // monitor run time and memory use
    let first = true;
    let originalMemoryData;
    const start = Date.now();
    for (let i = 0; i < 2; i++) {
      const memoryData = process.memoryUsage();
      if (first) {
        originalMemoryData = memoryData;
        console.log(`Original memory usage: ${formatMemoryUsage(originalMemoryData.rss)}`);
        first = false;
      }

      let diff_rss = memoryData.rss - originalMemoryData.rss;
      console.log(`Diff Memory usage: ${formatMemoryUsage(diff_rss)}`);

      // db object gets passed down instead of connection
      await callSQL(db);
      // await callTransaction(db);

      // client.end();
    }
    const duration = Date.now() - start;
    console.log(`Duration: ${duration}ms`);
  } catch (error) {
    console.log('DB Error: ', error);
  }
  // console.log(res.rows[0]);
})();


async function callSQL(db) {
  const sql = `SELECT a.*, d.dependent_asset_id, c.connection_class
  FROM bedrock.assets a
  left join bedrock.dependencies d on d.asset_id = a.asset_id
  left join bedrock.connections c on c.connection_id = a."location"->>'connection_id'
  where a.asset_id like $1`;

  try {
    let res = await db.query(sql, ['d6ecbf9ad606e9b14afb']);
    console.log(res);
    return res;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

async function callTransaction(db) {
  const sql = `SELECT a.*, d.dependent_asset_id, c.connection_class
  FROM bedrock.assets a
  left join bedrock.dependencies d on d.asset_id = a.asset_id
  left join bedrock.connections c on c.connection_id = a."location"->>'connection_id'
  where a.asset_id like $1`;
  
  let client;
  try {
    client = await db.newClient();
    await client.query('BEGIN');
    let res = await client.query(sql, ['d6ecbf9ad606e9b14afb']);
    await client.query('COMMIT');
    console.log(res.message.rows);
    await client.release();
    return res;
  } catch (error) {
    await client.query('ROLLBACK');
    console.log(error);
    throw error;
    // throw new Error(`PG error getting asset information: ${pgErrorCodes[error.code] || error.code || error}`);
  }

}