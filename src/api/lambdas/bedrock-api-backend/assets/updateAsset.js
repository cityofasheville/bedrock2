/* eslint-disable import/extensions */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */

import {
  getCustomFieldsInfo, addCustomFieldsInfo, getCustomValues, checkCustomFieldsInfo,
} from '../utilities/assetUtilities.js';
import {
  checkInfo, updateInfo, deleteInfo,
} from '../utilities/utilities.js';
import getAsset from './getAsset.js';

async function checkExistence(client, idValue) {
  const sql = 'SELECT * FROM bedrock.assets where asset_id like $1';
  let res;
  try {
    res = await client.query(sql, [idValue]);
  } catch (error) {
    throw new Error(`PG error verifying that asset exists: ${error}`);
  }

  if (res.rowCount === 0) {
    throw new Error(`Asset ${idValue} does not exist`);
  }
}

async function updateDependencies(client, idField, idValue, name, body) {
  // Now add any dependencies, always replacing existing with new

  try {
    await deleteInfo(client, 'bedrock.dependencies', idField, idValue, name);
  } catch (error) {
    throw new Error(`PG error deleting dependencies for update: ${error}`);
  }
  if (body.parents.length > 0) {
    for (let i = 0; i < body.parents.length; i += 1) {
      const dependency = body.parents[i];
      try {
        await client.query(
          'INSERT INTO dependencies (asset_id, dependent_asset_id) VALUES ($1, $2)',
          [idValue, dependency],
        );
      } catch (error) {
        throw new Error(`PG error updating dependencies: ${error}`);
      }
    }
  }
  return body.parents;
}

async function updateTags(idValue, idField, body, client, name) {
  // Finally, update any tags.
  const tags = []; let tmpTags = [];
  let sql; let res; let cnt;
  if (Array.isArray(body.tags)) {
    tmpTags = body.tags;
  } else {
    tmpTags = body.tags.split(',');
  }

  for (let i = 0; i < tmpTags.length; i += 1) {
    const tag = tmpTags[i].trim();
    if (tag.length > 0) {
      tags.push(tag); // Make sure they're cleaned up
    }
  }

  // For now, just add any tags that aren't in the tags table
  if (tags.length > 0) {
    sql = 'SELECT tag_id from bedrock.tags where tag_id in (';
    cnt = 1;
    for (let i = 0, comma = ''; i < tags.length; i += 1, comma = ', ', cnt += 1) {
      sql += `${comma}$${cnt}`;
    }
    sql += ');';
    try {
      res = await client.query(sql, tags);
    } catch (error) {
      throw new Error(`PG error reading tags for update: ${error}`);
    }

    // Now delete any existing tags
    try {
      await deleteInfo(client, 'bedrock.asset_tags', idField, idValue, name);
    } catch (error) {
      throw new Error(`PG error deleting tags for update: ${error}`);
    }

    // And add the new ones back in
    try {
      for (let i = 0; i < tags.length; i += 1) {

        res = await client.query(
          'INSERT INTO bedrock.asset_tags (asset_id, tag_id) VALUES ($1, $2)',
          [body.asset_id, tags[i]],
        );
      }
    } catch (error) {
      throw new Error(`PG error inserting tags for update: ${error}`);
    }
  }
  return tags;
  // End of adding any tags that aren't in the tags table for now
}

async function updateAsset(
  pathElements,
  queryParams,
  db,
  idField,
  idValue,
  name,
  tableName,
  requiredFields,
  allFields,
  body,
) {
  let customFieldsFromAssetType;
  let customValues;
  const baseFields = ['asset_id', 'asset_name', 'description', 'location', 'active', 'owner_id', 'asset_type_id', 'location', 'link', 'notes'];
  const assetType = body.asset_type_id;
  let customFields = new Map(Object.entries(body.custom_fields));


  const response = {
    statusCode: 200,
    message: `Successfully updated asset ${idValue}`,
    result: null,
  };

  checkInfo(body, requiredFields, name, idValue, idField);

  let client = await db.newClient();
  await client.query('BEGIN');
  await checkExistence(client, idValue);
  await updateInfo(client, baseFields, body, tableName, idField, idValue, name);
  if (assetType) {
    customFieldsFromAssetType = await getCustomFieldsInfo(client, body.asset_type_id);
    // CVs are from body, not CVs table!
    customValues = getCustomValues(body);
    checkCustomFieldsInfo(body, customFieldsFromAssetType);
    await deleteInfo(client, 'bedrock.custom_values', idField, idValue, name);
    await addCustomFieldsInfo(body, client, customFields, customValues);
  }
  if ('parents' in body) {
    await updateDependencies(client, idField, idValue, name, body);
  }
  if ('tags' in body) {
    await updateTags(idValue, idField, body, client, name);
  }
  await client.query('COMMIT');
  const responseInfo = await getAsset(
    queryParams,
    client,
    idValue,
    allFields,
  );
  response.result = responseInfo.result;
  return response;
}

export default updateAsset;
