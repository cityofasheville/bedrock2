const { Client } = require('pg');
const pgErrorCodes = require('../pgErrorCodes');

function checkParameters(queryParams) {
  const parameters = ['rungroup', 'tags', 'period', 'pattern'];
  let message = '';

  Object.keys(queryParams).forEach((key) => {
    if (key === 'rungroup') {
      message += 'Query parameter rungroup not yet implemented.';
    } else if (key === 'tags') {
      message += 'Query parameter tags not yet implemented.';
    } else if (key === 'period') {
      message += 'Query parameter period not yet implemented.';
    } else if (!parameters.includes(key)) {
      message += `${key} is not a valid parameter.`;
    }
  });
  return message;
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

function buildOffset(queryParams) {
  let offset = 0;
  if ('offset' in queryParams) {
    offset = queryParams.offset;
  }
  return offset;
}

function buildWhereClause(queryParams) {
  const whereClause = {
    whereClause: '',
    sqlParams: [],
  };
  const where = ' where';
  whereClause.whereClause = '';

  if ('pattern' in queryParams) {
    whereClause.whereClause += `${where} a.asset_name like $1`;
    whereClause.sqlParams.push(`%${queryParams.pattern}%`);
  }
  return whereClause;
}

async function getCount(whereClause, client) {
  const sql = `SELECT count(*) FROM bedrock.assets a  ${whereClause.whereClause}`;
  let res;

  try {
    res = await client.query(sql, whereClause.sqlParams);
  } catch (error) {
    throw new Error(`PG error getting asset count: ${pgErrorCodes[error.code]}`);
  }
  return Number(res.rows[0].count);
}

function buildCount(queryParams) {
  let count = 25;
  if ('count' in queryParams) {
    count = queryParams.count;
  }
  return count;
}

async function getBase(offset, count, whereClause, client) {
  let sql = 'SELECT a.*, e.run_group, e.active as etl_active FROM bedrock.assets a';
  sql += ' left join bedrock.etl e on a.asset_name = e.asset_name';
  sql += ` ${whereClause.whereClause}`;
  sql += ' order by a.asset_name asc';
  sql += ` offset ${offset} limit ${count} `;
  let res;

  try {
    res = await client.query(sql, whereClause.sqlParams);
  } catch (error) {
    throw new Error(`PG error getting asset base information: ${pgErrorCodes[error.code]}`);
  }
  return res;
}

function buildURL(queryParams, domainName, res, offset, total, pathElements) {
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
  }
  if ('period' in queryParams) {
    qParams += `${qPrefix}period=${queryParams.period}`;
    qPrefix = '&';
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
    message: checkParameters(queryParams),
    result: null,
  };

  let client;
  let total;
  let res;
  let url;
  const count = buildCount(queryParams);
  const offset = buildOffset(queryParams);
  const whereClause = buildWhereClause(queryParams);

  try {
    client = await newClient(connection);
  } catch (error) {
    result.error = true;
    result.message = error.message;
    return result;
  }

  try {
    total = await getCount(whereClause, client);
    if (total === 0) {
      result.message = 'No assets found.';
      result.result = {
        items: [],
        offset,
        count: 0,
        total,
        url,
      };
      return result;
    }
    res = await getBase(offset, count, whereClause, client);
    url = buildURL(queryParams, domainName, res, offset, total, pathElements);
  } catch (error) {
    await client.end();
    result.error = true;
    result.message = error.message;
    return result;
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
    await client.end();
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
