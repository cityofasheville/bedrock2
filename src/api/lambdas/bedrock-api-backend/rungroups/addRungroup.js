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

async function checkInfo(body, pathElements) {
  if (!('run_group_name' in body) || !('cron_string' in body)) {
    throw new Error('Rungroup lacks required property (one of run_group_name or cron_string)');
  }
  if (pathElements[1] !== body.run_group_name) {
    throw new Error(`Rungroup name ${pathElements[1]} in path does not match rungroup name ${body.run_group_name} in body`);
  }
}

async function checkExistence(client, pathElements) {
  const sql = 'SELECT * FROM bedrock.run_groups where run_group_name like $1';
  let res;
  try {
    res = await client.query(sql, [pathElements[1]]);
  } catch (error) {
    throw new Error([`Postgres error: ${pgErrorCodes[error.code]}`, error]);
  }

  if (res.rowCount > 0) {
    throw new Error('Rungroup already exists');
  }
}

async function baseInsert(client, body) {
  let res;
  try {
    res = await client
      .query(
        'INSERT INTO run_groups (run_group_name, cron_string) VALUES($1, $2)',
        [body.run_group_name, body.cron_string],
      );
  } catch (error) {
    throw new Error([`Postgres error: ${pgErrorCodes[error.code]}`, error]);
  }

  if (res.rowCount !== 1) {
    throw new Error('Unknown error inserting new rungroup');
  }

  return {
    run_group_name: body.run_group_name,
    crong_string: body.cron_string,
  };
}

async function addRungroup(requestBody, pathElements, queryParams, connection) {
  const body = JSON.parse(requestBody);
  let client;

  const result = {
    error: false,
    message: '',
    result: null,
  };

  try {
    client = await newClient(connection);
    checkInfo(body, pathElements);
  } catch (error) {
    result.error = true;
    result.message = error.message;
    return result;
  }

  try {
    await checkExistence(client, pathElements);
    result.result = baseInsert(client, body);
    await client.query('COMMIT');
    await client.end();
  } catch (error) {
    result.error = true;
    result.message = error.message;
    await client.query('ROLLBACK');
    await client.end();
  }
  return result;
}

module.exports = addRungroup;
