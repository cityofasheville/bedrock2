/* eslint-disable import/extensions */
/* eslint-disable no-console */
import pgpkg from 'pg';
import pgErrorCodes from '../pgErrorCodes.js';
import { calculateRequestedFields } from '../utilities/assetUtilities.js';
import { newClient } from '../utilities/utilities.js';

async function getAssetInfo(client, idValue) {
  let res;
  const sql = `SELECT a.*, e.run_group_id, e.active as etl_active, d.dependent_asset_id, c.connection_class
    FROM bedrock.assets a
    left join bedrock.etl e on e.asset_id = a.asset_id
    left join bedrock.dependencies d on d.asset_id = a.asset_id
    left join bedrock.connections c on c.connection_id = a."location"->>'connection_id'
    where a.asset_id like $1`;
  try {
    res = await client.query(sql, [idValue]);
  } catch (error) {
    console.log(`PG error getting asset information: ${pgErrorCodes[error.code]||error.code}`);
    throw new Error(`PG error getting asset information: ${pgErrorCodes[error.code]||error.code}`);
  }
  if (res.rowCount === 0) {
    throw new Error('Asset not found');
  }
  return res.rows;
}

async function getCustomFieldInfo(client, assetRows, idValue, requestedFields, overrideFields) {
  // this function is different than getCustomFieldsInfo in assetUtilities. This one queries from
  // the custom_values table, while the other builds a list of needed customfields based on
  // asset type.
  const cv = new Map();
  if (assetRows.asset_type !== null) {
    let res;
    const sql = 'SELECT custom_field_id, field_value from bedrock.custom_values where asset_id like $1';
    try {
      res = await client.query(sql, [idValue]);
    } catch (error) {
      console.log(`PG error getting custom fields: ${pgErrorCodes[error.code]||error.code}`);
      throw new Error(
        `PG error getting custom fields: ${pgErrorCodes[error.code]}`,
      );
    }
    if (res.rowCount > 0) {
      for (let i = 0; i < res.rowCount; i += 1) {
        if (!overrideFields || requestedFields.includes(res.rows[i].field_name)) {
          cv.set(res.rows[i].custom_field_id, res.rows[i].field_value);
        }
      }
    }
  }
  return Object.fromEntries(cv.entries());
}

async function getBaseInfo(assetRows, requestedFields, available) {
  const tempAsset = new Map();
  tempAsset.set('asset_name', assetRows[0].asset_name);
  tempAsset.set('asset_type', assetRows[0].asset_type_id);
  tempAsset.set('asset_id', assetRows[0].asset_id);

  for (let j = 0; j < requestedFields.length; j += 1) {
    const itm = requestedFields[j];
    if (available.includes(itm)) {
      if (itm === 'parents') {
        const parents = [];
        for (let i = 0; i < assetRows.length; i += 1) {
          if (assetRows[i].dependent_asset_id !== null) {
            parents.push(assetRows[i].dependent_asset_id);
          }
        }
        tempAsset.set('parents', parents);
      } else if (itm === 'etl_run_group') {
        tempAsset.set('etl_run_group', assetRows[0].run_group);
      } else if (itm === 'tags') {
        tempAsset.set('tags', []);
      } else {
        tempAsset.set(itm, assetRows[0][itm]);
      }
    }
  }
  return tempAsset;
}

async function getAssetTags(client, idValue) {
  const tags = [];
  const res = await client
    .query('SELECT * from bedrock.asset_tags where asset_id like $1', [idValue])
    .catch((error) => {
      console.log(`PG error getting asset_tags: ${pgErrorCodes[error.code]||error.code}`);
      throw new Error(`PG error getting asset_tags: ${pgErrorCodes[error.code]||error.code}`);
    });
  await client.end();
  if (res.rowCount > 0) {
    for (let i = 0; i < res.rowCount; i += 1) {
      if (res.rows[i].tag_id !== null) {
        tags.push(res.rows[i].tag_id);
      }
    }
  }
  return tags;
}

async function getAsset(
  queryParams,
  connection,
  idValue,
  allFields,
) {
  const overrideFields = ('fields' in queryParams);
  const requestedFields = calculateRequestedFields(queryParams, allFields);
  let asset = new Map();
  let client;
  const response = {
    error: false,
    message: '',
    result: null,
  };
  console.log('very beginning')
  try {
    client = await newClient(connection);
    console.log('past clinet0')
  } catch (error) {
    response.error = true;
    response.message = error.message;
    return response;
  }

  console.log('begin')

  try {
    const assetRows = await getAssetInfo(client, idValue);
    console.log('after getAssetInfo')

    asset = await getBaseInfo(assetRows, requestedFields, allFields);
    console.log('after Baseinfo')

    asset.set('custom_fields', await getCustomFieldInfo(client, assetRows, idValue, requestedFields, overrideFields));
    console.log('after custom fields')

    if (requestedFields.includes('tags')) {
      asset.set('tags', await getAssetTags(client, idValue));
      console.log('after tags')

    }
    response.result = Object.fromEntries(asset.entries());
  } catch (error) {
    response.error = true;
    response.message = error.message;
  } finally {
    await client.end();
  }
  return response;
}

export default getAsset;
