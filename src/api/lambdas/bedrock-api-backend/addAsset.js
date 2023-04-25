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

  // Make sure that we have required information
  if (!('asset_name' in body)
   || !('description' in body)
   || !('location' in body)
   || !('active' in body)) {
    result.error = true;
    result.message = 'Asset lacks required property (one of asset_name, description, location, active)';
    result.result = body;
    return result;
  }
  if (pathElements[1] !== body.asset_name) {
    result.error = true;
    result.message = `Asset name ${pathElements[1]} in path does not match asset name ${body.asset_name} in body`;
    return result;
  }

  if (('etl_run_group' in body || 'etl_active' in body)) {
    if (!('etl_run_group' in body && 'etl_active' in body)) {
      result.error = true;
      result.message = 'Addition of ETL information requires both etl_run_group and etl_active elements';
      return result;
    }
  }

  const client = new Client(connection);
  await client.connect()
    .catch((err) => {
      const errmsg = pgErrorCodes[err.code];
      throw new Error([`Postgres error: ${errmsg}`, err]);
    });

  const sql = 'SELECT * FROM bedrock.assets where asset_name like $1';
  let res = await client.query(sql, [pathElements[1]])
    .catch((err) => {
      const errmsg = pgErrorCodes[err.code];
      throw new Error([`Postgres error: ${errmsg}`, err]);
    });
  if (res.rowCount > 0) {
    result.error = true;
    result.message = 'Asset already exists';
    return result;
  }

  // All is well - let's go ahead and add
  res = await client.query(
    'INSERT INTO assets (asset_name, description, location, active) VALUES($1, $2, $3, $4)',
    [body.asset_name, body.description, body.location, body.active],
  )
    .catch((err) => {
      const errmsg = pgErrorCodes[err.code];
      throw new Error([`Postgres error inserting asset: ${errmsg}`, err]);
    });
  if (res.rowCount !== 1) {
    result.error = true;
    result.message = 'Unknown error inserting new asset';
    await client.end();
    return result;
  }

  result.result = {
    asset_name: body.asset_name,
    description: body.description,
    location: body.location,
    active: body.active,
  };

  // Now add any dependencies
  if (('dependencies' in body) && body.dependencies.length > 0) {
    for (let i = 0; i < body.dependencies.length; i += 1) {
      const dependency = body.dependencies[i];
      // eslint-disable-next-line no-await-in-loop
      res = await client.query(
        'INSERT INTO dependencies (asset_name, dependency) VALUES ($1, $2)',
        [body.asset_name, dependency],
      )
        .catch((err) => {
          const errmsg = pgErrorCodes[err.code];
          throw new Error([`Postgres error inserting asset dependencies: ${errmsg}`, err]);
        });
    }
    result.result.dependencies = body.dependencies;
  }

  // Now add any ETL information
  if (('etl_run_group' in body && 'etl_active' in body)) {
    res = await client.query(
      'INSERT INTO etl (asset_name, run_group, active) VALUES ($1, $2, $3)',
      [body.asset_name, body.etl_run_group, body.etl_active],
    )
      .catch((err) => {
        const errmsg = pgErrorCodes[err.code];
        throw new Error([`Postgres error inserting asset etl info: ${errmsg}`, err]);
      });
    result.result.etl_run_group = body.etl_run_group;
    result.result.etl_active = body.etl_active;
  }

  // Now add any tags
  if ('tags' in body) {
    let tags = [];
    if (Array.isArray(body.tags)) {
      tags = body.tags;
    } else {
      tags = body.tags.split(',');
    }
    for (let i = 0; i < tags.length; i += 1) {
      const tag = tags[i].trim();
      if (tag.length > 0) {
        // eslint-disable-next-line no-await-in-loop
        res = await client.query(
          'INSERT INTO tags (asset_name, tag) VALUES ($1, $2)',
          [body.asset_name, tag],
        )
          .catch((err) => {
            const errmsg = pgErrorCodes[err.code];
            throw new Error([`Postgres error inserting asset tags: ${errmsg}`, err]);
          });
      }
    }
    result.result.tags = body.tags;
  }

  await client.end();

  return result;
}

module.exports = addAsset;
