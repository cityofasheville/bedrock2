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
  const sql = `SELECT a.*, e.run_group, e.active as etl_active, d.dependency, c.connection_class
    FROM bedrock.assets a
    left join bedrock.etl e on e.asset_name = a.asset_name
    left join bedrock.dependencies d on d.asset_name = a.asset_name
    left join bedrock.connections c on c.connection_name = a."location"->>'connection'
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

async function getCustomFields(client, assetRows, fields, fieldsOverride) {
  let res;
  let customFields = [];
  if ('asset_type' in assetRows[0] && assetRows[0].asset_type !== null) {
    const sql = 'SELECT field_name, field_value from bedrock.custom_values where asset_name like $1';
    try {
      res = await client.query(sql, [assetRows[0].asset_name]);
    } catch (error) {
      throw new Error(
        `PG error getting custom fields: ${pgErrorCodes[error.code]}`,
      );
    }
    if (res.rowCount > 0) {
      for (let i = 0; i < res.rowCount; i += 1) {
        if (!fieldsOverride || fields.includes(res.rows[i].field_name)) {
          customFields.push(res.rows[i]);
        }
      }
    }
  }

  return customFields;
}

async function addInfo(res, fields, available) {
  const result = {
    asset_name: res[0].asset_name,
  };
  for (let j = 0; j < fields.length; j += 1) {
    const itm = fields[j];
    if (available.includes(itm)) {
      if (itm === 'parents') {
        result.parents = [];
        for (let i = 0; i < res.length; i += 1) {
          if (res[i].dependency !== null) {
            result.parents.push(res[i].dependency);
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
  let fieldsOverride = false;
  const available = [
    'display_name',
    'asset_type',
    'description',
    'connection_class',
    'location',
    'link',
    'active',
    'owner_id',
    'notes',
    'tags',
    'parents',
    'etl_run_group',
    'etl_active',
  ];
  // Use fields from the query if they're present, otherwise use all available fields
  if ('fields' in queryParams) {
    fields = queryParams.fields.replace('[', '').replace(']', '').split(',');
    fieldsOverride = true;
  } else {
    fields = [...available];
  }

  result.result = await addInfo(res, fields, available);
  const customFields = await getCustomFields(client, res, fields, fieldsOverride);
  if (customFields.length > 0) {
    for (let i = 0; i < customFields.length; i += 1) {
      result.result[customFields[i].field_name] = customFields[i].field_value;
    }
  }

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
