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

module.exports = getAssetList;
