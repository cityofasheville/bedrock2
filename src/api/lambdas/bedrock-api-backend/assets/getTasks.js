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

async function readTasks(client, pathElements) {
  let res;
  const sqlParams = [pathElements[1]];
  const sql = 'SELECT * FROM bedrock.tasks where asset_name like $1 order by seq_number asc';
  try {
    res = await client.query(sql, sqlParams);
  } catch (error) {
    throw new Error(`PG error getting assets: ${pgErrorCodes[error.code]}`);
  }
  return res;
}

async function getTasks(pathElements, queryParams, connection) {
  const result = {
    error: false,
    message: '',
    result: null,
  };
  const tasks = [];
  let client;

  try {
    client = await newClient(connection);
  } catch (error) {
    result.error = true;
    result.message = error.message;
    return result;
  }

  let res;
  try {
    res = await readTasks(client, pathElements);
  } catch (error) {
    await client.end();
    result.error = true;
    result.message = error.message;
    return result;
  }

  if (res.rowCount === 0) {
    result.message = 'No tasks found';
    return result;
  }

  for (let i = 0; i < res.rowCount; i += 1) {
    tasks.push(
      {
        asset_name: res.rows[i].asset_name,
        seq_number: res.rows[i].seq_number,
        description: res.rows[i].description,
        type: res.rows[i].type,
        active: res.rows[i].active,
        source: res.rows[i].source,
        target: res.rows[i].target,
        configuration: res.rows[i].configuration,
      },
    );
  }

  await client.end();

  result.result = {
    items: tasks,
  };

  return result;
}

module.exports = getTasks;
