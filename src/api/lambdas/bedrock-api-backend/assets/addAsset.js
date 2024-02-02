/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
const { Client } = require('pg');
const pgErrorCodes = require('../pgErrorCodes');

async function checkInfo(body, pathElements) {
  // Make sure that we have required information

  if (
    !('asset_name' in body)
    || !('description' in body)
    || !('location' in body)
    || !('active' in body)
  ) {
    throw new Error(
      'Asset lacks required property (asset_name, description, location, active)',
    );
  }
  // Make sure that the body includes values for all required custom fields
  if ('asset_type' in body) {
    let sql;
    try {
      sql = `
        select j.asset_type_id, c.id, c.field_name, BOOL_OR(j.required) as required from bedrock.asset_type_custom_fields j
        left join bedrock.custom_fields c
        on j.custom_field_id = c.id
        where j.asset_type_id = '2a044f15-0906-4004-bd23-947269c0e444'
        group by c.id, c.field_name, j.asset_type_id
      `
      res = await client.query(sql, body['asset_type']);
    } catch (error) {
      throw new Error(
        `PG error checking if asset already exists: ${pgErrorCodes[error.code]}`,
      );
    }
  }

  if (res.rowCount > 0) {
    throw new Error('Asset already exists');
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

async function newClient(connection) {
  const client = new Client(connection);

  try {
    await client.connect();
    return client;
  } catch (error) {
    throw new Error(`PG error connecting: ${pgErrorCodes[error.code]}`);
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

async function getCustomFields(client, asset_type) {
  let sql;
  let res;
  let customFields = [];

  try {
    sql = 'SELECT field_name, field_type FROM bedrock.custom_fields where asset_type like $1';
    res = await client.query(sql, [asset_type]);
  } catch (error) {
    throw new Error(
      `PG error getting custom fields: ${pgErrorCodes[error.code]}`,
    );
  }

  if (res.rowCount > 0) {
    customFields = res.rows;
  }
  return customFields;
}

async function baseInsert(body, customFields, client) {
  // All is well - let's go ahead and add. Start by beginning the transaction
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

  // Now see if there are any custom fields
  if (customFields.length > 0) {
    sql = 'INSERT INTO bedrock.custom_values (asset_name, field_name, field_value) VALUES($1, $2, $3)';

    for (let i = 0; i < customFields.length; i += 1) {
      const field_name = customFields[i].field_name;
      if (field_name in body) {
        args = [body.asset_name, field_name, body[field_name]];
        try {
          res = await client.query(sql, args);
        }
        catch (error) {
          throw new Error(`Error inserting custom value ${field_name}: ${pgErrorCodes[error.code]}`);
        }
        asset.set(field_name, body[field_name]);
      }
    }
  }
    
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
  let customFields = [];

  let client;

  const response = {
    error: false,
    message: '',
    result: null,
  };

  try {
    await checkInfo(body, pathElements);
    client = await newClient(connection);
  } catch (error) {
    response.error = true;
    response.message = error.message;
    return response;
  }

  try {
    await checkExistence(client, pathElements);
    if ('asset_type' in body) {
      customFields = await getCustomFields(client, body.asset_type);
    }
  } catch (error) {
    await client.end();
    response.error = true;
    response.message = error.message;
    return response;
  }
  let asset;
  try {
    await client.query('BEGIN');
    asset = await baseInsert(body, customFields, client);
    await addDependencies(asset, body, client);
    await addETL(asset, body, client);
    await addTags(asset, body, client);
    await client.query('COMMIT');
    await client.end();
    response.result = Object.fromEntries(asset.entries());
    return response;
  } catch (error) {
    await client.query('ROLLBACK');
    await client.end();
    response.error = true;
    response.message = error.message;
    return response;
  }
}

module.exports = addAsset;