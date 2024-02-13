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
  let cv = new Map();
  if (asset.get('asset_type') !== null) {
    let res;
    const sql = 'SELECT field_id, field_value from bedrock.custom_values where asset_name like $1';
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
          cv.set(res.rows[i].field_id, res.rows[i].field_value);
        }
      }
    }
    asset.set('custom_fields', Object.fromEntries(cv.entries()));


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

async function addTags(client, asset, pathElements) {
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
  asset.set('tags', tags);
  return;
}

async function getAsset(pathElements, queryParams, connection) {
  const availableFields = [
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
  const response = {
    error: false,
    message: '',
    result: null,
  };
  const asset = new Map();
  let client;

  // Use fields from the query if they're present, otherwise use all available
  let requestedFields = null;
  if ('fields' in queryParams) {
    requestedFields = queryParams.fields.replace('[', '').replace(']', '').split(',');
  } else {
    requestedFields = [...availableFields];
  }

  try {
    client = await newClient(connection);
  } catch (error) {
    response.error = true;
    response.message = error.message;
    return response;
  }

  try {
    const overrideFields = ('fields' in queryParams);

    const assetRows = await readAsset(client, pathElements);
    await addBaseFields(asset, assetRows, requestedFields, availableFields);
    await addCustomFields(client, asset, requestedFields, overrideFields);
    if (requestedFields.includes('tags')) {
      await addTags(client, asset, pathElements);
    }
  } catch (error) {
    await client.end();
    response.error = true;
    response.message = error.message;
    return response;
  }

  await client.end()
  // Convert the map back to an object
  response.result = Object.fromEntries(asset.entries());
  return response;
 }

module.exports = getAsset;
