/* eslint-disable import/extensions */
/* eslint-disable no-console */
import { getBaseCustomFieldsInfo } from '../utilities/utilities.js';
import {
  buildCount, buildOffset, buildWhereClause, getCount, getListInfo, buildURL,
} from '../utilities/listUtilities.js';

async function getAssetTypeList(
  domainName,
  pathElements,
  queryParams,
  db,
  idField,
  name,
  tableName,
  tableNameCustomFields,
) {
  let total;
  let res;
  const count = buildCount(queryParams);
  const offset = buildOffset(queryParams);
  const whereClause = buildWhereClause(queryParams, idField);

  const response = {
    statusCode: 200,
    message: '',
    result: { items: null },
  };
  response.result.count = count;
  response.result.offset = offset;

  total = await getCount(whereClause, db, tableName, name);
  if (total === 0) {
    response.message = `No ${name}s found.`;
    return response;
  }
  response.result.total = total;
  res = await getListInfo(offset, count, whereClause, db, idField, tableName, name);
  response.result.items = res.rows;
  response.result.url = buildURL(queryParams, domainName, res, offset, total, pathElements);

  for (const item of response.result.items) {
    const asset_type_id = item.asset_type_id
    const customFieldsResponse = await getBaseCustomFieldsInfo(db, idField, asset_type_id, name, tableNameCustomFields);
    item.custom_fields = Object.fromEntries(customFieldsResponse) || {};
  }

  return response;
}

export default getAssetTypeList;
