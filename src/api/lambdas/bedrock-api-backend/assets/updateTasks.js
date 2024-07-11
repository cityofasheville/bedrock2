/* eslint-disable no-restricted-syntax */
/* eslint-disable import/extensions */
/* eslint-disable no-console */
import pgErrorCodes from '../pgErrorCodes.js';
import { deleteInfo, generateId, newClient } from '../utilities/utilities.js';

function checkInfo(body, requiredFields) {
  // loop through requiredFields array and check that each one is in body
  for (let i = 0; i < requiredFields.length; i += 1) {
    body.items.forEach((obj) => {
      if (!(requiredFields[i] in obj)) {
        throw new Error(`One or more tasks lack required property ${requiredFields[i]}`);
      }
    });
  }
}

async function updateETLInfo(client, allFields, body, tableName, idField, idValue, name) {
  let cnt = 1;
  const args = [];
  let sql = `UPDATE ${tableName} SET `;
  let comma = '';

  // Creating a string like 'tag_name = $1, display_name = 2$' etc
  // and adding the actual value to the args array
  Object.keys(body.run_group).forEach((key) => {

    if (allFields.includes(key)) {

      if (key == 'asset_id') {
        sql += `${comma} ${key} = $${cnt}`;
        args.push(idValue);
      }
      sql += `${comma} ${key} = $${cnt}`;
      args.push(body.run_group[key]);
      cnt += 1;
      comma = ',';
    }
  });

  sql += ` where ${idField} = $${cnt}`;
  args.push(idValue);

  try {
    await client.query(sql, args);
  } catch (error) {
    throw new Error(`PG error updating ${name}: ${pgErrorCodes[error.code]||error.code}`);
  }

  return body;
}

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

  for (const obj of body.items) {
    const valuesFromBody = [];
    allFields.forEach((key) => {
      if (obj[key] || obj[key] === 0) {
        if (key === 'source' || key === 'target') {
          valuesFromBody.push(JSON.stringify(obj[key]));
          // valuesFromBody.push(obj[key]);
        } else {
          if (key == 'task_id') {
            valuesFromBody.push(generateId())
          } else {
          valuesFromBody.push(obj[key]);
          }}
      } else {
        valuesFromBody.push(null);
      }
    });

    try {
      await client
        .query(`INSERT INTO bedrock.tasks ${fieldsString} VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, valuesFromBody);
    } catch (error) {
      throw new Error([`Postgres error: ${pgErrorCodes[error.code]||error.code}`, error]);
    }
  }

  return body;
}

async function updateTasks(
  connection,
  idField,
  idValue,
  name,
  body,
) {
  const response = {
    error: false,
    message: '',
    result: null,
  };
  let client;

  const tableName = 'bedrock.tasks';
  const allFields = ['task_id', 'asset_id', 'seq_number', 'description', 'type', 'active', 'source', 'target', 'configuration'];
  const requiredFields = ['asset_id', 'seq_number', 'type', 'active'];

  try {
    client = await newClient(connection);
    checkInfo(body, requiredFields);
  } catch (error) {
    response.error = true;
    response.message = error.message;
    return response;
  }

  try {
    await client.query('BEGIN');
    await deleteInfo(client, tableName, idField, idValue, name);
    await addTasks(client, allFields, body);
    await updateETLInfo(client, ['asset_id', 'run_group_id', 'active'], body, 'bedrock.etl', idField, idValue, name)
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
