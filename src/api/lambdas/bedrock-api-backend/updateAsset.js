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
    result.result = null;
    return result;
  }

  const client = new Client(connection);
  await client.connect()
    .catch((err) => {
      const errmsg = pgErrorCodes[err.code];
      console.log(JSON.stringify(err));
      result.error = true;
      result.message = `Postgres error: ${errmsg}`;
      result.result = null;
    });

  if (result.error) return result;

  // Verify that the asset exists
  let sql = 'SELECT * FROM bedrock.assets where asset_name like $1';

  let res = await client.query(sql, [assetName])
    .catch((err) => {
      result.error = true;
      result.message = `Postgres error: ${pgErrorCodes[err.code]}`;
      result.result = null;
    });
  if (result.error) return result;

  if (res.rowCount === 0) {
    result.error = true;
    result.message = `Asset ${assetName} does not exist`;
    await client.end();
  } else {
    let members = ['description', 'location', 'active'];
    await client.query('BEGIN');

    // Start with the base asset
    let cnt = 1;
    let args = [];
    sql = 'UPDATE assets SET ';
    let comma = '';
    for (let i = 0; i < members.length; i += 1) {
      if (members[i] in body) {
        sql += `${comma} ${members[i]} = $${cnt}`;
        comma = ',';
        cnt += 1;
        args.push(body[members[i]]);
        result.result[members[i]] = body[members[i]];
      }
    }
    sql += ` where asset_name = $${cnt}`;
    args.push(assetName);
    res = await client.query(sql, args)
      .catch((err) => {
        result.error = true;
        result.message = `Postgres error: ${pgErrorCodes[err.code]}`;
        result.result = null;
      });
    if (result.error) {
      await client.query('ROLLBACK');
      await client.end();
      return result;
    }

    // Now add any dependencies, always replacing existing with new
    if (('dependencies' in body)) {
      res = await client.query('DELETE FROM dependencies WHERE asset_name = $1', [assetName]);
      if (body.dependencies.length > 0) {
        for (let i = 0; i < body.dependencies.length; i += 1) {
          const dependency = body.dependencies[i];
          res = await client.query(
            'INSERT INTO dependencies (asset_name, dependency) VALUES ($1, $2)',
            [assetName, dependency],
          )
            .catch((err) => {
              result.error = true;
              result.message = `Postgres error: ${pgErrorCodes[err.code]}`;
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
    if (('etl_run_group' in body || 'etl_active' in body)) {
      if ('etl_run_group' in body && body.etl_run_group === null) { // Delete the ETL information
        await client.query('DELETE FROM etl where asset_name = $1', [assetName]);
        await client.query('DELETE FROM tasks where asset_name = $1', [assetName]);
      } else { // Update the ETL information
        members = ['etl_run_group', 'etl_active'];
        cnt = 1;
        args = [];
        sql = 'UPDATE etl SET ';
        comma = '';
        for (let i = 0; i < members.length; i += 1) {
          if (members[i] in body) {
            sql += `${comma} ${members[i].substring(4)} = $${cnt}`;
            comma = ',';
            cnt += 1;
            args.push(body[members[i]]);
            result.result[members[i]] = body[members[i]];
          }
        }
        sql += ` where asset_name = $${cnt}`;
        args.push(assetName);
        console.log(sql);
        await client.query(sql, args)
          .catch((err) => {
            result.error = true;
            result.message = `Postgres error: ${pgErrorCodes[err.code]}`;
            result.result = null;
          });
      }
      if (result.error) {
        await client.query('ROLLBACK');
        await client.end();
        return result;
      }
      await client.query('COMMIT');
    }

    // Finally, update any tags.
    if ('tags' in body) {
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
      comma = '';
      for (let i = 0; i < tags.length; i += 1) {
        sql += `${comma}$${cnt}`;
        cnt += 1;
        comma = ', ';
      }
      sql += ');';
      res = await client.query(sql, tags)
        .catch((err) => {
          result.error = true;
          result.message = `Postgres error: ${pgErrorCodes[err.code]}`;
          result.result = null;
        });
      if (result.error) {
        await client.query('ROLLBACK');
        await client.end();
        return result;
      }

      if (res.rowCount !== tags.length) {
        const dbTags = [];
        for (let i = 0; i < res.rowCount; i += 1) {
          dbTags.push(res.rows[i].tag_name);
        }
        for (let i = 0; i < tags.length; i += 1) {
          if (!dbTags.includes(tags[i])) {
            await client.query(
              'INSERT INTO tags (tag_name) VALUES ($1)',
              [tags[i]],
            )
              .catch((err) => {
                result.error = true;
                result.message = `Postgres error: ${pgErrorCodes[err.code]}`;
                result.result = null;
              });
            if (result.error) {
              await client.query('ROLLBACK');
              await client.end();
              return result;
            }
          }
        }
      }
      // End of just adding any tags that aren't in the tags table for now
      // Now delete any existing tags
      await client.query('DELETE FROM bedrock.asset_tags where asset_name = $1', [assetName]);

      // And add the new ones back in
      for (let i = 0; i < tags.length; i += 1) {
        res = await client.query(
          'INSERT INTO bedrock.asset_tags (asset_name, tag_name) VALUES ($1, $2)',
          [body.asset_name, tags[i]],
        )
          .catch((err) => {
            result.error = true;
            result.message = `Postgres error: ${pgErrorCodes[err.code]}`;
            result.result = null;
          });
        if (result.error) {
          await client.query('ROLLBACK');
          await client.end();
          return result;
        }
      }
      result.result.tags = body.tags;
    }
    return result;
  }
  return result;
}

module.exports = updateAsset;
