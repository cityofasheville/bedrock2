/* eslint-disable no-console */
const { Client } = require('pg');
const pgErrorCodes = require('./pgErrorCodes');

async function updateAsset(pathElements, queryParams, connection) {
  const assetName = pathElements[1];
  const result = {
    error: false,
    message: `Successfully updated asset ${assetName}`,
    result: null,
  };
  const client = new Client(connection);
  await client.connect()
    .catch((err) => {
      console.log(JSON.stringify(err));
      const errmsg = pgErrorCodes[err.code];
      throw new Error([`Postgres error: ${errmsg}`, err]);
    });

  const sql = 'SELECT * FROM bedrock.assets where asset_name like $1';

  let res = await client.query(sql, [assetName])
    .catch((err) => {
      const errmsg = pgErrorCodes[err.code];
      throw new Error([`Postgres error: ${errmsg}`, err]);
    });

  if (res.rowCount === 0) {
    result.error = true;
    result.message = 'Asset not found';
    await client.end();
  } else {
    // Do it here
    await client.end();
  }
  return result;
}

module.exports = updateAsset;
