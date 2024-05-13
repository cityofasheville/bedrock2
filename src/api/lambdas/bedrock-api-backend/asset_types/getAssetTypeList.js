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
    whereClause.whereClause += `${where} id like $1`;
    whereClause.sqlParams.push(`%${queryParams.pattern}%`);
  }
  return whereClause;
}

async function getCount(whereClause, client) {
  const sql = `SELECT count(*) FROM bedrock.asset_types  ${whereClause.whereClause}`;
  let res;

  try {
    res = await client.query(sql, whereClause.sqlParams);
  } catch (error) {
    throw new Error(`PG error getting asset type count: ${pgErrorCodes[error.code]}`);
  }
  return Number(res.rows[0].count);
}

async function getBase(offset, count, whereClause, client) {
  let sql = `SELECT * FROM bedrock.asset_types ${whereClause.whereClause}`;
  sql += ' order by id asc';
  sql += ` offset ${offset} limit ${count} `;
  let res;

  try {
    res = await client.query(sql, whereClause.sqlParams);
  } catch (error) {
    throw new Error(`PG error getting asset type base information: ${pgErrorCodes[error.code]}`);
  }
  return res;
}

function buildURL(queryParams, domainName, res, offset, total, pathElements) {
  let qPrefix = '?';
  let qParams = '';
  let url = null;
  if ('count' in queryParams) {
    qParams += `${qPrefix}count=${queryParams.count}`;
    qPrefix = '&';
  }
  if (offset + res.rowCount < total) {
    const newOffset = parseInt(offset, 10) + res.rowCount;
    url = `https://${domainName}/${pathElements.join('/')}${qParams}`;
    url += `${qPrefix}offset=${newOffset.toString()}`;
  }
  return url;
}

async function getAssetTypeList(domainName, pathElements, queryParams, connection) {
  console.log(queryParams);
  let assetTypeList = new Map();
  // setting items first makes the order of the properties in the final object better
  assetTypeList.set("items", ""); 
  const response = {
    error: false,
    message: '',
    result: null,
  };

  let client;
  let total;
  let res;
  // Below, I could just use the values from the assetTypeList, but I found it made the code
  // less readable. 
  const count = buildCount(queryParams);
  assetTypeList.set('count', buildCount(queryParams));
  const offset = buildOffset(queryParams);
  assetTypeList.set('offset', buildOffset(queryParams));
  const whereClause = buildWhereClause(queryParams);

  try {
    client = await newClient(connection);
  } catch (error) {
    response.error = true;
    response.message = error.message;
    return response;
  }

  try {
    total = await getCount(whereClause, client);
    assetTypeList.set('total', total);
    if (total === 0) {
      response.message = 'No asset type found.';
      response.result = Object.fromEntries(assetTypeList.entries())
      return response;
    }
    res = await getBase(offset, count, whereClause, client);
    assetTypeList.set('items', res.rows);
    assetTypeList.set('url', buildURL(queryParams, domainName, res, offset, total, pathElements))
    response.result = Object.fromEntries(assetTypeList.entries());
  } catch (error) {
    response.error = true;
    response.message = error.message;
  } finally {
    await client.end();
    return response;
  }
}

module.exports = getAssetTypeList;
