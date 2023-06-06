/* eslint-disable no-console */
const { Client } = require('pg');
const pgErrorCodes = require('./pgErrorCodes');

async function getAsset(pathElements, queryParams, connection) {
  let res;
  const result = {
    error: false,
    message: '',
    result: {},
  };

  const client = new Client(connection);
  await client.connect()
    .catch((err) => {
      result.error = true;
      result.message = `PG error connecting: ${pgErrorCodes[err.code]}`;
    });

  if (!result.error) {
    const sql = `SELECT a.*, e.run_group, e.active as etl_active, d.dependency
    FROM bedrock.assets a 
    left join bedrock.etl e on e.asset_name = a.asset_name
    left join bedrock.dependencies d on d.asset_name = a.asset_name
    where a.asset_name like $1`;

    res = await client.query(sql, [pathElements[1]])
      .catch((err) => {
        result.error = true;
        result.message = `PG error getting asset information: ${pgErrorCodes[err.code]}`;
      });
  }

  if (result.error) {
    result.result = null;
    return result;
  }

  if (res.rowCount === 0) {
    result.error = true;
    result.message = 'Asset not found';
  } else {
    result.result = {
      asset_name: res.rows[0].asset_name,
      description: res.rows[0].description,
      location: res.rows[0].location,
      active: res.rows[0].active,
      etl_run_group: res.rows[0].run_group,
      etl_active: res.rows[0].etl_active,
      dependencies: [],
      tags: [],
    };
    for (let i = 0; i < res.rowCount; i += 1) {
      if (res.rows[i].dependency !== null) {
        result.result.dependencies.push(res.rows[i].dependency);
      }
    }
  }

  // Now get tags
  res = await client.query('SELECT * from bedrock.asset_tags where asset_name like $1', [pathElements[1]])
    .catch((err) => {
      result.error = true;
      result.message = `PG error getting asset_tags: ${pgErrorCodes[err.code]}`;
      result.result = null;
    });

  if (!result.error && res.rowCount > 0) {
    for (let i = 0; i < res.rowCount; i += 1) {
      if (res.rows[i].tag_name !== null) {
        result.result.tags.push(res.rows[i].tag_name);
      }
    }
  }
  await client.end();
  return result;
}

module.exports = getAsset;
