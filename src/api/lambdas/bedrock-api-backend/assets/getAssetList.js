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

async function buildOffset(queryParams) {
  let offset = 0;
  // Override start, count, or offset, if set in query
  if ('offset' in queryParams) {
    offset = queryParams.offset;
  }
  return offset;
}

async function buildWhereClause(queryParams) {
  const where = ' where';
  let sql2 = '';
  if ('pattern' in queryParams) {
    sql2 += `${where} a.asset_name like $1`;
  }

  const sql = `SELECT count(*) FROM bedrock.assets a  ${sql2}`;
  return sql;
}

async function buildSQLParams(queryParams) {
  const sqlParams = [];
  if ('pattern' in queryParams) {
    sqlParams.push(`%${queryParams.pattern}%`);
  }
  return sqlParams;
}

async function getCount(sql, sqlParams, client) {
  let res;
  let message;
  try {
    res = await client.query(sql, sqlParams);
  } catch (error) {
    throw new Error(`PG error getting asset count: ${pgErrorCodes[error.code]}`);
  }
  if (res.rowCount === 0) {
    message = 'No results for count call in getAssetsList';
  }
  // Need to return message here for when no results happen too.
  return Number(res.rows[0].count);
}

async function buildBaseQuery(sql2, count, offset) {
  let sql = 'SELECT a.*, e.run_group, e.active as etl_active FROM bedrock.assets a';
  sql += ' left join bedrock.etl e on a.asset_name = e.asset_name';
  sql += ` ${sql2}`;
  sql += ' order by a.asset_name asc';
  sql += ` offset ${offset} limit ${count} `;
  return sql;
}

async function buildCount(queryParams) {
  let count = 25;
  if ('count' in queryParams) {
    count = queryParams.count;
  }
  return count;
}

async function getBase(sql, sqlParams, client) {
  let res;
  console.log(sql);
  try {
    res = await client.query(sql, sqlParams);
  } catch (error) {
    throw new Error(pgErrorCodes[error.code]);
  }
  // Need to put message here if res.rowCount===0
  return res;
}

async function buildURL(queryParams, domainName, res, offset, total, pathElements) {
  let qPrefix = '?';
  let qParams = '';
  if ('pattern' in queryParams) {
    const { pattern } = queryParams;
    qParams += `${qPrefix}pattern=${pattern}`;
    qPrefix = '&';
  }
  if ('rungroups' in queryParams) {
    qParams += `${qPrefix}rungroups=${queryParams.rungroups}`;
    qPrefix = '&';
    // result.message += 'Query parameter rungroups not yet implemented. ';
  }
  if ('tags' in queryParams) {
    // result.message += 'Query parameter tags not yet implemented. ';
  }
  if ('period' in queryParams) {
    qParams += `${qPrefix}period=${queryParams.period}`;
    qPrefix = '&';
    // result.message += 'Query parameter period not yet implemented. ';
  }
  let url = null;
  if (offset + res.rowCount < total) {
    const newOffset = parseInt(offset, 10) + res.rowCount;
    url = `https://${domainName}/${pathElements.join('/')}${qParams}`;
    url += `${qPrefix}offset=${newOffset.toString()}`;
  }
  return url;
}

async function getDependencies(assets, client) {
  let res;
  const sql = `select asset_name, dependency from bedrock.dependencies where asset_name in (${assets.join()})`;
  try {
    res = await client.query(sql);
  } catch (error) {
    throw new Error(`PG error getting asset dependencies: ${pgErrorCodes[error.code]}`);
  }
  return res;
}

async function getAssetList(domainName, pathElements, queryParams, connection) {
  const result = {
    error: false,
    message: '',
    result: null,
  };

  let client;
  let offset;
  let baseSql;
  let sql;
  let sqlParams;
  let total;
  let res;
  let url;
  let count;

  try {
    client = await newClient(connection);
  } catch (error) {
    result.error = true;
    result.message = error.message;
    return result;
  }

  try {
    offset = await buildOffset(queryParams);
    sql = await buildWhereClause(queryParams);
    sqlParams = await buildSQLParams(queryParams);
    count = await buildCount(queryParams);
    total = await getCount(sql, sqlParams, client);
    baseSql = buildBaseQuery(sql, count, offset);
    res = await getBase(baseSql, sqlParams, client);
    url = await buildURL(queryParams, domainName, res, offset, total, pathElements);
  } catch (error) {
    result.error = true;
    result.message = error.message;
    return result;
  }

  const assets = [];
  const rows = [];
  const currentCount = res.rowCount;
  console.log(JSON.stringify(res.rows));
  for (let i = 0; i < res.rowCount; i += 1) {
    assets.push(`'${res.rows[i].asset_name}'`);
    rows.push(
      {
        asset_name: res.rows[i].asset_name,
        description: res.rows[i].description,
        location: res.rows[i].location,
        owner_id: res.rows[i].owner_id,
        notes: res.rows[i].notes,
        active: res.rows[i].active,
        etl_run_group: res.rows[i].run_group,
        etl_active: res.rows[i].etl_active,
        dependencies: [],
      },
    );
  }

  try {
    res = await getDependencies(assets, client);
  } catch (error) {
    result.error = true;
    result.message = error.message;
    return result;
  }

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

  return result;
}

module.exports = getAssetList;
