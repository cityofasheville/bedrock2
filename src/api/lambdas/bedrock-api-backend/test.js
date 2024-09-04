/* eslint-disable import/extensions */
/* eslint-disable no-console */
// Disabling import/no-unresolved because the dependency as defined
// in package.json only works in the build subdirectory.
// eslint-disable-next-line import/no-unresolved
import { getDBConnection } from 'bedrock_common';
import { getDb } from './utilities/dbUtilities.js';

// eslint-disable-next-line camelcase, import/prefer-default-export
(async function lambda_handler(event) {

  const connection = await getDBConnection();
  let db = await getDb(connection);
  
  try {
    let sql = 'SELECT * FROM tagines'

    // let client = await db.newClient();
    // await client.query('BEGIN');
    // const res = await client.query(sql);
    // await client.query('COMMIT');
    // console.log(res.rows);

    const res2 = await db.query(sql);
    console.log(res2.rows);

  } catch (error) {
    console.log(error);
  }
})()