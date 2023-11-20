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

async function readAsset(client, pathElements) {
  let res;
  const sql = `SELECT a.*, e.run_group, e.active as etl_active, d.dependency
    FROM bedrock.assets a
    left join bedrock.etl e on e.asset_name = a.asset_name
    left join bedrock.dependencies d on d.asset_name = a.asset_name
    where a.asset_name like $1`;
  try {
    res = await client.query(sql, [pathElements[1]]);
  } catch (error) {
    throw new Error(
      `PG error getting asset information: ${pgErrorCodes[error.code]}`,
    );
  }
  if (res.rowCount === 0) {
    throw new Error('Asset not found');
  }
  return res.rows;
}

async function addInfo(res, fields, available) {
  const result = {
    asset_name: res[0].asset_name,
  };
  for (let j = 0; j < fields.length; j += 1) {
    const itm = fields[j];
    if (available.includes(itm)) {
      if (itm === 'dependencies') {
        result.dependencies = [];
        for (let i = 0; i < res.length; i += 1) {
          if (res[i].dependency !== null) {
            result.dependencies.push(res[i].dependency);
          }
        }
      } else if (itm === 'etl_run_group') {
        result[itm] = res[0].run_group;
      } else if (itm === 'tags') {
        result[itm] = [];
      } else {
        result[itm] = res[0][itm];
      }
    }
  }
  return result;
}

async function getTags(client, pathElements) {
  const tags = [];
  const res = await client
    .query('SELECT * from bedrock.asset_tags where asset_name like $1', [
      pathElements[1],
    ])
    .catch((error) => {
      throw new Error(
        `PG error getting asset_tags: ${pgErrorCodes[error.code]}`,
      );
    });
  await client.end();
  if (res.rowCount > 0) {
    for (let i = 0; i < res.rowCount; i += 1) {
      if (res.rows[i].tag_name !== null) {
        tags.push(res.rows[i].tag_name);
      }
    }
  }
  return tags;
}

async function getAsset(pathElements, queryParams, connection) {
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

  let res;
  try {
    res = await readAsset(client, pathElements);
  } catch (error) {
    result.error = true;
    result.message = error.message;
    return result;
  }

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

  result.result = await addInfo(res, fields, available);
  if (fields === null || fields.includes('tags')) {
    try {
      res = await getTags(client, pathElements);
      result.result.tags = res;
    } catch (error) {
      result.error = true;
      result.message = error.message;
      result.result = null;
      return result;
    }
  }

  return result;
}

module.exports = getAsset;
