/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
const { Client } = require('pg');
const pgErrorCodes = require('./pgErrorCodes');

async function newClient(connection) {
  const client = new Client(connection);
  try {
    await client.connect();
    return client;
  } catch (error) {
    throw new Error(`PG error connecting: ${pgErrorCodes[error.code]}`);
  }
}

async function checkInfo(body, assetName) {
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
}

async function baseInsert(assetName, body, client) {
  const members = ['description', 'location', 'active', 'owner_id', 'notes'];
  let cnt = 1;
  const args = [];
  let sql = 'UPDATE assets SET ';
  const result = {};

  for (let i = 0, comma = ''; i < members.length; i += 1) {
    if (members[i] in body) {
      sql += `${comma} ${members[i]} = $${cnt}`;
      // Hacky. If we have more JSON types, maybe have a types array above
      if (members[i] === 'location') {
        args.push(JSON.stringify(body[members[i]]));
      } else {
        args.push(body[members[i]]);
      }
      result[members[i]] = body[members[i]];
      cnt += 1;
      comma = ',';
    }
  }

  sql += ` where asset_name = $${cnt}`;
  args.push(assetName);
  console.log(sql);
  console.log(JSON.stringify(args));
  try {
    await client.query(sql, args);
  } catch (error) {
    throw new Error(`PG error updating base asset: ${pgErrorCodes[error.code]}`);
  }
  return result;
}

async function addDependencies(assetName, body, client) {
  // Now add any dependencies, always replacing existing with new
  const result = {};

  try {
    await client.query('DELETE FROM dependencies WHERE asset_name = $1', [assetName]);
  } catch (error) {
    throw new Error(`PG error deleting dependencies for update: ${pgErrorCodes[error.code]}`);
  }
  if (body.dependencies.length > 0) {
    for (let i = 0; i < body.dependencies.length; i += 1) {
      const dependency = body.dependencies[i];
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
  result.dependencies = body.dependencies;
  return result;
}

async function addETL(assetName, body, client) {
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
      result[members[i]] = body[members[i]];
    }
  }
  sql += ` where asset_name = $${cnt}`;
  args.push(assetName);

  try {
    await client.query(sql, args);
  } catch (error) {
    throw new Error(`PG error updating etl: ${pgErrorCodes[error.code]}`);
  }
  console.log('end etl function');
  return result;
}

async function addTags(assetName, body, client) {
  // Finally, update any tags.
  const result = {};
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
    result.tags = body.tags;
  }
  return result;
  // End of adding any tags that aren't in the tags table for now
}

async function updateAsset(requestBody, pathElements, queryParams, connection) {
  const body = JSON.parse(requestBody);
  const assetName = pathElements[1];
  let client;
  let etlInfo;

  const result = {
    error: false,
    message: `Successfully updated asset ${assetName}`,
    result: {},
  };

  try {
    await checkInfo(body, assetName);
  } catch (error) {
    result.error = true;
    result.message = error.message;
    return result;
  }

  try {
    client = await newClient(connection);
    await checkExistence(client, assetName);
  } catch (error) {
    await client.end();
    result.error = true;
    result.message = error.message;
    return result;
  }

  try {
    await client.query('BEGIN');
    result.result = await baseInsert(assetName, body, client);
    if ('dependencies' in body) {
      result.result.dependencies = await addDependencies(assetName, body, client);
    }
    if ('etl_run_group' in body || 'etl_active' in body) {
      etlInfo = await addETL(assetName, body, client);
      Object.keys(etlInfo).forEach((prop) => {
        result[prop] = etlInfo[prop];
      });
    }
    result.result.tags = await addTags(assetName, body, client);
    if ('tag' in body) {
      result.tags = await addTags(assetName, body, client);
    }
    await client.query('COMMIT');
    await client.end();
  } catch (error) {
    await client.query('ROLLBACK');
    await client.end();
    result.error = true;
    result.message = error.message;
  }

  return result;
}

module.exports = updateAsset;
