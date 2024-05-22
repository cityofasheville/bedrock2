/* eslint-disable no-console */
import { newClient } from '../utilities/utilities.js';
import {
  buildCount, buildOffset, buildWhereClause, getCount, getListInfo, buildURL,
} from '../utilities/listUtilities.js';


async function getRungroupList(
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

export default getRungroupList;
