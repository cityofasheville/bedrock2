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

async function checkExistence(client, assetName) {
  // Check that asset exists
  let res;
  const sql = 'SELECT * FROM bedrock.assets where asset_name like $1';
  try {
    res = await client.query(sql, [assetName]);
  } catch (error) {
    throw new Error(`PG error getting asset for delete: ${pgErrorCodes[error.code]}`);
  }

  if (res.rowCount < 1) {
    throw new Error('Asset does not exist');
  }
}

async function taskDelete(client, assetName) {
  try {
    await client.query('delete from tasks where asset_name = $1', [assetName]);
  } catch (error) {
    throw new Error(`PG error deleting asset tasks: ${pgErrorCodes[error.code]}`);
  }
}

async function dependenciesDelete(client, assetName) {
  try {
    await client.query('delete from dependencies where asset_name = $1', [assetName]);
  } catch (error) {
    throw new Error(`PG error deleting asset dependencies: ${pgErrorCodes[error.code]}`);
  }
}

async function etlDelete(client, assetName) {
  try {
    await client.query('delete from etl where asset_name = $1', [assetName]);
  } catch (error) {
    throw new Error(`PG error deleting asset ETL: ${pgErrorCodes[error.code]}`);
  }
}

async function tagsDelete(client, assetName) {
  try {
    await client.query('delete from bedrock.asset_tags where asset_name = $1', [assetName]);
  } catch (error) {
    throw new Error(`PG error deleting asset tags: ${pgErrorCodes[error.code]}`);
  }
}

async function customFieldsDelete (client, assetName) {
  try {
    await client.query('delete from bedrock.custom_values where asset_name = $1', [assetName]);
  } catch (error) {
    throw new Error(`PG error deleting asset custom values: ${pgErrorCodes[error.code]}`);
  }
}

async function baseDelete(client, assetName) {
  try {
    await client.query('delete from assets where asset_name = $1;', [assetName]);
  } catch (error) {
    throw new Error(`PG error deleting asset: ${pgErrorCodes[error.code]}`);
  }
}

async function deleteAsset(pathElements, queryParams, connection) {
  const assetName = pathElements[1];
  let client;
  // no need for building a map object to send to the requester, as we only return the asset name. 
  const response= {
    error: false,
    message: `Successfully deleted asset ${assetName}`,
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
    await checkExistence(client, assetName);
  } catch (error) {
    await client.end();
    response.error = true;
    response.message = error.message;
    return response;
  }

  await client.query('BEGIN');

  try {
    await taskDelete(client, assetName);
    await dependenciesDelete(client, assetName);
    await etlDelete(client, assetName);
    await tagsDelete(client, assetName);
    await customFieldsDelete(client, assetName);
    await baseDelete(client, assetName);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    response.error = true;
    response.message = error.message;
  } finally {
    await client.end();
    return response;
  }

}

module.exports = deleteAsset;
