/* eslint-disable import/extensions */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
import {
  getCustomFieldsInfo, addCustomFieldsInfo, getCustomValues, checkCustomFieldsInfo,
} from '../utilities/assetUtilities.js';
import {
  checkInfo, checkExistence, generateId,
} from '../utilities/utilities.js';

async function baseInsert(body, client) {
  // All is well - let's go ahead and add.
  let tempAsset = null;
  let sql;
  let res;
  let argnum = 6;
  const args = [
    body.asset_id,
    body.asset_name,
    body.description,
    JSON.stringify(body.location),
    body.active,
  ];
  sql = 'INSERT INTO bedrock.assets (asset_id, asset_name, description, location, active';
  let vals = ') VALUES($1, $2, $3, $4, $5';
  const fields = ['owner_id', 'notes', 'link', 'asset_type_id'];
  for (let i = 0; i < fields.length; i += 1) {
    if (fields[i] in body) {
      sql += `, ${fields[i]}`;
      vals += `, $${argnum}`;
      args.push(body[fields[i]]);
      argnum += 1;
    }
  }

  sql += `${vals})`;

  try {
    res = await client.query(sql, args);
  } catch (error) {
    throw new Error(
      `PG error adding new base asset: ${error}`,
    );
  }

  if (res.rowCount !== 1) {
    throw new Error('Unknown error inserting new asset');
  } else {
    tempAsset = new Map([
      ['asset_name', body.asset_name],
      ['description', body.description],
      ['location', body.location],
      ['active', body.active],
      ['asset_type_id', body.asset_type_id],
    ]);
    for (let i = 0; i < fields.length; i += 1) {
      if (fields[0] in body) {
        tempAsset.set(fields[0], body[fields[0]]);
      }
    }
  }
  return tempAsset;
}

async function addDependencies(body, client) {
  if (body.parents?.length > 0) {
    let relation_type = 'PULLS_FROM'
    for (let i = 0; i < body.parents.length; i += 1) {
      const dependency = body.parents[i];
      try {
        await client.query(
          'INSERT INTO bedrock.dependencies (asset_id, dependent_asset_id, relation_type) VALUES ($1, $2, $3)',
          [body.asset_id, dependency, relation_type],
        );
      } catch (error) {
        throw new Error(
          `PG error adding dependencies: ${error}`,
        );
      }
    }
  } else {
    body.parents = [];
  }
  console.log('beep')
  if (body.uses?.length > 0) {
    let relation_type = 'USES'
    for (let i = 0; i < body.uses.length; i += 1) {
      const dependency = body.uses[i];
      try {
        await client.query(
          'INSERT INTO bedrock.dependencies (asset_id, dependent_asset_id, relation_type) VALUES ($1, $2, $3)',
          [body.asset_id, dependency, relation_type],
        );
      } catch (error) {
        throw new Error(
          `PG error adding dependencies: ${error}`,
        );
      }
    }
  } else {
    body.uses = [];
  }
  console.log(body)
  return body;
}

async function addTags(body, client) {
  const tags = [];
  let tmpTags = [];

  // Now add any tags
  if ('tags' in body) {
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
  }

  try {
    for (let i = 0; i < tags.length; i += 1) {
      await client.query(
        'INSERT INTO bedrock.asset_tags (asset_id, tag_id) VALUES ($1, $2)',
        [body.asset_id, tags[i]],
      );
    }
  } catch (error) {
    throw new Error(`PG error adding asset_tags: ${error}`);
  }
  return body.tags;
}

async function addAsset(
  db,
  idField,
  name,
  tableName,
  requiredFields,
  body,
) {

  let customFieldsFromAssetType;
  let customValues;
  let asset;
  const shouldExist = false;
  const bodyWithID = {
    ...body,
  };

  bodyWithID[idField] = generateId();
  const idValue = bodyWithID[idField];
  let customFields = new Map(Object.entries(bodyWithID.custom_fields));

  const response = {
    statusCode: 200,
    message: '',
    result: null,
  };

  let client = await db.newClient();
  await client.query('BEGIN');
  await checkExistence(client, tableName, idField, idValue, name, shouldExist);
  checkInfo(bodyWithID, requiredFields, name, idValue, idField);
  customFieldsFromAssetType = await getCustomFieldsInfo(client, bodyWithID.asset_type_id);
  // customValues are from body, not CV table
  customValues = getCustomValues(bodyWithID);
  checkCustomFieldsInfo(body, customFieldsFromAssetType);
  asset = await baseInsert(bodyWithID, client);
  const updatedCustomFields = await addCustomFieldsInfo(bodyWithID, client, customFields, customValues);
  asset.set('custom_fields', Object.fromEntries(updatedCustomFields));
  let {parents, uses} = await addDependencies(bodyWithID, client);
  asset.set('parents', parents);
  asset.set('uses', uses);
  asset.set('tags', await addTags(bodyWithID, client));
  await client.query('COMMIT');
  asset.set('asset_id', bodyWithID[idField]);
  response.result = Object.fromEntries(asset.entries());
  return response;
}
export default addAsset;
