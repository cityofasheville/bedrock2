/* eslint-disable import/extensions */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
import pgpkg from 'pg';
const { Client } = pgpkg;
import pgErrorCodes from '../pgErrorCodes.js';
import getCustomFieldsInfo from '../common/getCustomFieldInfo.js';

async function newClient(connection) {
  const client = new Client(connection);
  try {
    await client.connect();
    return client;
  } catch (error) {
    throw new Error(`PG error connecting: ${pgErrorCodes[error.code]}`);
  }
}

async function checkBaseInfo(body, assetName) {
  if ('asset_name' in body && body.asset_name !== assetName) {
    throw new Error(`Asset name ${assetName} in path does not match asset name ${body.asset_name} in body`);
  }
}

async function checkExistence(client, assetName) {
  const sql = 'SELECT * FROM bedrock.assets where asset_name like $1';
  let res;
  try {
    res = await client.query(sql, [assetName]);
  } catch (error) {
    throw new Error(`PG error verifying that asset exists: ${pgErrorCodes[error.code]}`);
  }

  if (res.rowCount === 0) {
    throw new Error(`Asset ${assetName} does not exist`);
  }
  return res.rows[0].asset_type;
}

async function getCustomFields(client, asset_type, asset_name) {
  let sql;
  let res;
  let fields = [];
  let values = {};
  // First the fields
  try {
    sql = 'SELECT field_name, field_type FROM bedrock.custom_fields where asset_type like $1';
    res = await client.query(sql, [asset_type]);
  } catch (error) {
    throw new Error(
      `PG error getting custom fields: ${pgErrorCodes[error.code]}`,
    );
  }

  if (res.rowCount > 0) {
    fields = res.rows;
    // Now the values
    try {
      sql = 'SELECT field_name, field_value FROM bedrock.custom_values where asset_name like $1';
      res = await client.query(sql, [asset_name]);
    } catch (error) {
      throw new Error(
        `PG error getting custom fields: ${pgErrorCodes[error.code]}`,
      );
    }
  
    if (res.rowCount > 0) {
      for (let i = 0; i < res.rowCount; i += 1) {
        values[res.rows[i].field_name] = res.rows[i].field_value;
      }
    }
  }

  return { fields, values };
}

function getCustomValues(body) {
  const customValues = new Map();
  if ('custom_fields' in body) {
    for (val in body.custom_fields) {
      customValues.set(val, body.custom_fields[val]);
    }
  }
  return customValues;
}

// The only thing to check for custom fields in an update is
// that they're not trying to set a required value to null
function checkCustomFieldsInfo(customValues, customFields) {
  for (let [id, field] of customFields) {
    if (field.required && customValues.has(id)) {
      if (customValues.get(id) == null) {
        throw new Error(
          `Attempt to unset required custom field ${field.field_display} (id=${id})`,
        );
      }
    }
  }
}

async function updateBase(assetName, body, customValues, client) {
  const members = ['description', 'location', 'active', 'owner_id', 'notes', 'link', 'display_name', 'asset_type'];
  let cnt = 1;
  let args = [];
  let sql = 'UPDATE assets SET ';
  let sqlResult;
  const asset = new Map();
  const currentCustomValues = new Map();

  for (let i = 0, comma = ''; i < members.length; i += 1) {
    if (members[i] in body) {
      sql += `${comma} ${members[i]} = $${cnt}`;
      // Hacky. If we have more JSON types, maybe have a types array above
      if (members[i] === 'location') {
        args.push(JSON.stringify(body[members[i]]));
      } else {
        args.push(body[members[i]]);
      }
      asset.set(members[i], body[members[i]]);
      cnt += 1;
      comma = ',';
    }
  }

  sql += ` where asset_name = $${cnt}`;
  args.push(assetName);
  try {
    await client.query(sql, args);
  } catch (error) {
    throw new Error(`PG error updating base asset: ${pgErrorCodes[error.code]}`);
  }

  // Now see if there are any custom fields
  if (customValues.size > 0) {
    sql = 'select field_id, field_value from custom_values where asset_name like $1';
    try {
      sqlResult = await client.query(sql, [assetName]);
      for (let i = 0; i < sqlResult.rowCount; i += 1) {
        const row = sqlResult.rows[i];
        currentCustomValues.set(row.field_id, row.field_value);
      }
    } catch (error) {
      throw new Error(`Error reading current custom values: ${pgErrorCodes[error.code]}`);
    }
    try {
      for (let [id, cval] of customValues) {
        if (currentCustomValues.has(id)) {
          sql = `
            update bedrock.custom_values set field_value = $1
            where asset_name = $2 and field_id = $3
          `;
          sqlResult = await client.query(sql, [customValues.get(id), assetName, id]);
        } else {
          sql = 'INSERT INTO bedrock.custom_values (asset_name, field_id, field_value) VALUES($1, $2, $3)';
          args = [assetName, id, customValues.get(id)];
          sqlR = await client.query(sql, args);
        }
      }
    } catch (error) {
        throw new Error(`Error updating custom value ${id}: ${pgErrorCodes[error.code]}`);
    }
    asset.set('custom_fields', Object.fromEntries(customValues.entries()));
  }
  return asset;
}

async function updateDependencies(assetName, body, client) {
  // Now add any dependencies, always replacing existing with new

  try {
    await client.query('DELETE FROM dependencies WHERE asset_name = $1', [assetName]);
  } catch (error) {
    throw new Error(`PG error deleting dependencies for update: ${pgErrorCodes[error.code]}`);
  }
  if (body.parents.length > 0) {
    for (let i = 0; i < body.parents.length; i += 1) {
      const dependency = body.parents[i];
      try {
        await client.query(
          'INSERT INTO dependencies (asset_name, dependency) VALUES ($1, $2)',
          [assetName, dependency],
        );
      } catch (error) {
        throw new Error(`PG error updating dependencies: ${pgErrorCodes[error.code]}`);
      }
    }
  }
  return body.parents;
}

async function updateETL(assetName, asset, body, client) {
  const result = {};
  let sql;
  // Now add any ETL information. Null run group means delete

  if ('etl_run_group' in body && body.etl_run_group === null) { // Delete the ETL information
    try {
      await client.query('DELETE FROM etl where asset_name = $1', [assetName]);
    } catch (error) {
      throw new Error(`PG error deleting from etl for update: ${pgErrorCodes[error.code]}`);
    }

    try {
      await client.query('DELETE FROM tasks where asset_name = $1', [assetName]);
    } catch (error) {
      throw new Error(`PG error deleting from tasks for update: ${pgErrorCodes[error.code]}`);
    }
  }

  const members = ['etl_run_group', 'etl_active'];
  let cnt = 1;
  const args = [];
  sql = 'UPDATE etl SET ';

  for (let i = 0, comma = ''; i < members.length; i += 1, comma = ',', cnt += 1) {
    if (members[i] in body) {
      sql += `${comma} ${members[i].substring(4)} = $${cnt}`;
      args.push(body[members[i]]);
      asset.set(members[i], body[members[i]]);
    }
  }
  sql += ` where asset_name = $${cnt}`;
  args.push(assetName);

  try {
    await client.query(sql, args);
  } catch (error) {
    throw new Error(`PG error updating etl: ${pgErrorCodes[error.code]}`);
  }
  return;
}

async function updateTags(assetName, asset, body, client) {
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
    sql = 'SELECT tag_name from bedrock.tags where tag_name in (';
    cnt = 1;
    for (let i = 0, comma = ''; i < tags.length; i += 1, comma = ', ', cnt += 1) {
      sql += `${comma}$${cnt}`;
    }
    sql += ');';
    try {
      res = await client.query(sql, tags);
    } catch (error) {
      throw new Error(`PG error reading tags for update: ${pgErrorCodes[error.code]}`);
    }

    if (res.rowCount !== tags.length) {
      const dbTags = [];
      for (let i = 0; i < res.rowCount; i += 1) {
        dbTags.push(res.rows[i].tag_name);
      }
      for (let i = 0; i < tags.length; i += 1) {
        if (!dbTags.includes(tags[i])) {
          try {
            await client.query(
              'INSERT INTO tags (tag_name) VALUES ($1)',
              [tags[i]],
            );
          } catch (error) {
            throw new Error(`PG error adding tags to tag table for update: ${pgErrorCodes[error.code]}`);
          }
        }
      }
    }

    // Now delete any existing tags
    try {
      await client.query('DELETE FROM bedrock.asset_tags where asset_name = $1', [assetName]);
    } catch (error) {
      throw new Error(`PG error deleting tags for update: ${pgErrorCodes[error.code]}`);
    }

    // And add the new ones back in
    try {
      for (let i = 0; i < tags.length; i += 1) {
        res = await client.query(
          'INSERT INTO bedrock.asset_tags (asset_name, tag_name) VALUES ($1, $2)',
          [body.asset_name, tags[i]],
        );
      }
    } catch (error) {
      throw new Error(`PG error inserting tags for update: ${pgErrorCodes[error.code]}`);
    }
  }
  return tags;
  // End of adding any tags that aren't in the tags table for now
}

async function updateAsset(requestBody, pathElements, queryParams, connection) {
  const body = JSON.parse(requestBody);
  const assetName = pathElements[1];
  let customFields;
  let customValues;
  let client;
  let asset;

  const response = {
    error: false,
    message: `Successfully updated asset ${assetName}`,
    result: null,
  };

  try {
    await checkBaseInfo(body, assetName);
    client = await newClient(connection);
  } catch (error) {
    response.error = true;
    response.message = error.message;
    return response;
  }

  try {
    const asset_type = await checkExistence(client, assetName);
    if (asset_type !== null) {
      customFields = await getCustomFieldsInfo(client, asset_type);
      customValues = getCustomValues(body);
      checkCustomFieldsInfo(customValues, customFields);
    }
  } catch (error) {
    await client.end();
    response.error = true;
    response.message = error.message;
    return response;
  }

  await client.query('BEGIN');

  try {
    asset = await updateBase(assetName, body, customValues, client);
    if ('parents' in body) {
      const parents = await updateDependencies(assetName, body, client);
      asset.set('parents', parents);
    }
    if ('etl_run_group' in body || 'etl_active' in body) {
      await updateETL(assetName, asset, body, client);
    }
    if ('tags' in body) {
      await updateTags(assetName, asset, body, client);
      asset.set('tags', body.tags);
    }
    await client.query('COMMIT');
    response.result = Object.fromEntries(asset.entries());
  } catch (error) {
    await client.query('ROLLBACK');
    await client.end();
    response.error = true;
    response.message = error.message;
  } finally {
    await client.end();
    return response;
  }
}

export default updateAsset;