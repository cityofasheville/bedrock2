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

async function getInfo(client, pathElements) {
  const sql = 'SELECT * FROM bedrock.run_groups where run_group_name like $1';
  let res;
  try {
    res = await client.query(sql, [pathElements[1]]);
  } catch (error) {
    throw new Error([`Postgres error: ${pgErrorCodes[error.code]}`, error]);
  }

  if (res.rowCount === 0) {
    throw new Error('Rungroup not found');
  }
  return res.rows;
}

async function getRungroup(pathElements, queryParams, connection) {
  const result = {
    error: false,
    message: '',
    result: null,
  };

  let client;
  try {
    client = await newClient(connection);
  } catch (error) {
    result.error = true;
    result.message = error.message;
    return result;
  }

  try {
    result.result = await getInfo(client);
    await client.end();
  } catch (error) {
    result.error = true;
    result.message = error.message;
  }

  return result;
}

module.exports = getRungroup;
