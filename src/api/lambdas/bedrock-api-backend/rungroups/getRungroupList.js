/* eslint-disable no-console */
const { Client } = require('pg');
const pgErrorCodes = require('../pgErrorCodes');

async function getRungroupList(domainName, pathElements, queryParams, connection) {
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
  await client.connect().catch((err) => {
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
    sql2 += `${where} run_group_name like $1`;
    where = ' ';
    sqlParams.push(`%${queryParams.pattern}%`);
    qParams += `${qPrefix}pattern=${pattern}`;
    qPrefix = '&';
  }
  if ('period' in queryParams) {
    qParams += `${qPrefix}period=${queryParams.period}`;
    qPrefix = '&';
    result.message += 'Query parameter period not yet implemented. ';
  }
  let sql = `SELECT count(*) FROM bedrock.run_groups  ${sql2}`;
  console.log('run sql1 = ', sql);
  let res = await client.query(sql, sqlParams).catch((err) => {
    const errmsg = pgErrorCodes[err.code];
    console.log(err, errmsg);
    throw new Error([`Postgres error: ${errmsg}`, err]);
  });

  if (res.rowCount === 0) {
    throw new Error('No results for count call in getRungroupsList');
  } else {
    total = Number(res.rows[0].count);
  }

  sql = `SELECT * FROM bedrock.run_groups ${sql2}`;
  sql += ' order by run_group_name asc';
  sql += ` offset ${offset} limit ${count} `;
  console.log('run sql2 = ', sql);

  res = await client.query(sql, sqlParams).catch((err) => {
    const errmsg = pgErrorCodes[err.code];
    console.log(err, errmsg);
    throw new Error([`Postgres error: ${errmsg}`, err]);
  });
  await client.end();

  if (res.rowCount === 0) {
    result.error = true;
    result.message += 'Rungroup not found';
  } else {
    let url = null;
    if (offset + res.rowCount < total) {
      const newOffset = parseInt(offset, 10) + res.rowCount;
      url = `https://${domainName}/${pathElements.join('/')}${qParams}`;
      url += `${qPrefix}offset=${newOffset.toString()}`;
    }
    result.result = {
      items: res.rows,
      offset,
      count: res.rowCount,
      total,
      url,
    };
  }
  return result;
}

module.exports = getRungroupList;
