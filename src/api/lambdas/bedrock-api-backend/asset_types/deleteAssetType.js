/* eslint-disable no-console */
const { Client } = require('pg');
const pgErrorCodes = require('../pgErrorCodes');

async function newClient(connection) {
  const client = new Client(connection);
  try {
    await client.connect();
    return client;
  } catch (error) {
    throw new Error(`PG error connecting: ${pgErrorCodes[error.code]}`);
  }
}

async function checkExistence(client, id) {
  // Check that asset type exists
  const sql = 'SELECT * FROM bedrock.asset_types where id like $1';
  let res;
  try {
    res = await client.query(sql, [id]);
  } catch (error) {
    throw new Error(`PG error getting asset type for delete: ${
      pgErrorCodes[error.code]
    }`);
  }

  if (res.rowCount === 0) {
    throw new Error('Asset rype not found');
  }
}

async function baseDelete(client, id) {

  try {
    await client
      .query('delete from asset_types where id = $1', [
        id,
      ]);
  } catch (error) {
    throw new Error(`PG error deleting asset type cron_string: ${pgErrorCodes[error.code]}`);
  }
}

async function deleteAssetType(pathElements, queryParams, connection) {
  const id = pathElements[1];
  let client;
  const response = {
    error: false,
    message: `Successfully deleted asset type ${id}`,
    result: null,
  };

  try {
    client = await newClient(connection);
  } catch (error) {
    response.error = true;
    response.message = error.message;
    return response;
  }

  try {
    await checkExistence(client, id);
  } catch (error) {
    response.error = true;
    response.message = error.message;
    await client.end();
    return response;
  }

  try {
    await baseDelete(client, id);
  } catch (error) {
    response.error = true;
    response.message = error.message;
  } finally {
    await client.end();
    return response;
  }

}

module.exports = deleteAssetType;
