/* eslint-disable import/extensions */
/* eslint-disable no-console */
import { getInfo } from '../utilities/utilities.js';

async function getTag(
  db,
  idField,
  idValue,
  name,
  tableName,
) {

  const response = {
    statusCode: 200,
    message: '',
    result: null,
  };

  response.result = await getInfo(db, idField, idValue, name, tableName);
  return response;
}

export default getTag;
