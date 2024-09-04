/* eslint-disable import/extensions */
/* eslint-disable no-console */
import {
  buildCount, buildOffset, buildWhereClause, getCount, getListInfo, buildURL,
} from '../utilities/listUtilities.js';

async function getRunGroupList(
  domainName,
  pathElements,
  queryParams,
  db,
  idField,
  name,
  tableName,
) {
  const runGroupList = new Map();
  // setting items first makes the order of the properties in the final object better
  runGroupList.set('items', '');
  const count = buildCount(queryParams);
  const offset = buildOffset(queryParams);
  const whereClause = buildWhereClause(queryParams, idField);

  runGroupList.set('count', count);
  runGroupList.set('offset', offset);

  const response = {
    statusCode: 200,
    message: '',
    result: null,
  };

  let total = await getCount(whereClause, db, tableName, name);
  runGroupList.set('total', total);
  if (total === 0) {
    response.message = `No ${name}s found.`;
    response.result = Object.fromEntries(runGroupList.entries());
    return response;
  }
  let res = await getListInfo(offset, count, whereClause, db, idField, tableName, name);
  runGroupList.set('items', res.rows);
  runGroupList.set('url', buildURL(queryParams, domainName, res, offset, total, pathElements));
  response.result = Object.fromEntries(runGroupList.entries());

  return response;
}

export default getRunGroupList;
