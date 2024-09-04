/* eslint-disable import/extensions */
/* eslint-disable no-console */
import {
  buildCount, buildOffset, buildWhereClause, getCount, getListInfo, buildURL,
} from '../utilities/listUtilities.js';

async function getOwnerList(
  domainName,
  pathElements,
  queryParams,
  db,
  idField,
  name,
  tableName,
) {
  let total;
  let res;
  const ownerList = new Map();
  // setting items first makes the order of the properties in the final object better
  ownerList.set('items', '');
  const count = buildCount(queryParams);
  const offset = buildOffset(queryParams);
  const whereClause = buildWhereClause(queryParams, idField);

  ownerList.set('count', count);
  ownerList.set('offset', offset);

  const response = {
    statusCode: 200,
    message: '',
    result: null,
  };

  total = await getCount(whereClause, db, tableName, name);
  ownerList.set('total', total);
  if (total === 0) {
    response.message = `No ${name}s found.`;
    response.result = Object.fromEntries(ownerList.entries());
    return response;
  }
  res = await getListInfo(offset, count, whereClause, db, idField, tableName, name);
  ownerList.set('items', res.rows);
  ownerList.set('url', buildURL(queryParams, domainName, res, offset, total, pathElements));
  response.result = Object.fromEntries(ownerList.entries());

  return response;
}

export default getOwnerList;
