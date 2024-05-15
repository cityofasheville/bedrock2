/* eslint-disable no-console */
const { newClient } = require('../utilities/utilities');
const {
  buildCount,
  buildOffset,
  buildWhereClause,
  getCount,
  getListInfo,
  buildURL,
} = require('../utilities/listUtilities');

async function getRungroupList(domainName, pathElements, queryParams, connection) {
  const name = 'run group';
  const tableName = 'run_groups';
  const idField = 'run_group_name';
  let total;
  let res;
  let client;
  let clientInitiated = false;
  const runGroupList = new Map();
  // setting items first makes the order of the properties in the final object better
  runGroupList.set('items', '');
  const count = buildCount(queryParams);
  const offset = buildOffset(queryParams);
  const whereClause = buildWhereClause(queryParams, idField);

  runGroupList.set('count', count);
  runGroupList.set('offset', offset);

  const response = {
    error: false,
    message: '',
    result: null,
  };

  try {
    client = await newClient(connection);
    clientInitiated = true;
    total = await getCount(whereClause, client, tableName, name);
    runGroupList.set('total', total);
    if (total === 0) {
      response.message = `No ${name}s found.`;
      response.result = Object.fromEntries(runGroupList.entries());
      return response;
    }
    res = await getListInfo(offset, count, whereClause, client, idField, tableName, name);
    runGroupList.set('items', res.rows);
    runGroupList.set('url', buildURL(queryParams, domainName, res, offset, total, pathElements));
    response.result = Object.fromEntries(runGroupList.entries());
    await client.end();
  } catch (error) {
    if (clientInitiated) {
      await client.end();
    }
    response.error = true;
    response.message = error.message;
  }
  return response;
}

module.exports = getRungroupList;
