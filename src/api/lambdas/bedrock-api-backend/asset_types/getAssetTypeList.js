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

async function getAssetTypeList(
  domainName,
  pathElements,
  queryParams,
  connection,
  idField,
  name,
  tableName,
) {
  let total;
  let res;
  let client;
  let clientInitiated = false;
  const tagList = new Map();
  // setting items first makes the order of the properties in the final object better
  tagList.set('items', '');
  const count = buildCount(queryParams);
  const offset = buildOffset(queryParams);
  const whereClause = buildWhereClause(queryParams, idField);

  tagList.set('count', count);
  tagList.set('offset', offset);

  const response = {
    error: false,
    message: '',
    result: null,
  };

  try {
    client = await newClient(connection);
    clientInitiated = true;
    total = await getCount(whereClause, client, tableName, name);
    tagList.set('total', total);
    if (total === 0) {
      response.message = `No ${name}s found.`;
      response.result = Object.fromEntries(tagList.entries());
      return response;
    }
    res = await getListInfo(offset, count, whereClause, client, idField, tableName, name);
    tagList.set('items', res.rows);
    tagList.set('url', buildURL(queryParams, domainName, res, offset, total, pathElements));
    response.result = Object.fromEntries(tagList.entries());
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

module.exports = getAssetTypeList;
