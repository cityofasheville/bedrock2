/* eslint-disable no-await-in-loop */
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

async function checkBaseInfo(client, body, pathElements) {
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

  if (pathElements[1] !== body.asset_name) {
    throw new Error(
      `Asset name ${pathElements[1]} in path does not match asset name ${body.asset_name} in body`,
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

async function checkExistence(client, pathElements) {
  let sql;
  let res;

  try {
    sql = 'SELECT * FROM bedrock.assets where asset_name like $1';
    res = await client.query(sql, [pathElements[1]]);
  } catch (error) {
    throw new Error(
      `PG error checking if asset already exists: ${pgErrorCodes[error.code]}`,
    );
  }

  if (res.rowCount > 0) {
    throw new Error('Asset already exists');
  }
}

async function getCustomFieldsInfo(client, asset_type) {
  let sqlQuery;
  let sqlResult;
  let types = '';
  let customFields = new Map();
  try {
    // Get the asset type hierarchy
    sqlQuery = `
      WITH RECURSIVE ancestors AS (
        SELECT id, parent, name FROM asset_types
        WHERE id = $1
        UNION
          SELECT t.id, t.parent, t.name
          FROM asset_types t
          INNER JOIN ancestors a ON a.parent = t.id
      ) SELECT * FROM ancestors;
    `;
    sqlResult = await client.query(sqlQuery, [asset_type]);
    if (sqlResult.rowCount < 1) {
      console.log(`Asset type ${asset_type} not found`);
      throw new Error(`Asset type ${asset_type} not found`);
    }
    sqlResult.rows.forEach((itm, i) => {
      const comma = i > 0 ? ',' : '';
      types = `${types}${comma} '${itm.id}'`;
    });
    // Now get custom fields associated with any of the types
    sqlQuery = `
      select c.id, c.field_display, j.asset_type_id, j.required
      from bedrock.custom_fields c
      left outer join bedrock.asset_type_custom_fields j
      on c.id = j.custom_field_id
      where j.asset_type_id in (${types})
    `;
    sqlResult = await client.query(sqlQuery, []);
    sqlResult.rows.forEach(itm => {
      customFields.set(itm.id, itm);
    });
  } catch (error) {
    throw new Error(
      `PG error getting asset type hierarchy for type ${asset_type}: ${pgErrorCodes[error.code]}`,
    );
  } 
  return customFields;
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
    if (field.required && !(customValues.has(field.id))) {
      throw new Error(
        `Asset lacks required custom field ${field.field_display} (id=${field.id})`,
      );
    }
  }
}

async function baseInsert(body, customFields, customValues, client) {
  // All is well - let's go ahead and add.
  let asset = null;
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

  if ('owner_id' in body) {
    sql += ', owner_id';
    vals += `, $${argnum}`;
    args.push(body.owner_id);
    argnum += 1;
  }

  if ('notes' in body) {
    sql += ', notes';
    vals += `, $${argnum}`;
    args.push(body.notes);
    argnum += 1;
  }

  if ('link' in body) {
    sql += ', link';
    vals += `, $${argnum}`;
    args.push(body.link);
    argnum += 1;
  }

  if ('display_name' in body) {
    sql += ', display_name';
    vals += `, $${argnum}`;
    args.push(body.display_name);
    argnum += 1;
  }

  if ('asset_type' in body) {
    sql += ', asset_type';
    vals += `, $${argnum}`;
    args.push(body.asset_type);
    argnum += 1;
  }

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
    asset = new Map([
      ['asset_name', body.asset_name],
      ['description', body.description],
      ['location', body.location],
      ['active', body.active],
    ]);
    if ('owner_id' in body) {
      asset.set('owner_id', body.owner_id);
    }
    if ('notes' in body) {
      asset.set('notes', body.notes);
    }
    if ('link' in body) {
      asset.set('link', body.link);
    }
    if ('display_name' in body) {
      asset.set('display_name', body.display_name);
    }
    if ('asset_type' in body) {
      asset.set('asset_type', body.asset_type);
    }
  }

  // Now deal with custom fields
  const customOut = new Map();
  for (let [id, field] of customFields) {
    if (customValues.has(id)) {
      sql = 'INSERT INTO bedrock.custom_values (asset_name, field_id, field_value) VALUES($1, $2, $3)';
      args = [body.asset_name, field.id, customValues.get(field.id).value];
      try {
        res = await client.query(sql, args);
      }
      catch (error) {
        throw new Error(`Error inserting custom value ${id}: ${pgErrorCodes[error.code]}`);
      }
      customOut.set(id, customValues.get(id));
    }
  }
  asset.set('custom_fields', Object.fromEntries(customOut.entries()));
  return asset;
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
    asset.set('parents', body.parents);
  }
  return;
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
    asset.set('etl_run_group', body.etl_run_group);
    asset.set('etl_active', body.etl_active);
  }
  return;
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

  asset.set('tags', body.tags);
  return;
}

async function addAsset(requestBody, pathElements, queryParams, connection) {
  const body = JSON.parse(requestBody);
  let customFields;
  let customValues;
  let transactionStarted = false;

  let client;

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

  let asset;
  try {
    await checkExistence(client, pathElements);
    await checkBaseInfo(client, body, pathElements);
    customFields = await getCustomFieldsInfo(client, body.asset_type);
    customValues = getCustomValues(body);
    checkCustomFieldsInfo(customValues, customFields);

    await client.query('BEGIN');
    transactionStarted = true;
    asset = await baseInsert(body, customFields, customValues, client);
    await addDependencies(asset, body, client);
    await addETL(asset, body, client);
    await addTags(asset, body, client);
    await client.query('COMMIT');
    await client.end();
    response.result = Object.fromEntries(asset.entries());
    return response;
  } catch (error) {
    if (transactionStarted) await client.query('ROLLBACK');
    await client.end();
    response.error = true;
    response.message = error.message;
    return response;
  }
}
module.exports = addAsset;