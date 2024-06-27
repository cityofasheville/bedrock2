/* eslint-disable no-console */
import pgpkg from 'pg';
import pgErrorCodes from '../pgErrorCodes.js';
import { getInfo } from '../utilities/utilities.js';

const { Client } = pgpkg;

async function newClient(connection) {
  const client = new Client(connection);
  try {
    await client.connect();
    return client;
  } catch (error) {
    throw new Error(`PG error connecting: ${pgErrorCodes[error.code]||error.code}`);
  }
}

async function readTasks(client, idValue) {
  let res;
  const sql = 'SELECT * FROM bedrock.tasks where asset_id like $1 order by seq_number asc';
  try {
    res = await client.query(sql, [idValue]);
  } catch (error) {
    throw new Error(`PG error getting assets: ${pgErrorCodes[error.code]||error.code}`);
  }
  return res;
}

function formatTasks(res) {
  const tempTasks = [];
  for (let i = 0; i < res.rowCount; i += 1) {
    tempTasks.push(
      {
        task_id: res.rows[i].task_id,
        asset_id: res.rows[i].asset_id,
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

async function getTasks(connection, idValue, idField, name) {
  const response = {
    error: false,
    message: '',
    result: null,
  };
  let client;
  let res;
  let tasks = [];
  let runGroup;

  try {
    client = await newClient(connection);
  } catch (error) {
    response.error = true;
    response.message = error.message;
    return response;
  }

  try {
    res = await readTasks(client, idValue);
    runGroup = await getInfo(client, idField, idValue, name, 'bedrock.etl')
    if (res.rowCount === 0) {
      response.message = 'No tasks found';
    } else {
      tasks = formatTasks(res);
      response.result = {
        items: tasks,
        run_group: {run_group_id: runGroup.run_group_id, active: runGroup.active}
      };
    }
  } catch (error) {
    await client.end();
    response.error = true;
    response.message = error.message;
    return response;
  } finally {
    await client.end();
  }
  return response;
}

export default getTasks;
