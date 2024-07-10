/* eslint-disable import/extensions */
/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */
import { customAlphabet } from 'nanoid';
import pgpkg from 'pg';
import pgErrorCodes from '../pgErrorCodes.js';

const { Client } = pgpkg;

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

async function newClient(connection) {
  const client = new Client(connection);
  try {
    await client.connect();

    return client;
  } catch (error) {
    throw new Error(`PG error connecting: ${pgErrorCodes[error.code]||error.code}`);
  }
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

async function checkExistence(client, tableName, idField, idValue, name, shouldExist) {
  // query the database to make sure resource exists
  const sql = `SELECT * FROM ${tableName} where ${idField} like $1`;
  let res;
  try {
    res = await client.query(sql, [idValue]);
  } catch (error) {
    throw new Error([`Postgres error: ${pgErrorCodes[error.code]||error.code}`, error]);
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

async function getInfo(client, idField, idValue, name, tableName) {
  // Querying database to get information. Function can be used multiple times per method
  // if we need information from multiple tables
  const sql = `SELECT * FROM ${tableName} where ${idField} like $1`;
  let res;
  try {
    res = await client.query(sql, [idValue]);
  } catch (error) {
    throw new Error([`Postgres error: ${pgErrorCodes[error.code]||error.code}`, error]);
  }

  if (res.rowCount === 0) {
    throw new Error(`${capitalizeFirstLetter(name)} not found`);
  }
  return res.rows[0];
}

async function addInfo(client, allFields, body, tableName, name) {
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
    res = await client
      .query(
        `INSERT INTO ${tableName} ${fieldsString} VALUES${valueString}`,
        valuesFromBody,
      );
  } catch (error) {
    throw new Error([`Postgres error: ${pgErrorCodes[error.code]||error.code}`, error]);
  }

  if (res.rowCount !== 1) {
    throw new Error(`Unknown error inserting new ${name}`);
  }

  return body;
}

async function updateInfo(client, allFields, body, tableName, idField, idValue, name) {
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
    await client.query(sql, args);
  } catch (error) {
    throw new Error(`PG error updating ${name}: ${pgErrorCodes[error.code]||error.code}`);
  }

  return body;
}

async function deleteInfo(client, tableName, idField, idValue, name) {
  try {
    await client
      .query(`delete from ${tableName} where ${idField} = $1`, [
        idValue,
      ]);
  } catch (error) {
    throw new Error(`PG error deleting ${name} ${idValue}: ${pgErrorCodes[error.code]||error.code}`);
  }
}

async function addAssetTypeCustomFields(client, idValue, body) {
  let res;
  const valueStrings = [];

  body.custom_fields.forEach((obj) => {
    const customFieldId = obj.custom_field_id;
    const required = obj.required;
    valueStrings.push(`('${idValue}', '${customFieldId}', ${required})`);
  });
  const combinedValueString = valueStrings.join(', ');

  try {
    res = await client
      .query(
        `INSERT INTO bedrock.asset_type_custom_fields (asset_type_id, custom_field_id, required) VALUES ${combinedValueString}`,
      );
  } catch (error) {
    throw new Error([`Postgres error: ${pgErrorCodes[error.code]}`, error]);
  }

  return body.custom_fields;
}

async function getAncestorCustomFieldsInfo(client, idValue) {
  let sqlQuery;
  let sqlResult;
  let types = '';
  const customFields = new Map();
  try {
    // Get the asset type hierarchy
    sqlQuery = `
      WITH RECURSIVE ancestors AS (
        SELECT asset_type_id, parent, asset_type_name FROM bedrock.asset_types
        WHERE asset_type_id = $1
        UNION
          SELECT t.asset_type_id, t.parent, t.asset_type_name
          FROM bedrock.asset_types t
          INNER JOIN ancestors a ON a.parent = t.asset_type_id
      ) SELECT * FROM ancestors;
    `;
    sqlResult = await client.query(sqlQuery, [idValue]);
    if (sqlResult.rowCount < 1) {
      throw new Error(`Asset type ${idValue} not found`);
    }
  //   sqlResult.rows.forEach((itm, i) => {
  //     const comma = i > 0 ? ',' : '';
  //     if (itm.asset_type_id != idValue) {
  //     types = `${types}${comma} '${itm.asset_type_id}'`;
  // }});
  let types = [];

  sqlResult.rows.forEach((itm) => {
    if (itm.asset_type_id != idValue) {
      types.push(`'${itm.asset_type_id}'`);
    }
  });

  types = types.join(', ');

    // Now get custom fields associated with any of the types
    // Field is required if any type in the hierarchy requires it
    if (types) {
      sqlQuery = `
      select custom_field_id, custom_field_name, field_type, field_data, bool_or(required) as required
      from (
        select c.custom_field_id, c.custom_field_name, c.field_type, c.field_data, j.required from bedrock.custom_fields c
        left outer join bedrock.asset_type_custom_fields j
        on c.custom_field_id = j.custom_field_id
        where j.asset_type_id in (${types})
      ) a
      group by custom_field_id, custom_field_name, field_type, field_data
    `;
    sqlResult = await client.query(sqlQuery, []);

    sqlResult.rows.forEach((itm) => {
      customFields.set(itm.custom_field_id, itm);
    });
    }

  } catch (error) {
    throw new Error(
      `PG error getting asset type hierarchy for type ${idValue}: ${pgErrorCodes[error.code]}`,
    );
  }
  return customFields;
}

function formatCustomFields(baseCustomFields, ancestorCustomFields) {

  const combinedCustomFields = new Map();

    // Process all entries from baseCustomFields
    for (const [key, baseValue] of baseCustomFields) {
        if (ancestorCustomFields.has(key)) {
            // Property exists in both baseCustomFields and ancestorCustomFields
            const ancestorValue = ancestorCustomFields.get(key);
            combinedCustomFields.set(key, {
                ...baseValue,
                inherited: calculateInheritance(true, ancestorValue.required),
                required: ancestorValue.required
            });
        } else {
            // Property only exists in baseCustomFields
            combinedCustomFields.set(key, {
                ...baseValue,
                inherited: calculateInheritance(false, baseValue.required)
            });
        }
    }

    // Add properties from ancestorCustomFields that are not in baseCustomFields
    if (ancestorCustomFields) {
      for (const [key] of ancestorCustomFields) {
        const ancestorValue = ancestorCustomFields.get(key);
        if (!baseCustomFields.has(key)) {
          combinedCustomFields.set(key, {
                ...ancestorValue,
                inherited: calculateInheritance(true, ancestorValue.required)
            });
        }
    }
    }

  return Object.fromEntries(combinedCustomFields);
}

function calculateInheritance(inherited, required) {
  if (inherited) {
    if (required) {
      return 1
    } else {
      return 0
    }
  } else {
    return -1
  }
}

async function getBaseCustomFieldsInfo(client, idField, idValue, name, tableName) {
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
    res = await client.query(sql, []);
  } catch (error) {
    throw new Error([`Postgres error: ${pgErrorCodes[error.code]}`, error]);
  }

  res.rows.forEach((itm) => {
    customFields.set(itm.custom_field_id, itm);
  });

  return customFields;
}

async function checkBeforeDelete(client, name, tableName, idField, idValue, connectedData, connectedDataIdField) {
  const sql = `SELECT * FROM ${tableName} where ${idField} like $1`;
  let res;
  let list = [];
  try {
    res = await client.query(sql, [idValue]);
  } catch (error) {
    throw new Error([`Postgres error: ${pgErrorCodes[error.code]||error.code}`, error]);
  }

  if (res.rowCount !== 0) {
    console.log(res);
    res.rows.forEach((element) => list.push(element[connectedDataIdField]))
    throw new Error(`${capitalizeFirstLetter(name)} ${idValue} is still connected to one or more ${connectedData} (Ids: ${list.join(', ')}). You must delete these relationships from ${tableName} before deleting this ${name}.`)
  }

}

export {
  newClient,
  checkInfo,
  checkExistence,
  capitalizeFirstLetter,
  getInfo,
  addInfo,
  updateInfo,
  deleteInfo,
  generateId,
  addAssetTypeCustomFields,
  formatCustomFields,
  getAncestorCustomFieldsInfo,
  getBaseCustomFieldsInfo,
  checkBeforeDelete,
};
