/* eslint-disable no-console */
const { Client } = require('pg');
const pgErrorCodes = require('./pgErrorCodes');

async function deleteAsset(pathElements, queryParams, connection) {
  const assetName = pathElements[1];
  const result = {
    error: false,
    message: `Successfully deleted asset ${assetName}`,
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

  const res = await client.query(sql, [assetName])
    .catch((err) => {
      const errmsg = pgErrorCodes[err.code];
      throw new Error([`Postgres error: ${errmsg}`, err]);
    });

  if (res.rowCount === 0) {
    result.error = true;
    result.message = 'Asset not found';
    await client.end();
  } else {
    await client.query('delete from tasks where asset_name = $1', [pathElements[1]])
      .catch((err) => {
        const errmsg = pgErrorCodes[err.code];
        result.error = true;
        result.message = `Postgres error deleting asset tasks: ${errmsg}`;
        throw new Error([result.message, err]);
      });

    await client.query('delete from etl where asset_name = $1', [assetName])
      .catch((err) => {
        const errmsg = pgErrorCodes[err.code];
        result.error = true;
        result.message = `Postgres error deleting asset etl: ${errmsg}`;
        throw new Error([result.message, err]);
      });
    await client.query('delete from dependencies where asset_name = $1', [assetName])
      .catch((err) => {
        const errmsg = pgErrorCodes[err.code];
        result.error = true;
        result.message = `Postgres error deleting asset dependencies: ${errmsg}`;
        throw new Error([result.message, err]);
      });
    await client.query('delete from bedrock.asset_tags where asset_name = $1', [assetName])
      .catch((err) => {
        const errmsg = pgErrorCodes[err.code];
        result.error = true;
        result.message = `Postgres error deleting asset tags: ${errmsg}`;
        throw new Error([result.message, err]);
      });
    await client.query('delete from assets where asset_name = $1;', [assetName])
      .catch((err) => {
        const errmsg = pgErrorCodes[err.code];
        result.error = true;
        result.message = `Postgres error deleting asset: ${errmsg}`;
        throw new Error([result.message, err]);
      });
    await client.end();
  }
  return result;
}

module.exports = deleteAsset;
