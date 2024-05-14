/* eslint-disable no-console */
const { Client } = require('pg');
const pgErrorCodes = require('../pgErrorCodes');

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

async function newClient(connection) {
  const client = new Client(connection);
  try {
    await client.connect();
    return client;
  } catch (error) {
    throw new Error(`PG error connecting: ${pgErrorCodes[error.code]}`);
  }
}

function checkInfo(body, requiredFields, name, idValue) {
  for (let i = 0; i < requiredFields.length; i += 1) {
    const field = requiredFields[i];
    console.log(field);
    if (!(field in body)) {
      throw new Error(`${capitalizeFirstLetter(name)} lacks required property ${requiredFields[i]}`);
    }
  }

  if (idValue !== body.tag_name) {
    throw new Error(`${capitalizeFirstLetter(name)} ${idValue} in path does not match ${name} ${body.tag_name} in body`);
  }
}

// eslint-disable-next-line max-len
async function checkExistence(client, tableName, idField, idValue, name, shouldExist) {
  const sql = `SELECT * FROM bedrock.${tableName} where ${idField} like $1`;
  console.log(sql);
  let res;
  try {
    res = await client.query(sql, [idValue]);
  } catch (error) {
    throw new Error([`Postgres error: ${pgErrorCodes[error.code]}`, error]);
  }

  if (shouldExist && (res.rowCount === 0)) {
    throw new Error(`${capitalizeFirstLetter(name)} like ${idValue} does not exist`);
  }

  if (!shouldExist && (res.rowCount > 0)) {
    throw new Error(`${capitalizeFirstLetter(name)} like ${idValue} already exists`);
  }
}

async function getInfo(client, idField, idValue, name, tableName) {
  const sql = `SELECT * FROM bedrock.${tableName} where ${idField} like $1`;
  console.log(sql);
  let res;
  try {
    res = await client.query(sql, [idValue]);
  } catch (error) {
    throw new Error([`Postgres error: ${pgErrorCodes[error.code]}`, error]);
  }

  if (res.rowCount === 0) {
    throw new Error(`${capitalizeFirstLetter(name)} not found`);
  }
  return res.rows[0];
}

async function insertInfo(client, body, allFields, tableName, name) {
  let res;

  let fieldsString = '(';
  let valueString = '(';
  let comma = '';
  let cnt = 0;

  // This is just a bunch of string manipulation.
  // It creates a string of the columns ala '(tag_name, display_name)'
  for (let i = 0; i < allFields.length; i += 1) {
    fieldsString += comma;
    fieldsString += allFields[i];
    comma = ', ';
    if ((i === (allFields.length - 1))) {
      fieldsString += ')';
    }
  }
  console.log(fieldsString);

  // More string manipulation that creates a string '($1, $2, $3)'
  // The length is based on the number of fields.
  comma = '';
  for (let i = 0; i < allFields.length; i += 1) {
    valueString += comma;
    valueString += '$';
    valueString += (cnt + 1).toString();
    cnt += 1;
    comma = ', ';
    if ((i === (allFields.length - 1))) {
      valueString += ')';
    }
  }
  console.log(valueString);

  // Creating an array of the actual values from the body
  const valuesFromBody = [];
  for (let i = 0; i < allFields.length; i += 1) {
    valuesFromBody.push(body[allFields[i]]);
  }

  console.log(valuesFromBody);
  console.log(`INSERT INTO bedrock.${tableName} ${fieldsString} VALUES${valueString}`);

  try {
    res = await client
      .query(
        `INSERT INTO bedrock.${tableName} ${fieldsString} VALUES${valueString}`,
        valuesFromBody,
      );
  } catch (error) {
    throw new Error([`Postgres error: ${pgErrorCodes[error.code]}`, error]);
  }

  if (res.rowCount !== 1) {
    throw new Error(`Unknown error inserting new ${name}`);
  }

  const result = {};
  for (let i = 0; i < allFields.length; i += 1) {
    result[allFields[i]] = body[allFields[i]];
  }

  return result;
}

async function updateInfo(client, body, tableName, idField, idValue, name) {
  const members = ['display_name'];
  let cnt = 1;
  const args = [];
  const tag = new Map();
  let sql = `UPDATE ${tableName} SET `;

  for (let i = 0, comma = ''; i < members.length; i += 1) {
    if (members[i] in body) {
      sql += `${comma} ${members[i]} = $${cnt}`;
      args.push(body[members[i]]);
      tag.set(members[i], body[members[i]]);
      cnt += 1;
      comma = ',';
    }
  }
  sql += ` where ${idField} = $${cnt}`;
  console.log(` where ${idField} = $${cnt}`);
  args.push(idValue);
  console.log(sql);
  console.log(JSON.stringify(args));
  try {
    await client.query(sql, args);
  } catch (error) {
    throw new Error(`PG error updating ${name}: ${pgErrorCodes[error.code]}`);
  }

  return tag;
}

async function deleteInfo(client, tableName, idField, idValue, name) {
  try {
    await client
      .query(`delete from bedrock.${tableName} where ${idField} = $1`, [
        idValue,
      ]);
  } catch (error) {
    throw new Error(`PG error deleting ${name} ${idValue}: ${pgErrorCodes[error.code]}`);
  }
}

module.exports = {
  newClient,
  checkInfo,
  checkExistence,
  getInfo,
  insertInfo,
  updateInfo,
  deleteInfo,
};
