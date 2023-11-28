/* eslint-disable no-console */
const { Client } = require('pg');
const pgErrorCodes = require('../pgErrorCodes');

function checkParameters(queryParams) {
  const parameters = ['period', 'pattern'];
  let message = '';

  Object.keys(queryParams).forEach((key) => {
    if (key === 'period') {
      message += 'Query parameter period not yet implemented. ';
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

function buildCount(queryParams) {
  let count = 25;
  if ('count' in queryParams) {
    count = queryParams.count;
  }
  return count;
}

function buildWhereClause(queryParams) {
  const whereClause = {
    whereClause: '',
    sqlParams: [],
  };
  const where = ' where';
  whereClause.whereClause = '';

  if ('pattern' in queryParams) {
    whereClause.whereClause += `${where} run_group_name like $1`;
    whereClause.sqlParams.push(`%${queryParams.pattern}%`);
  }
  return whereClause;
}

async function getCount(whereClause, client) {
  const sql = `SELECT count(*) FROM bedrock.run_groups  ${whereClause.whereClause}`;
  let res;

  try {
    res = await client.query(sql, whereClause.sqlParams);
  } catch (error) {
    throw new Error(`PG error getting rungroup count: ${pgErrorCodes[error.code]}`);
  }
  return Number(res.rows[0].count);
}

async function getBase(offset, count, whereClause, client) {
  let sql = `SELECT * FROM bedrock.run_groups ${whereClause.whereClause}`;
  sql += ' order by run_group_name asc';
  sql += ` offset ${offset} limit ${count} `;
  let res;

  try {
    res = await client.query(sql, whereClause.sqlParams);
  } catch (error) {
    throw new Error(`PG error getting rungroup base information: ${pgErrorCodes[error.code]}`);
  }
  return res;
}

function buildURL(domainName, res, offset, total, pathElements) {
  const qPrefix = '?';
  const qParams = '';
  let url = null;
  if (offset + res.rowCount < total) {
    const newOffset = parseInt(offset, 10) + res.rowCount;
    url = `https://${domainName}/${pathElements.join('/')}${qParams}`;
    url += `${qPrefix}offset=${newOffset.toString()}`;
  }
  return url;
}

async function getRungroupList(domainName, pathElements, queryParams, connection) {
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
      result.message = 'No rungroups found.';
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

  result.result = {
    items: res.rows,
    offset,
    count: res.rowCount,
    total,
    url,
  };

  return result;
}

module.exports = getRungroupList;
