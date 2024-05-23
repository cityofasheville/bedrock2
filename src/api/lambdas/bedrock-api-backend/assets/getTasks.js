/* eslint-disable import/extensions */
/* eslint-disable no-console */
import pgpkg from 'pg';
const { Client } = pgpkg;
import pgErrorCodes from '../pgErrorCodes.js';

async function newClient(connection) {
  const client = new Client(connection);
  try {
    await client.connect();
    return client;
  } catch (error) {
    throw new Error(`PG error connecting: ${pgErrorCodes[error.code]}`);
  }
}

async function readTasks(client, assetName) {
  let res;
  const sql = 'SELECT * FROM bedrock.tasks where asset_name like $1 order by seq_number asc';
  try {
    res = await client.query(sql, [assetName]);
  } catch (error) {
    throw new Error(`PG error getting assets: ${pgErrorCodes[error.code]}`);
  }
  return res;
}

function formatTasks(res) {
  let tempTasks = [];
  for (let i = 0; i < res.rowCount; i += 1) {
    tempTasks.push(
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
  return tempTasks;
}

async function getTasks(pathElements, queryParams, connection) {
  const response = {
    error: false,
    message: '',
    result: null,
  };
  let client;
  let res;
  let tasks = [];
  const assetName = pathElements[1];

  try {
    client = await newClient(connection);
  } catch (error) {
    response.error = true;
    response.message = error.message;
    return response;
  }

  try {
    res = await readTasks(client, assetName);
    if (res.rowCount === 0) {
      response.message = 'No tasks found';
    } else {
      tasks = formatTasks(res)
      response.result = {
        items: tasks,
      };
    }
  } catch (error) {
    await client.end();
    response.error = true;
    response.message = error.message;
    return response;
  } finally {
    await client.end()
    return response;
  }
}

export default getTasks;
