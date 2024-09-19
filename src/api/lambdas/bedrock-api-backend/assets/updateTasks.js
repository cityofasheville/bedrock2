/* eslint-disable no-restricted-syntax */
/* eslint-disable import/extensions */
/* eslint-disable no-console */

import { deleteInfo, generateId, checkExistence } from '../utilities/utilities.js';
import getTasks from './getTasks.js';

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

async function updateETLInfo(client, body, tableName, idValue, name) {
  const args = [idValue, body.run_group.run_group_id, body.run_group.active];
  let sql = `INSERT INTO ${tableName} (asset_id, run_group_id, active) VALUES ($1, $2, $3) ON CONFLICT(asset_id) DO UPDATE SET run_group_id = $2, active = $3`;

  try {
    await client.query(sql, args);
  } catch (error) {
    throw new Error(`PG error updating ${name}: ${error}`);
  }

  return body;
}

async function addTasks(client, allFields, body, idValue) {
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
      if (obj[key] || obj[key] === 0 || obj[key] === false) {
        if (key === 'source' || key === 'target') {
          valuesFromBody.push(JSON.stringify(obj[key]));
        } else if (key === 'asset_id') {
          valuesFromBody.push(idValue)
        } else {
          valuesFromBody.push(obj[key]);
        };
      } else if (key === 'task_id') {
        let newId = generateId();
        valuesFromBody.push(newId);
        obj['task_id'] = newId;
      } else {
        valuesFromBody.push(null);
      }
    });

    try {
      await client
        .query(`INSERT INTO bedrock.tasks ${fieldsString} VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, valuesFromBody);
    } catch (error) {
      throw new Error([`Postgres error: ${error}`]);
    }
  }

  return body;
}

async function updateTasks(
  db,
  idField,
  idValue,
  name,
  body,
) {
  const response = {
    statusCode: 200,
    message: '',
    result: null,
  };

  const tableName = 'bedrock.tasks';
  const allFields = ['task_id', 'asset_id', 'seq_number', 'description', 'type', 'active', 'source', 'target', 'configuration'];
  const requiredFields = ['asset_id', 'seq_number', 'type', 'active'];
  const shouldExist = true;

  checkInfo(body, requiredFields);

  let client = await db.newClient();
  await client.query('BEGIN');
  // make sure asset exists in the asset table
  await checkExistence(client, 'bedrock.assets', idField, idValue, name, shouldExist);
  await deleteInfo(client, tableName, idField, idValue, name);
  await addTasks(client, allFields, body, idValue);
  await updateETLInfo(client, body, 'bedrock.etl', idValue, name)
  await client.query('COMMIT');
  let newResponse = await getTasks(client, idValue, idField, name)
  response.result = newResponse.result;

  return response;
}

export default updateTasks;
