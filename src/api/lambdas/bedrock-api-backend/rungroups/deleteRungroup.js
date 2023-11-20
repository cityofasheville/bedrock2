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

async function checkExistence(client, rungroupName) {
  // Check that rungroup exists
  const sql = 'SELECT * FROM bedrock.run_groups where run_group_name like $1';
  let res;
  try {
    res = await client.query(sql, [rungroupName]);
  } catch (error) {
    throw new Error(`PG error getting rungroup for delete: ${
      pgErrorCodes[error.code]
    }`);
  }

  if (res.rowCount === 0) {
    throw new Error('Rungroup not found');
  }
}

async function baseDelete(client, rungroupName) {
  await client.query('BEGIN');

  try {
    await client
      .query('delete from run_groups where run_group_name = $1', [
        rungroupName,
      ]);
  } catch (error) {
    throw new Error(`PG error deleting rungroup cron_string: ${pgErrorCodes[error.code]}`);
  }
}

async function deleteRungroup(pathElements, queryParams, connection) {
  const rungroupName = pathElements[1];
  let client;
  const result = {
    error: false,
    message: `Successfully deleted asset ${rungroupName}`,
    result: null,
  };

  try {
    client = await newClient(connection);
  } catch (error) {
    result.error = true;
    result.message = error.message;
    return result;
  }

  try {
    checkExistence(client, rungroupName);
  } catch (error) {
    result.error = true;
    result.message = error.message;
    await client.end();
    return result;
  }

  try {
    await baseDelete(client, rungroupName);
    await client.end();
  } catch (error) {
    result.error = true;
    result.message = error.message;
    await client.end();
  }

  return result;
}

module.exports = deleteRungroup;
