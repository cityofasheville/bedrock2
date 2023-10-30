/* eslint-disable no-console */
const { Client } = require('pg');
const pgErrorCodes = require('./pgErrorCodes');

async function newClient(result, connection) {
  const client = new Client(connection);
  await client.connect().catch((err) => {
    result.error = true;
    result.message = `PG error connecting: ${pgErrorCodes[err.code]}`;
  });
  return { client };
}

async function readAsset(result, client, pathElements) {
  let res;
  const sql = `SELECT a.*, e.run_group, e.active as etl_active, d.dependency
    FROM bedrock.assets a 
    left join bedrock.etl e on e.asset_name = a.asset_name
    left join bedrock.dependencies d on d.asset_name = a.asset_name
    where a.asset_name like $1`;
  res = await client.query(sql, [pathElements[1]]).catch((err) => {
    result.error = true;
    result.message = `PG error getting asset information: ${
      pgErrorCodes[err.code]
    }`;
  });
  if (res.rowCount === 0) {
    result.error = true;
    result.message = 'Asset not found';
  }
  return { res };
}

async function packageAsset(result, res, client, queryParams, pathElements) {
  let fields = null;
  const available = [
    'description',
    'location',
    'active',
    'owner_id',
    'notes',
    'tags',
    'dependencies',
    'etl_run_group',
    'etl_active',
  ];
  // Use fields from the query if they're present, otherwise use all available fields
  if ('fields' in queryParams) {
    fields = queryParams.fields.replace('[', '').replace(']', '').split(',');
  } else {
    fields = [...available];
  }
  await addInfo(result, res, fields, available);
  if (fields === null || fields.includes('tags')) {
    await addTags(result, client, pathElements);
  }
}

async function addInfo(result, res, fields, available) {
  result.result = {
    asset_name: res.rows[0].asset_name,
  };
  for (const itm of fields) {
    if (available.includes(itm)) {
      if (itm === 'dependencies') {
        result.result.dependencies = [];
        for (let i = 0; i < res.rowCount; i += 1) {
          if (res.rows[i].dependency !== null) {
            result.result.dependencies.push(res.rows[i].dependency);
          }
        }
      } else if (itm === 'etl_run_group') {
        result.result[itm] = res.rows[0].run_group;
      } else if (itm === 'tags') {
        result.result[itm] = [];
      } else {
        result.result[itm] = res.rows[0][itm];
      }
    }
  }
}

async function addTags(result, client, pathElements) {
  res = await client
    .query('SELECT * from bedrock.asset_tags where asset_name like $1', [
      pathElements[1],
    ])
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
}

async function getAsset(pathElements, queryParams, connection) {
  const result = {
    error: false,
    message: '',
    result: {},
  };
  const { client } = await newClient(result, connection);

  if (result.error) {
    result.result = null;
    return result;
  }

  const { res } = await readAsset(result, client, pathElements);

  if (result.error) {
    result.result = null;
    return result;
  }

  await packageAsset(result, res, client, queryParams, pathElements);

  if (result.error) {
    result.result = null;
    return result;
  }

  return result;
}

module.exports = getAsset;
