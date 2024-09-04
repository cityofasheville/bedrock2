/* eslint-disable import/extensions */
/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */
import { customAlphabet } from 'nanoid';


function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function checkInfo(body, requiredFields, name, idValue, idField) {
  // loop through requiredFields array and check that each one is in body
  for (let i = 0; i < requiredFields.length; i += 1) {
    const field = requiredFields[i];
    if (!(field in body)) {
      throw new Error(`${capitalizeFirstLetter(name)} lacks required property ${requiredFields[i]}`);
    }
  }

  if (idValue !== body[idField]) {
    throw new Error(`${idValue} in path does not match ${body[idField]} in body`);
  }
}

async function checkExistence(db, tableName, idField, idValue, name, shouldExist) {
  // query the database to make sure resource exists
  const sql = `SELECT * FROM ${tableName} where ${idField} like $1`;
  let res;
  try {
    res = await db.query(sql, [idValue]);
  } catch (error) {
    throw new Error([`Postgres error: ${error}`]);
  }

  // for some methods, the resource needs to exist (PUT),
  // while others, the resource should not exist (POST)
  if (shouldExist && (res.rowCount === 0)) {
    throw new Error(`${capitalizeFirstLetter(name)} like ${idValue} does not exist`);
  }

  if (!shouldExist && (res.rowCount > 0)) {
    throw new Error(`${capitalizeFirstLetter(name)} like ${idValue} already exists`);
  }
}

function generateId() {
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz';
  const nanoid = customAlphabet(alphabet, 16);
  const thisID = nanoid();
  return thisID;
}

async function getInfo(db, idField, idValue, name, tableName) {
  // Querying database to get information. Function can be used multiple times per method
  // if we need information from multiple tables
  const sql = `SELECT * FROM ${tableName} where ${idField} like $1`;
  let res;
  try {
    res = await db.query(sql, [idValue]);
  } catch (error) {
    throw new Error([`Postgres error: ${error}`]);
  }

  if (res.rowCount === 0) {
    throw new Error(`${capitalizeFirstLetter(name)} not found`);
  }
  return res.rows[0];
}

async function addInfo(db, allFields, body, tableName, name) {
  let res;
  let fieldsString = '(';
  let valueString = '(';
  let comma = '';
  let cnt = 0;

  // This is just a bunch of string manipulation.
  // It creates a string of the column names/fields like '(tag_name, display_name)'
  Object.keys(body).forEach((key) => {
    if (allFields.includes(key)) {
      fieldsString += comma;
      fieldsString += key;
      comma = ', ';
    }
  });
  fieldsString += ')';

  // More string manipulation that creates a string '($1, $2, $3)'
  // The length is based on the number of fields.
  comma = '';
  Object.keys(body).forEach((key) => {
    if (allFields.includes(key)) {
      valueString += comma;
      valueString += '$';
      valueString += (cnt + 1).toString();
      cnt += 1;
      comma = ', ';
    }
  });
  valueString += ')';

  // Creating an array of the actual values from the body like
  // ['test_tag_name', 'test_display_name']
  const valuesFromBody = [];
  Object.keys(body).forEach((key) => {
    if (allFields.includes(key)) {
      valuesFromBody.push(body[key]);
    }
  });

  try {
    res = await db
      .query(
        `INSERT INTO ${tableName} ${fieldsString} VALUES${valueString}`,
        valuesFromBody,
      );
  } catch (error) {
    throw new Error([`Postgres error: ${error}`]);
  }

  if (res.rowCount !== 1) {
    throw new Error(`Unknown error inserting new ${name}`);
  }

  return body;
}

async function updateInfo(db, allFields, body, tableName, idField, idValue, name) {
  let cnt = 1;
  const args = [];
  let sql = `UPDATE ${tableName} SET `;
  let comma = '';

  // Creating a string like 'tag_name = $1, display_name = 2$' etc
  // and adding the actual value to the args array
  Object.keys(body).forEach((key) => {
    if (allFields.includes(key)) {
      if (allFields.includes(key)) {
        sql += `${comma} ${key} = $${cnt}`;
        args.push(body[key]);
        cnt += 1;
        comma = ',';
      }
  }});

  sql += ` where ${idField} = $${cnt}`;
  args.push(idValue);

  try {
    await db.query(sql, args);
  } catch (error) {
    throw new Error(`PG error updating ${name}: ${error}`);
  }

  return body;
}

async function deleteInfo(db, tableName, idField, idValue, name) {
  try {
    await db
      .query(`delete from ${tableName} where ${idField} = $1`, [
        idValue,
      ]);
  } catch (error) {
    throw new Error(`PG error deleting ${name} ${idValue}: ${error}`);
  }
}

async function addAssetTypeCustomFields(db, idValue, body) {
  let res;
  const valueStrings = [];

  body.custom_fields.forEach((obj) => {
    const customFieldId = obj.custom_field_id;
    const required = obj.required;
    valueStrings.push(`('${idValue}', '${customFieldId}', ${required})`);
  });
  const combinedValueString = valueStrings.join(', ');

  try {
    res = await db
      .query(
        `INSERT INTO bedrock.asset_type_custom_fields (asset_type_id, custom_field_id, required) VALUES ${combinedValueString}`,
      );
  } catch (error) {
    throw new Error([`Postgres error: ${error}`, error]);
  }

  return body.custom_fields;
}

async function getBaseCustomFieldsInfo(db, idField, idValue, name, tableName) {
  let customFields = new Map();
    const sql = `
    SELECT c.custom_field_id, c.custom_field_name, c.field_type, c.field_data, j.required
    FROM bedrock.custom_fields c
    LEFT OUTER JOIN bedrock.asset_type_custom_fields j
      ON c.custom_field_id = j.custom_field_id
    WHERE j.asset_type_id = '${idValue}'
  `;
  let res;
  try {
    res = await db.query(sql, []);
  } catch (error) {
    throw new Error([`Postgres error: ${error}`, error]);
  }

  res.rows.forEach((itm) => {
    customFields.set(itm.custom_field_id, itm);
  });

  return customFields;
}

async function checkBeforeDelete(db, name, tableName, idField, idValue, connectedData, connectedDataIdField) {
  const sql = `SELECT * FROM ${tableName} where ${idField} like $1`;
  let res;
  let list = [];
  try {
    res = await db.query(sql, [idValue]);
  } catch (error) {
    throw new Error([`Postgres error: ${error}`]);
  }

  if (res.rowCount !== 0) {
    res.rows.forEach((element) => list.push(element[connectedDataIdField]))
    throw new Error(`${capitalizeFirstLetter(name)} ${idValue} is still connected to one or more ${connectedData} (Ids: ${list.join(', ')}). You must delete these relationships from ${tableName} before deleting this ${name}.`)
  }

}

export {
  checkInfo,
  checkExistence,
  capitalizeFirstLetter,
  getInfo,
  addInfo,
  updateInfo,
  deleteInfo,
  generateId,
  addAssetTypeCustomFields,
  getBaseCustomFieldsInfo,
  checkBeforeDelete,
};
