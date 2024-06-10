/* eslint-disable import/extensions */
/* eslint-disable no-console */
import { newClient, capitalizeFirstLetter } from '../utilities/utilities.js';
import {
  buildCount, buildOffset, buildWhereClause, getCount, getListInfo, buildURL,
} from '../utilities/listUtilities.js';
import pgErrorCodes from '../pgErrorCodes.js';

async function getCustomFieldsInfo(client, name) {
  // Querying database to get information. Function can be used multiple times per method
  // if we need information from multiple tables
  const sql = 'SELECT * FROM bedrock.asset_type_custom_fields';
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
    const resCustomFields = await getCustomFieldsInfo(client, name);
    response.result.url = buildURL(queryParams, domainName, res, offset, total, pathElements);

    const customFieldsMap = {};

    // Populate customFieldsMap
    resCustomFields.forEach((item) => {
      const { asset_type_id, custom_field_id, required } = item;
      if (!customFieldsMap[asset_type_id]) {
        customFieldsMap[asset_type_id] = [];
      }
      customFieldsMap[asset_type_id].push({ [custom_field_id]: required });
    });

    // Add custom_fields property to firstArray
    response.result.items.forEach((item) => {
      const { id } = item;
      item.custom_fields = customFieldsMap[id] || [];
    });

    console.log(response.result.items);
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
