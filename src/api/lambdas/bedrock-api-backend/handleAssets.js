/* eslint-disable no-console */
const { Client } = require('pg');
const pgErrorCodes = require('./pgErrorCodes');

async function getAssetList(domainName, pathElements, queryParams, connection) {
  let offset = 0;
  let count = 25;
  let total = -1;
  let where = ' where';
  let qPrefix = '?';
  let qParams = '';
  const result = {
    error: false,
    message: '',
    result: null,
  };
  const client = new Client(connection);
  await client.connect()
    .catch((err) => {
      console.log(JSON.stringify(err));
      const errmsg = pgErrorCodes[err.code];
      throw new Error([`Postgres error: ${errmsg}`, err]);
    });

  // Override start, count, or offset, if set in query
  if ('offset' in queryParams) {
    offset = queryParams.offset;
  }
  if ('count' in queryParams) {
    count = queryParams.count;
    qParams += `${qPrefix}count=${count}`;
    qPrefix = '&';
  }

  // Read the DB
  const sqlParams = [];
  let sql2 = '';
  if ('pattern' in queryParams) {
    const { pattern } = queryParams;
    sql2 += `${where} a.asset_name like $1`;
    where = ' ';
    sqlParams.push(`%${queryParams.pattern}%`);
    qParams += `${qPrefix}pattern=${pattern}`;
    qPrefix = '&';
  }
  if ('rungroups' in queryParams) {
    qParams += `${qPrefix}rungroups=${queryParams.rungroups}`;
    qPrefix = '&';
    result.message += 'Query parameter rungroups not yet implemented. ';
  }
  if ('period' in queryParams) {
    qParams += `${qPrefix}period=${queryParams.period}`;
    qPrefix = '&';
    result.message += 'Query parameter period not yet implemented. ';
  }
  let sql = `SELECT count(*) FROM bedrock.assets a  ${sql2}`;
  console.log('run sql1 = ', sql);
  let res = await client.query(sql, sqlParams)
    .catch((err) => {
      const errmsg = pgErrorCodes[err.code];
      console.log(err, errmsg);
      throw new Error([`Postgres error: ${errmsg}`, err]);
    });

  if (res.rowCount === 0) {
    throw new Error('No results for count call in getAssetsList');
  } else {
    total = Number(res.rows[0].count);
  }

  sql = 'SELECT * FROM bedrock.assets a';
  sql += ' left join bedrock.etl e on a.asset_name = e.asset_name';
  sql += ` ${sql2}`;
  sql += ' order by a.asset_name asc';
  sql += ` offset ${offset} limit ${count} `;
  console.log('run sql2 = ', sql);

  res = await client.query(sql, sqlParams)
    .catch((err) => {
      const errmsg = pgErrorCodes[err.code];
      console.log(err, errmsg);
      throw new Error([`Postgres error: ${errmsg}`, err]);
    });

  if (res.rowCount === 0) {
    result.error = true;
    result.message += 'Asset not found';
  } else {
    let url = null;
    if (offset + res.rowCount < total) {
      const newOffset = parseInt(offset, 10) + res.rowCount;
      url = `https://${domainName}/${pathElements.join('/')}${qParams}`;
      url += `${qPrefix}offset=${newOffset.toString()}`;
    }
    const assets = [];
    const rows = [];
    const currentCount = res.rowCount;
    for (let i = 0; i < res.rowCount; i += 1) {
      assets.push(`'${res.rows[i].asset_name}'`);
      rows.push(
        {
          asset_name: res.rows[i].asset_name,
          description: res.rows[i].description,
          location: res.rows[i].location,
          active: res.rows[i].active,
          etl_run_group: res.rows[i].run_group,
          etl_active: res.rows[i].active,
          dependencies: [],
        },
      );
    }
    sql = `select asset_name, dependency from bedrock.dependencies where asset_name in (${assets.join()})`;
    res = await client.query(sql)
      .catch((err) => {
        const errmsg = pgErrorCodes[err.code];
        console.log(err, errmsg);
        throw new Error([`Postgres error: ${errmsg}`, err]);
      });
    await client.end();
    const map = {};
    if (res.rowCount > 0) {
      for (let i = 0; i < res.rowCount; i += 1) {
        if (res.rows[i].asset_name in map) {
          map[res.rows[i].asset_name].push(res.rows[i].dependency);
        } else {
          map[res.rows[i].asset_name] = [res.rows[i].dependency];
        }
      }
    }
    for (let i = 0; i < rows.length; i += 1) {
      if (rows[i].asset_name in map) {
        rows[i].dependencies = map[rows[i].asset_name];
      }
    }
    result.result = {
      items: rows,
      offset,
      count: currentCount,
      total,
      url,
    };
  }
  return result;
}

async function getAsset(pathElements, queryParams, connection) {
  const result = {
    error: false,
    message: '',
    result: null,
  };

  const client = new Client(connection);
  await client.connect()
    .catch((err) => {
      console.log(JSON.stringify(err));
      const errmsg = pgErrorCodes[err.code];
      throw new Error([`Postgres error: ${errmsg}`, err]);
    });

  const sql = `SELECT a.*, e.run_group, e.active, d.dependency
  FROM bedrock.assets a 
  left join bedrock.etl e on e.asset_name = a.asset_name
  left join bedrock.dependencies d on d.asset_name = a.asset_name
  where a.asset_name like $1`;

  const res = await client.query(sql, [pathElements[1]])
    .catch((err) => {
      const errmsg = pgErrorCodes[err.code];
      throw new Error([`Postgres error: ${errmsg}`, err]);
    });
  await client.end();
  if (res.rowCount === 0) {
    result.error = true;
    result.message = 'Asset not found';
  } else {
    result.result = {
      asset_name: res.rows[0].asset_name,
      description: res.rows[0].description,
      location: res.rows[0].location,
      active: res.rows[0].active,
      etl_run_group: res.rows[0].run_group,
      etl_active: res.rows[0].active,
      dependencies: [],
    };
    for (let i = 0; i < res.rowCount; i += 1) {
      if (res.rows[i].dependency !== null) {
        result.result.dependencies.push(res.rows[i].dependency);
      }
    }
  }
  return result;
}

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
  await client.end();

  return result;
}

// eslint-disable-next-line no-unused-vars
async function handleAssets(event, pathElements, queryParams, verb, connection) {
  let result = {
    error: false,
    message: '',
    result: null,
  };

  switch (pathElements.length) {
    // GET assets
    case 1:
      console.log('Calling getAssetList');
      result = await getAssetList(
        event.requestContext.domainName,
        pathElements,
        queryParams,
        connection,
      );
      console.log('Back from getAssetList');
      break;

    // VERB assets/{assetname}
    case 2:
      switch (verb) {
        case 'GET':
          result = await getAsset(pathElements, queryParams, connection);
          break;

        case 'POST':
          result = await addAsset(event.body, pathElements, queryParams, connection);
          break;

        case 'PUT':
          result.message = 'Update asset not implemented';
          result.error = true;
          break;

        case 'DELETE':
          result.message = 'Delete asset not implemented';
          result.error = true;
          break;

        default:
          result.message = `handleAssets: unknown verb ${verb}`;
          result.error = true;
          break;
      }
      break;

    // GET/DELETE assets/{assetname}/tasks OR
    // GET assets/{assetname}/depends
    case 3:
      if (pathElements[2] === 'tasks') {
        if (verb === 'GET') {
          result.message = 'Get asset tasks not implemented';
          result.error = true;
        } else if (verb === 'DELETE') {
          result.message = 'Delete all asset tasks not implemented';
          result.error = true;
        }
      } else if (pathElements[2] === 'depends') {
        result.message = 'Get asset depends not implemented';
        result.error = true;
      } else {
        result.message = `Unknown assets endpoint: [${pathElements.join()}]`;
        result.error = true;
      }
      break;

    // POST/PUT/DELETE assets/{assetname}/tasks/{taskPosition} OR
    // GET /bedrock/assets/search/{searchString}
    case 4:
      if (pathElements[1] === 'search') {
        result.message = 'Assets search not implemented';
        result.error = true;
      } else if (pathElements[2] === 'tasks') {
        switch (verb) {
          case 'POST':
            result.message = 'Add asset task not implemented';
            result.error = true;
            break;

          case 'PUT':
            result.message = 'Update asset task not implemented';
            result.error = true;
            break;

          case 'DELETE':
            result.message = 'Delete asset task not implemented';
            result.error = true;
            break;

          default:
            result.message = `handleAssets: unknown verb ${verb}`;
            result.error = true;
            break;
        }
      } else {
        result.message = `Unknown assets endpoint: [${pathElements.join()}]`;
        result.error = true;
      }
      break;

    default:
      result.message = `Unknown assets endpoint: [${pathElements.join()}]`;
      result.error = true;
      break;
  }
  if (result.error) {
    console.log(`We have an error but do not know why! - ${result.message}`);
  }
  return result;
}

module.exports = handleAssets;
