/* eslint-disable import/extensions */
/* eslint-disable no-console */
import pgErrorCodes from '../pgErrorCodes.js';

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

function buildWhereClause(queryParams, idField) {
  const whereClause = {
    whereClause: '',
    sqlParams: [],
  };
  const where = ' where';
  whereClause.whereClause = '';

  if ('pattern' in queryParams) {
    whereClause.whereClause += `${where} ${idField} like $1`;
    whereClause.sqlParams.push(`%${queryParams.pattern}%`);
  }
  console.log(queryParams.contact_name);
  if ('contact_name' in queryParams) {
    whereClause.whereClause += `${where} contact_name ilike $1`;
    whereClause.sqlParams.push(`%${queryParams.contact_name}%`);
  }

  return whereClause;
}

async function getCount(whereClause, client, tableName, name) {
  const sql = `SELECT count(*) FROM bedrock.${tableName}  ${whereClause.whereClause}`;
  let res;

  try {
    res = await client.query(sql, whereClause.sqlParams);
  } catch (error) {
    throw new Error(`PG error getting ${name} count: ${pgErrorCodes[error.code]}`);
  }
  return Number(res.rows[0].count);
}

async function getListInfo(offset, count, whereClause, client, idField, tableName, name) {
  let sql = `SELECT * FROM bedrock.${tableName} ${whereClause.whereClause}`;
  sql += ` order by ${idField} asc`;
  sql += ` offset ${offset} limit ${count} `;
  let res;

  try {
    res = await client.query(sql, whereClause.sqlParams);
  } catch (error) {
    throw new Error(`PG error getting ${name} base information: ${pgErrorCodes[error.code]}`);
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

export {
  buildCount,
  buildOffset,
  buildWhereClause,
  getCount,
  getListInfo,
  buildURL,
};
