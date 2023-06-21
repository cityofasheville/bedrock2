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
      result.error = true;
      result.message = `PG error connecting: ${pgErrorCodes[err.code]}`;
    });

  // Check that asset exists
  const sql = 'SELECT * FROM bedrock.assets where asset_name like $1';
  const res = await client.query(sql, [assetName])
    .catch((err) => {
      result.error = true;
      result.message = `PG error getting asset for delete: ${pgErrorCodes[err.code]}`;
    });

  if (!result.error && res.rowCount === 0) {
    result.error = true;
    result.message = 'Asset not found';
    await client.end();
  }
  if (result.error) return result;

  //
  // Now delete all the things within a single transaction
  //
  await client.query('BEGIN');

  await client.query('delete from tasks where asset_name = $1', [pathElements[1]])
    .catch((err) => {
      const errmsg = pgErrorCodes[err.code];
      result.error = true;
      result.message = `PG error deleting asset tasks: ${errmsg}`;
    });

  if (!result.error) {
    await client.query('delete from etl where asset_name = $1', [assetName])
      .catch((err) => {
        const errmsg = pgErrorCodes[err.code];
        result.error = true;
        result.message = `PG error deleting asset etl: ${errmsg}`;
      });
  }

  if (!result.error) {
    await client.query('delete from dependencies where asset_name = $1', [assetName])
      .catch((err) => {
        const errmsg = pgErrorCodes[err.code];
        result.error = true;
        result.message = `PG error deleting asset dependencies: ${errmsg}`;
      });
  }

  if (!result.error) {
    await client.query('delete from bedrock.asset_tags where asset_name = $1', [assetName])
      .catch((err) => {
        const errmsg = pgErrorCodes[err.code];
        result.error = true;
        result.message = `PG error deleting asset tags: ${errmsg}`;
      });
  }

  if (!result.error) {
    await client.query('delete from assets where asset_name = $1;', [assetName])
      .catch((err) => {
        const errmsg = pgErrorCodes[err.code];
        result.error = true;
        result.message = `PG error deleting asset: ${errmsg}`;
      });
  }

  if (result.error) {
    await client.query('ROLLBACK');
  } else {
    await client.query('COMMIT');
  }
  await client.end();

  return result;
}

module.exports = deleteAsset;
