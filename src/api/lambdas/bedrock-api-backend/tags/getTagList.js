/* eslint-disable import/extensions */
/* eslint-disable no-console */
import {
  buildCount, buildOffset, buildWhereClause, getCount, getListInfo, buildURL,
} from '../utilities/listUtilities.js';

async function getTagList(
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
  const tagList = new Map();
  // setting items first makes the order of the properties in the final object better
  tagList.set('items', '');
  const count = buildCount(queryParams);
  const offset = buildOffset(queryParams);
  const whereClause = buildWhereClause(queryParams, idField);

  tagList.set('count', count);
  tagList.set('offset', offset);

  const response = {
    statusCode: 200,
    message: '',
    result: null,
  };

  total = await getCount(whereClause, db, tableName, name);
  tagList.set('total', total);
  if (total === 0) {
    response.message = `No ${name}s found.`;
    response.result = Object.fromEntries(tagList.entries());
    return response;
  }
  res = await getListInfo(offset, count, whereClause, db, idField, tableName, name);
  tagList.set('items', res.rows);
  tagList.set('url', buildURL(queryParams, domainName, res, offset, total, pathElements));
  response.result = Object.fromEntries(tagList.entries());

  return response;
}

export default getTagList;
