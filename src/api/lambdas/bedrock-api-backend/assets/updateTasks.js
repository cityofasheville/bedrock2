/* eslint-disable no-restricted-syntax */
/* eslint-disable import/extensions */
/* eslint-disable no-console */
import pgErrorCodes from '../pgErrorCodes.js';
import { deleteInfo, newClient } from '../utilities/utilities.js';

async function addTasks(client, allFields, body) {
  let fieldsString = '(';
  let comma = '';

  // This is just a bunch of string manipulation.
  // It creates a string of the column names/fields like '(tag_name, display_name)'
  allFields.forEach((key) => {
    fieldsString += comma;
    fieldsString += key;
    comma = ', ';
  });
  fieldsString += ')';

  for (const obj of body) {
    let valuesFromBody = [];
    allFields.forEach((key) => {
      if (obj[key] || obj[key] === 0) {
        if (key === 'source' || key === 'target') {
          valuesFromBody.push(JSON.stringify(obj[key]));
          // valuesFromBody.push(obj[key]);
        } else {
          valuesFromBody.push(obj[key]);
        }
      } else {
        valuesFromBody.push(null);
      }
    });

    try {
      await client
        .query(`INSERT INTO bedrock.tasks ${fieldsString} VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, valuesFromBody);
    } catch (error) {
      throw new Error([`Postgres error: ${pgErrorCodes[error.code]}`, error]);
    }
  }

  return body;
}

async function updateTasks(pathElements, event, connection) {
  const response = {
    error: false,
    message: '',
    result: null,
  };
  let client;

  const body = JSON.parse(event.body);
  const idField = 'asset_name';
  const [, idValue] = pathElements;
  const name = 'asset tasks';
  const tableName = 'tasks';
  const allFields = ['asset_name', 'seq_number', 'description', 'type', 'active', 'source', 'target', 'configuration'];

  try {
    client = await newClient(connection);
  } catch (error) {
    response.error = true;
    response.message = error.message;
    return response;
  }

  try {
    await client.query('BEGIN');
    await deleteInfo(client, tableName, idField, idValue, name);
    await addTasks(client, allFields, body);
    await client.query('COMMIT');
    response.result = body;
  } catch (error) {
    await client.query('ROLLBACK');
    await client.end();
    response.error = true;
    response.message = error.message;
    return response;
  } finally {
    await client.end();
  }
  return response;
}

export default updateTasks;
