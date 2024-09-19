/* eslint-disable no-console */

import { checkExistence } from '../utilities/utilities.js';

async function getInfo(db, idField, idValue, name, tableName) {
  // Querying database to get information. Function can be used multiple times per method
  // if we need information from multiple tables
  const sql = `SELECT * FROM ${tableName} where ${idField} like $1`;
  let res;
  try {
    res = await db.query(sql, [idValue]);
  } catch (error) {
    throw new Error([`Postgres error: ${error}`]);
  }

  return res;
}

async function readTasks(db, idValue) {
  let res;
  const sql = 'SELECT * FROM bedrock.tasks where asset_id like $1 order by seq_number asc';
  try {
    res = await db.query(sql, [idValue]);
  } catch (error) {
    throw new Error(`PG error getting assets: ${error}`);
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

async function getTasks(db, idValue, idField, name) {
  const response = {
    statusCode: 200,
    message: '',
    result: {
      items: [],
      run_group: {
        run_group_id: null,
        active: false,
      }
    }
  };
  let res;
  let tasks = [];
  let runGroup;
  let shouldExist = true;

  await checkExistence(db, 'bedrock.assets', idField, idValue, name, shouldExist)
  res = await readTasks(db, idValue);
  runGroup = await getInfo(db, idField, idValue, name, 'bedrock.etl')
  if (res.rowCount !== 0) {
    tasks = formatTasks(res);
    response.result.items = tasks;
  }
  if (runGroup.rowCount !== 0) {
    response.result.run_group = { run_group_id: runGroup.rows[0].run_group_id, active: runGroup.rows[0].active };
  }

  return response;
}

export default getTasks;