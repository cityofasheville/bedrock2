/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
const { Client } = require('pg');
const pgErrorCodes = require('./pgErrorCodes');

async function addAsset(requestBody, pathElements, queryParams, connection) {
  const result = {
    error: false,
    message: '',
    result: null,
  };
  const body = JSON.parse(requestBody);
  let sql;
  let res;

  // Make sure that we have required information
  if (!('asset_name' in body)
   || !('description' in body)
   || !('location' in body)
   || !('active' in body)) {
    result.error = true;
    result.message = 'Asset lacks required property (asset_name, description, location, active)';
    result.result = body;
  }

  if (!result.error && pathElements[1] !== body.asset_name) {
    result.error = true;
    result.message = `Asset name ${pathElements[1]} in path does not match asset name ${body.asset_name} in body`;
  }

  if (!result.error && ('etl_run_group' in body || 'etl_active' in body)) {
    if (!('etl_run_group' in body && 'etl_active' in body)) {
      result.error = true;
      result.message = 'Addition of ETL information requires both etl_run_group and etl_active elements';
    }
  }
  if (result.error) {
    result.result = null;
    return result;
  }

  const client = new Client(connection);
  await client.connect()
    .catch((err) => {
      result.error = true;
      result.message = `PG error connecting: ${pgErrorCodes[err.code]}`;
    });

  if (!result.error) {
    sql = 'SELECT * FROM bedrock.assets where asset_name like $1';
    res = await client.query(sql, [pathElements[1]])
      .catch((err) => {
        result.error = true;
        result.message = `PG error checking if asset already exists: ${pgErrorCodes[err.code]}`;
      });
    if (!result.error && res.rowCount > 0) {
      result.error = true;
      result.message = 'Asset already exists';
    }
  }
  if (result.error) {
    result.result = null;
    client.end();
    return result;
  }

  //
  // All is well - let's go ahead and add. Start by beginning the transaction
  //
  await client.query('BEGIN');
  let argnum = 5;
  const args = [body.asset_name, body.description, JSON.stringify(body.location), body.active];
  sql = 'INSERT INTO assets (asset_name, description, location, active'
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
  sql += `${vals})`;
  console.log(sql);
  res = await client.query(sql, args)
    .catch((err) => {
      result.error = true;
      result.message = `PG error adding new base asset: ${pgErrorCodes[err.code]}`;
    });

  if (!result.error) {
    if (res.rowCount !== 1) {
      result.error = true;
      result.message = 'Unknown error inserting new asset';
    } else {
      result.result = {
        asset_name: body.asset_name,
        description: body.description,
        location: body.location,
        active: body.active,
      };
      if ('owner_id' in body) {
        result.result.owner_id = body.owner_id;
      }
      if ('notes' in body) {
        result.result.notes = body.notes;
      }
    }
  }

  // Now add any dependencies
  if (!result.error && ('dependencies' in body) && body.dependencies.length > 0) {
    for (let i = 0; i < body.dependencies.length && !result.error; i += 1) {
      const dependency = body.dependencies[i];
      res = await client.query(
        'INSERT INTO dependencies (asset_name, dependency) VALUES ($1, $2)',
        [body.asset_name, dependency],
      )
        .catch((err) => {
          result.error = true;
          result.message = `PG error adding dependencies: ${pgErrorCodes[err.code]}`;
        });
    }
    result.result.dependencies = body.dependencies;
  }

  // Now add any ETL information
  if (!result.error && ('etl_run_group' in body && 'etl_active' in body)) {
    res = await client.query(
      'INSERT INTO etl (asset_name, run_group, active) VALUES ($1, $2, $3)',
      [body.asset_name, body.etl_run_group, body.etl_active],
    )
      .catch((err) => {
        result.error = true;
        result.message = `PG error adding etl information: ${pgErrorCodes[err.code]}`;
      });
    result.result.etl_run_group = body.etl_run_group;
    result.result.etl_active = body.etl_active;
  }

  // Now add any tags
  if (!result.error && 'tags' in body) {
    const tags = []; let tmpTags = [];
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
      res = await client.query(sql, tags)
        .catch((err) => {
          result.error = true;
          result.message = `PG error reading tags table: ${pgErrorCodes[err.code]}`;
        });
      if (!result.error && res.rowCount !== tags.length) {
        const dbTags = [];
        for (let i = 0; i < res.rowCount; i += 1) {
          dbTags.push(res.rows[i].tag_name);
        }
        for (let i = 0; i < tags.length && !result.error; i += 1) {
          if (!dbTags.includes(tags[i])) {
            await client.query(
              'INSERT INTO tags (tag_name) VALUES ($1)',
              [tags[i]],
            )
              .catch((err) => {
                result.error = true;
                result.message = `PG error adding to tags table: ${pgErrorCodes[err.code]}`;
              });
          }
        }
      }
    }
    // End of just adding any tags that aren't in the tags table for now

    if (!result.error) {
      for (let i = 0; i < tags.length && !result.error; i += 1) {
        res = await client.query(
          'INSERT INTO bedrock.asset_tags (asset_name, tag_name) VALUES ($1, $2)',
          [body.asset_name, tags[i]],
        )
          .catch((err) => {
            result.error = true;
            result.message = `PG error adding asset_tags: ${pgErrorCodes[err.code]}`;
          });
      }
      result.result.tags = body.tags;
    }
  }
  if (result.error) {
    await client.query('ROLLBACK');
    result.result = null;
  } else {
    await client.query('COMMIT');
  }
  await client.end();

  return result;
}

module.exports = addAsset;
