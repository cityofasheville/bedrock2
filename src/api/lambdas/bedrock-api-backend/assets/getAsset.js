/* eslint-disable import/extensions */
/* eslint-disable no-console */

import { calculateRequestedFields } from '../utilities/assetUtilities.js';

async function getAssetInfo(db, idValue) {
  let res;
  const sql = `SELECT a.*, d.dependent_asset_id, d.relation_type, c.connection_class
    FROM bedrock.assets a
    left join bedrock.dependencies d on d.asset_id = a.asset_id
    left join bedrock.connections c on c.connection_id = a."location"->>'connection_id'
    where a.asset_id like $1`;
  try {
    res = await db.query(sql, [idValue]);
  } catch (error) {
    console.log(`PG error getting asset information: ${error}`);
    throw new Error(`PG error getting asset information: ${error}`);
  }
  if (res.rowCount === 0) {
    throw new Error('Asset not found');
  }
  return res.rows;
}

async function getCustomFieldInfo(db, assetRows, idValue, requestedFields, overrideFields) {
  // this function is different than getCustomFieldsInfo in assetUtilities. This one queries from
  // the custom_values table, while the other builds a list of needed customfields based on
  // asset type.
  const customValues = new Map();
  if (assetRows[0].asset_type_id !== null) {
    let res;
    let sql = 'SELECT custom_field_id, field_value from bedrock.custom_values where asset_id like $1';
    try {
      res = await db.query(sql, [idValue]);
    } catch (error) {
      console.log(`PG error getting custom fields: ${error}`);
      throw new Error(
        `PG error getting custom fields: ${error}`,
      );
    }
    if (res.rowCount > 0) {
      for (let i = 0; i < res.rowCount; i += 1) {
        if (!overrideFields || requestedFields.includes(res.rows[i].field_name)) {
          customValues.set(res.rows[i].custom_field_id, res.rows[i].field_value);
        }
      }
    }
    sql = 'SELECT * from bedrock.asset_type_custom_fields where asset_type_id like $1';
    try {
      res = await db.query(sql, [assetRows[0].asset_type_id]);
    } catch (error) {
      console.log(`PG error getting custom fields: ${error}`);
      throw new Error(
        `PG error getting custom fields: ${error}`,
      );
    }
    res.rows.forEach((item) => {
      if (!customValues.has(item.custom_field_id)) {
        customValues.set(item.custom_field_id, null)
      }
    })
  }
  return Object.fromEntries(customValues.entries());
}

async function getBaseInfo(assetRows, requestedFields, available) {
  const tempAsset = new Map();
  tempAsset.set('asset_name', assetRows[0].asset_name);
  tempAsset.set('asset_type_id', assetRows[0].asset_type_id);
  tempAsset.set('asset_id', assetRows[0].asset_id);

  for (let j = 0; j < requestedFields.length; j += 1) {
    const itm = requestedFields[j];
    if (available.includes(itm)) {
      if (itm === 'parents') {
        const parents = [];
        const uses = [];
        for (let i = 0; i < assetRows.length; i += 1) {
          if (assetRows[i].dependent_asset_id !== null) {
            if (assetRows[i].relation_type === 'PULLS_FROM') {
              parents.push(assetRows[i].dependent_asset_id);
            }
            if (assetRows[i].relation_type === 'USES') {
              uses.push(assetRows[i].dependent_asset_id);
  
            }
          }
        }
      tempAsset.set('parents', parents);        
      tempAsset.set('uses', uses);
      } else if (itm === 'tags') {
        tempAsset.set('tags', []);
      } else {
        tempAsset.set(itm, assetRows[0][itm]);
      }
    }
  }
  return tempAsset;
}

async function getAssetTags(db, idValue) {
  const tags = [];
  const res = await db
    .query('SELECT * from bedrock.asset_tags where asset_id like $1', [idValue])
    .catch((error) => {
      console.log(`PG error getting asset_tags: ${error}`);
      throw new Error(`PG error getting asset_tags: ${error}`);
    });
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
  db,
  idValue,
  allFields,
) {
  const overrideFields = ('fields' in queryParams);
  const requestedFields = calculateRequestedFields(queryParams, allFields);

  let asset = new Map();
  const response = {
    statusCode: 200,
    message: '',
    result: null,
  };

  const assetRows = await getAssetInfo(db, idValue);
  asset = await getBaseInfo(assetRows, requestedFields, allFields);
  asset.set('custom_fields', await getCustomFieldInfo(db, assetRows, idValue, requestedFields, overrideFields));
  if (requestedFields.includes('tags')) {
    asset.set('tags', await getAssetTags(db, idValue));
  }
  response.result = Object.fromEntries(asset.entries());
  return response;
}

export default getAsset;
