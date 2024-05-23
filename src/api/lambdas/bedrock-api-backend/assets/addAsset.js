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

async function checkBaseInfo(body) {
  // Make sure that we have all required base fields
  if (
    !('asset_name' in body)
    || !('asset_type' in body)
    || !('description' in body)
    || !('location' in body)
    || !('active' in body)
  ) {
    throw new Error(
      'Asset lacks required property (asset_name, description, location, active)',
    );
  }

  if ('etl_run_group' in body || 'etl_active' in body) {
    if (!('etl_run_group' in body && 'etl_active' in body)) {
      throw new Error(
        'Addition of ETL information requires both etl_run_group and etl_active elements',
      );
    }
  }
}

async function checkExistence(client, idValue) {
  let sql;
  let res;

  try {
    sql = 'SELECT * FROM bedrock.assets where asset_name like $1';
    res = await client.query(sql, [idValue]);
  } catch (error) {
    throw new Error(
      `PG error checking if asset already exists: ${pgErrorCodes[error.code]}`,
    );
  }

  if (res.rowCount > 0) {
    throw new Error('Asset already exists');
  }
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

function checkCustomFieldsInfo(customValues, customFields) {
  for (let [id, field] of customFields) {
    if (field.required && !(customValues.has(id))) {
      throw new Error(
        `Asset lacks required custom field ${field.field_display} (id=${id})`,
      );
    }
  }
}

async function baseInsert(body, customFields, customValues, client) {
  // All is well - let's go ahead and add.
  let tempAsset = null;
  let sql;
  let res;
  let argnum = 5;
  let args = [
    body.asset_name,
    body.description,
    JSON.stringify(body.location),
    body.active,
  ];
  sql = 'INSERT INTO assets (asset_name, description, location, active';
  let vals = ') VALUES($1, $2, $3, $4';
  let fields = ['owner_id', 'notes', 'link', 'display_name', 'asset_type']

  for (let i = 0; i < fields.length; i += 1) {
    if (fields[i] in body) {
      sql += `, ${fields[i]}`;
      vals += `, $${argnum}`;
      args.push(body[fields[i]]);
      argnum += 1;
    }}

  sql += `${vals})`;

  try {
    res = await client.query(sql, args);
  } catch (error) {
    throw new Error(
      `PG error adding new base asset: ${pgErrorCodes[error.code]}`,
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
    ]);
    for (let i = 0; i < fields.length; i += 1) {
      if (fields[0] in body) {
        tempAsset.set(fields[0], body[fields[0]])
      }
  }}

  // Now deal with custom fields
  const customOut = new Map();
  for (let [id, field] of customFields) {
    if (customValues.has(id)) {
      sql = 'INSERT INTO bedrock.custom_values (asset_name, field_id, field_value) VALUES($1, $2, $3)';
      args = [body.asset_name, field.id, customValues.get(field.id)];
      try {
        res = await client.query(sql, args);
      }
      catch (error) {
        throw new Error(`Error inserting custom value ${id}: ${pgErrorCodes[error.code]}`);
      }
      customOut.set(id, customValues.get(id));
    }
  }
  tempAsset.set('custom_fields', Object.fromEntries(customOut.entries()));
  return tempAsset;
}

async function addDependencies(asset, body, client) {
  let parents;

  if ('parents' in body && body.parents.length > 0) {
    for (let i = 0; i < body.parents.length; i += 1) {
      const dependency = body.parents[i];
      try {
        await client.query(
          'INSERT INTO dependencies (asset_name, dependency) VALUES ($1, $2)',
          [body.asset_name, dependency],
        );
      } catch (error) {
        throw new Error(
          `PG error adding dependencies: ${pgErrorCodes[error.code]}`,
        );
      }
    }
  }
  return body.parents;
}

async function addETL(asset, body, client) {
  if ('etl_run_group' in body && 'etl_active' in body) {
    try {
      await client.query(
        'INSERT INTO etl (asset_name, run_group, active) VALUES ($1, $2, $3)',
        [body.asset_name, body.etl_run_group, body.etl_active],
      );
    } catch (error) {
      throw new Error(
        `PG error adding etl information: ${pgErrorCodes[error.code]}`,
      );
    }
  }
  return [body.etl_run_group, body.etl_active];
}

async function addTags(asset, body, client) {
  let sql;
  let res;
  let tags = [];
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

    // For now, just add any tags that aren't in the tags table
    if (tags.length > 0) {
      sql = 'SELECT tag_name from bedrock.tags where tag_name in (';
      for (let i = 0, cnt = 1, comma = ''; i < tags.length; i += 1) {
        sql += `${comma}$${cnt}`;
        cnt += 1;
        comma = ', ';
      }
      sql += ');';

      try {
        res = await client.query(sql, tags);
      } catch (error) {
        throw new Error(
          `PG error reading tags table: ${pgErrorCodes[error.code]}`,
        );
      }

      if (res.rowCount !== tags.length) {
        const dbTags = [];
        for (let i = 0; i < res.rowCount; i += 1) {
          dbTags.push(res.rows[i].tag_name);
        }

        try {
          for (let i = 0; i < tags.length; i += 1) {
            if (!dbTags.includes(tags[i])) {
              await client.query('INSERT INTO tags (tag_name) VALUES ($1)', [
                tags[i],
              ]);
            }
          }
        } catch (error) {
          throw new Error(
            `PG error adding to tags table: ${pgErrorCodes[error.code]}`,
          );
        }
      }
    }
  }
  // End of just adding any tags that aren't in the tags table for now

  try {
    for (let i = 0; i < tags.length; i += 1) {
      res = await client.query(
        'INSERT INTO bedrock.asset_tags (asset_name, tag_name) VALUES ($1, $2)',
        [body.asset_name, tags[i]],
      );
    }
  } catch (error) {
    await client.query('ROLLBACK');
    throw new Error(`PG error adding asset_tags: ${pgErrorCodes[error.code]}`);
  }
  return body.tags;
}

async function addAsset(requestBody, connection) {
  const body = JSON.parse(requestBody);
  let customFields;
  let customValues;
  let asset;
  let client;
  const idValue = body.asset_name;

  const response = {
    error: false,
    message: '',
    result: null,
  };

  try {
    client = await newClient(connection);
  } catch (error) {
    response.error = true;
    response.message = error.message;
    return response;
  }

  await client.query('BEGIN');

  try {
    await checkExistence(client, idValue);
    await checkBaseInfo(body);
    customFields = await getCustomFieldsInfo(client, body.asset_type);
    customValues = getCustomValues(body);
    checkCustomFieldsInfo(customValues, customFields);
    asset = await baseInsert(body, customFields, customValues, client);
    asset.set('parents', await addDependencies(asset, body, client));
    const [runGroup, active] = await addETL(asset, body, client);
    asset.set('etl_run_group', runGroup);
    asset.set('etl_active', active);
    asset.set('tags', await addTags(asset, body, client));
    await client.query('COMMIT');
    await client.end();
    response.result = Object.fromEntries(asset.entries());
  } catch (error) {
    await client.query('ROLLBACK');
    response.error = true;
    response.message = error.message;
  }
  return response;
}

export default addAsset;