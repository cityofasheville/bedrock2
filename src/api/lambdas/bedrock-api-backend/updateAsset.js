/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
const { Client } = require('pg');
const pgErrorCodes = require('./pgErrorCodes');

async function updateAsset(requestBody, pathElements, queryParams, connection) {
  const assetName = pathElements[1];
  const result = {
    error: false,
    message: `Successfully updated asset ${assetName}`,
    result: {},
  };

  const body = JSON.parse(requestBody);

  // Make sure that the asset name in the body, if there, matches the path
  if ('asset_name' in body && body.asset_name !== assetName) {
    result.error = true;
    result.message = `Asset name ${assetName} in path does not match asset name ${body.asset_name} in body`;
    return result;
  }

  const client = new Client(connection);
  await client.connect()
    .catch((err) => {
      const errmsg = pgErrorCodes[err.code];
      console.log(JSON.stringify(err));
      result.error = true;
      result.message = `PG error connecting: ${errmsg}`;
      result.result = null;
    });

  if (result.error) return result;

  // Verify that the asset exists
  let sql = 'SELECT * FROM bedrock.assets where asset_name like $1';

  let res = await client.query(sql, [assetName])
    .catch((err) => {
      result.error = true;
      result.message = `PG error verifying that asset exists: ${pgErrorCodes[err.code]}`;
      result.result = null;
    });

  if (res.rowCount === 0 && !result.error) {
    result.error = true;
    result.message = `Asset ${assetName} does not exist`;
  }

  if (result.error) {
    await client.end();
    return result;
  }

  //
  // Now begin the transaction
  //
  await client.query('BEGIN');

  // Start with the base asset
  let members = ['description', 'location', 'active', 'owner_id', 'notes'];
  let cnt = 1;
  let args = [];
  sql = 'UPDATE assets SET ';

  for (let i = 0, comma = ''; i < members.length; i += 1) {
    if (members[i] in body) {
      sql += `${comma} ${members[i]} = $${cnt}`;
      // Hacky. If we have more JSON types, maybe have a types array above
      if (members[i] === 'location') {
        args.push(JSON.stringify(body[members[i]]));
      } else {
        args.push(body[members[i]]);
      }
      result.result[members[i]] = body[members[i]];
      cnt += 1;
      comma = ',';
    }
  }
  sql += ` where asset_name = $${cnt}`;
  args.push(assetName);
  console.log(sql);
  console.log(JSON.stringify(args));
  res = await client.query(sql, args)
    .catch((err) => {
      result.error = true;
      result.message = `PG error updating base asset: ${pgErrorCodes[err.code]}`;
      result.result = null;
    });

  // Now add any dependencies, always replacing existing with new
  if (!result.error && 'dependencies' in body) {
    res = await client.query('DELETE FROM dependencies WHERE asset_name = $1', [assetName])
      .catch((err) => {
        result.error = true;
        result.message = `PG error deleting dependencies for update: ${pgErrorCodes[err.code]}`;
        result.result = null;
      });

    if (body.dependencies.length > 0 && !result.error) {
      for (let i = 0; i < body.dependencies.length && !result.error; i += 1) {
        const dependency = body.dependencies[i];
        res = await client.query(
          'INSERT INTO dependencies (asset_name, dependency) VALUES ($1, $2)',
          [assetName, dependency],
        )
          .catch((err) => {
            result.error = true;
            result.message = `PG error updating dependencies: ${pgErrorCodes[err.code]}`;
            result.result = null;
          });
      }
    }
    result.result.dependencies = body.dependencies;
  }
  if (result.error) {
    await client.query('ROLLBACK');
    await client.end();
    return result;
  }

  // Now add any ETL information. Null run group means delete
  if (!result.error && ('etl_run_group' in body || 'etl_active' in body)) {
    if ('etl_run_group' in body && body.etl_run_group === null) { // Delete the ETL information
      await client.query('DELETE FROM etl where asset_name = $1', [assetName])
        .catch((err) => {
          result.error = true;
          result.message = `PG error deleting from etl for update: ${pgErrorCodes[err.code]}`;
          result.result = null;
        });
      if (!result.error) {
        await client.query('DELETE FROM tasks where asset_name = $1', [assetName])
          .catch((err) => {
            result.error = true;
            result.message = `PG error deleting from tasks for update: ${pgErrorCodes[err.code]}`;
            result.result = null;
          });
      }
    } else { // Update the ETL information
      members = ['etl_run_group', 'etl_active'];
      cnt = 1;
      args = [];
      sql = 'UPDATE etl SET ';
      for (let i = 0, comma = ''; i < members.length; i += 1, comma = ',', cnt += 1) {
        if (members[i] in body) {
          sql += `${comma} ${members[i].substring(4)} = $${cnt}`;
          args.push(body[members[i]]);
          result.result[members[i]] = body[members[i]];
        }
      }
      sql += ` where asset_name = $${cnt}`;
      args.push(assetName);
      await client.query(sql, args)
        .catch((err) => {
          result.error = true;
          result.message = `PG error updating etl: ${pgErrorCodes[err.code]}`;
          result.result = null;
        });
    }
  }

  // Finally, update any tags.
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
    sql = 'SELECT tag_name from bedrock.tags where tag_name in (';
    cnt = 1;
    for (let i = 0, comma = ''; i < tags.length; i += 1, comma = ', ', cnt += 1) {
      sql += `${comma}$${cnt}`;
    }
    sql += ');';
    res = await client.query(sql, tags)
      .catch((err) => {
        result.error = true;
        result.message = `PG error reading tags for update: ${pgErrorCodes[err.code]}`;
        result.result = null;
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
              result.message = `PG error adding tags to tag table for update: ${pgErrorCodes[err.code]}`;
              result.result = null;
            });
        }
      }
    }
    // End of adding any tags that aren't in the tags table for now

    // Now delete any existing tags
    if (!result.error) {
      await client.query('DELETE FROM bedrock.asset_tags where asset_name = $1', [assetName])
        .catch((err) => {
          result.error = true;
          result.message = `PG error deleting tags for update: ${pgErrorCodes[err.code]}`;
          result.result = null;
        });
    }

    // And add the new ones back in
    for (let i = 0; i < tags.length && !result.error; i += 1) {
      res = await client.query(
        'INSERT INTO bedrock.asset_tags (asset_name, tag_name) VALUES ($1, $2)',
        [body.asset_name, tags[i]],
      )
        .catch((err) => {
          result.error = true;
          result.message = `PG error inserting tags for update: ${pgErrorCodes[err.code]}`;
          result.result = null;
        });
    }
    result.result.tags = body.tags;
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

module.exports = updateAsset;
