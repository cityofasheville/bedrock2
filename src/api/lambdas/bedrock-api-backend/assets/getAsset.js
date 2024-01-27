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
    console.log(`PG error getting asset information: ${pgErrorCodes[error.code]}`);
    throw new Error(`PG error getting asset information: ${pgErrorCodes[error.code]}`);
  }
  if (res.rowCount === 0) {
    throw new Error('Asset not found');
  }
  return res.rows;
}

async function addCustomFields(client, asset, requestedFields, fieldsOverride) {
  if (asset.get('asset_type') !== null) {
    let res;
    const sql = 'SELECT field_name, field_value from bedrock.custom_values where asset_name like $1';
    try {
      res = await client.query(sql, [asset.get('asset_name')]);
    } catch (error) {
      console.log(`PG error getting custom fields: ${pgErrorCodes[error.code]}`);
      throw new Error(
        `PG error getting custom fields: ${pgErrorCodes[error.code]}`);
    }
    if (res.rowCount > 0) {
      for (let i = 0; i < res.rowCount; i += 1) {
        if (!fieldsOverride || requestedFields.includes(res.rows[i].field_name)) {
          asset.set(res.rows[i].field_name, res.rows[i].field_value);
        }
      }
    }
  }
  return;
}

async function addBaseFields(asset, assetRows, requestedFields, available) {
  asset.set('asset_name', assetRows[0].asset_name);
  asset.set('asset_type', assetRows[0].asset_type);
  
  for (let j = 0; j < requestedFields.length; j += 1) {
    const itm = requestedFields[j];
    if (available.includes(itm)) {
      if (itm === 'parents') {
        let parents = [];
        for (let i = 0; i < assetRows.length; i += 1) {
          if (assetRows[i].dependency !== null) {
            parents.push(assetRows[i].dependency);
          }
        }
        asset.set('parents', parents);
      } else if (itm === 'etl_run_group') {
        asset.set('etl_run_group', assetRows[0].run_group);
      } else if (itm === 'tags') {
        asset.set('tags', []);
      } else {
        asset.set(itm, assetRows[0][itm]);
      }
    }
  }
  return;
}

async function getTags(client, pathElements) {
  const tags = [];
  const res = await client
    .query('SELECT * from bedrock.asset_tags where asset_name like $1', [
      pathElements[1],
    ])
    .catch((error) => {
      console.log(`PG error getting asset_tags: ${pgErrorCodes[error.code]}`);
      throw new Error(`PG error getting asset_tags: ${pgErrorCodes[error.code]}`);
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
  const available = [
    'display_name',
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
  const asset = new Map();
  let requestedFields = null;
  let client;

  // Use fields from the query if they're present, otherwise use all available
  if ('fields' in queryParams) {
    requestedFields = queryParams.fields.replace('[', '').replace(']', '').split(',');
  } else {
    requestedFields = [...available];
  }

  try {
    client = await newClient(connection);
  } catch (error) {
    result.error = true;
    result.message = error.message;
    return result;
  }

  try {
    const assetRows = await readAsset(client, pathElements);
    await addBaseFields(asset, assetRows, requestedFields, available);
    await addCustomFields(client, asset, requestedFields, ('fields' in queryParams));
    if (requestedFields === null || requestedFields.includes('tags')) {
      const tags = await getTags(client, pathElements);
      asset.set('tags', tags);
    }
  } catch (error) {
    await client.end();
    result.error = true;
    result.message = error.message;
    return result;
  }

  client.end()
  result.result = Object.fromEntries(asset.entries());
  return result;
 }

module.exports = getAsset;
