/* eslint-disable no-console */
const { Client } = require('pg');
const pgErrorCodes = require('./pgErrorCodes');

async function getTasks(domainName, pathElements, queryParams, connection) {
  const result = {
    error: false,
    message: '',
    result: null,
  };
  const client = new Client(connection);
  await client.connect()
    .catch((err) => {
      result.error = true;
      result.message = `PG error connecting: ${pgErrorCodes[err.code]}`;
    });
  if (result.error) return result;

  // Read the DB
  const sqlParams = [pathElements[1]];
  const sql = 'SELECT * FROM bedrock.tasks where asset_name like $1 order by seq_number asc';
  const res = await client.query(sql, sqlParams)
    .catch((err) => {
      result.error = true;
      result.message = `PG error getting assets: ${pgErrorCodes[err.code]}`;
    });
  console.log(JSON.stringify(res.rows));

  if (!result.error && res.rowCount === 0) {
    result.error = true;
    result.message = 'No tasks found';
  }
  if (result.error) {
    await client.end();
    return result;
  }

  const tasks = [];
  console.log(JSON.stringify(res.rows));
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

  if (!result.error) {
    result.result = {
      items: tasks,
    };
  }

  return result;
}

module.exports = getTasks;
