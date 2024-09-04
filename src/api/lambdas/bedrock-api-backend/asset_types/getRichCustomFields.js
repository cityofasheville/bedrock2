/* eslint-disable import/extensions */
/* eslint-disable no-console */
import { getBaseCustomFieldsInfo, } from '../utilities/utilities.js';

async function getRichCustomFields(
  db,
  idField,
  idValue,
  name,
  tableNameCustomFields,
) {
  const response = {
    statusCode: 200,
    message: '',
    result: { items: null },
  };

  const customFieldsResponse = await getBaseCustomFieldsInfo(db, idField, idValue, name, tableNameCustomFields);
  response.result.items = Object.fromEntries(customFieldsResponse) || {};

  return response;
}

export default getRichCustomFields;
