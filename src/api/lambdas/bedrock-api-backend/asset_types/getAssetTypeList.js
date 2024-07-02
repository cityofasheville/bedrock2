/* eslint-disable import/extensions */
/* eslint-disable no-console */
import { newClient, capitalizeFirstLetter, getBaseCustomFieldsInfo, getAncestorCustomFieldsInfo, formatCustomFields } from '../utilities/utilities.js';
import {
  buildCount, buildOffset, buildWhereClause, getCount, getListInfo, buildURL,
} from '../utilities/listUtilities.js';
import pgErrorCodes from '../pgErrorCodes.js';

async function getCustomFieldsInfoList(client, name, table) {
  // Querying database to get information. Function can be used multiple times per method
  // if we need information from multiple tables
  const sql = `SELECT * FROM ${table}`;
  let res;
  try {
    res = await client.query(sql);
  } catch (error) {
    throw new Error([`Postgres error: ${pgErrorCodes[error.code]||error.code}`, error]);
  }

  if (res.rowCount === 0) {
    throw new Error(`${capitalizeFirstLetter(name)} not found`);
  }

  return res.rows;
}

async function getAssetTypeList(
  domainName,
  pathElements,
  queryParams,
  connection,
  idField,
  name,
  tableName,
  tableNameCustomFields,
) {
  let total;
  let res;
  let client;
  let clientInitiated = false;
  const count = buildCount(queryParams);
  const offset = buildOffset(queryParams);
  const whereClause = buildWhereClause(queryParams, idField);

  const response = {
    error: false,
    message: '',
    result: { items: null },
  };
  response.result.count = count;
  response.result.offset = offset;

  try {
    client = await newClient(connection);
    clientInitiated = true;
    total = await getCount(whereClause, client, tableName, name);
    if (total === 0) {
      response.message = `No ${name}s found.`;
      return response;
    }
    response.result.total = total;
    res = await getListInfo(offset, count, whereClause, client, idField, tableName, name);
    response.result.items = res.rows;
    const resCustomFields = await getCustomFieldsInfoList(client, name, tableNameCustomFields);
    response.result.url = buildURL(queryParams, domainName, res, offset, total, pathElements);

    for (const item of response.result.items) {
      // const { asset_type_id, custom_field_id, required } = item;
      const asset_type_id = item.asset_type_id
      const customFieldsResponse = await getBaseCustomFieldsInfo(client, idField, asset_type_id, name, tableNameCustomFields);
      const ancestorCustomFields = await getAncestorCustomFieldsInfo(client, asset_type_id);
      item.custom_fields = formatCustomFields(customFieldsResponse, ancestorCustomFields) || {};
    }
    
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

export default getAssetTypeList;
