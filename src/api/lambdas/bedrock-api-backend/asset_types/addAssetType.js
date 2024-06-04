/* eslint-disable import/extensions */
/* eslint-disable no-console */
import {
  newClient, checkInfo, checkExistence, addInfo, generateId,
} from '../utilities/utilities.js';
import pgErrorCodes from '../pgErrorCodes.js';

function checkCustomFields(body) {
  if (body.custom_fields) {
    if (!body.custom_fields.every((value) => typeof value === 'object')) {
      throw new Error('Custom fields lacking required property or formatted incorrectly.');
    }
  }
}

async function addCustomFieldsInfo(client, idValue, body) {
  let res;
  const valueStrings = [];
  console.log(body.custom_fields);

  body.custom_fields.forEach((obj) => {
    const customFieldId = Object.keys(obj);
    const required = obj[customFieldId];
    valueStrings.push(`('${idValue}', '${customFieldId}', ${required})`);
  });
  const combinedValueString = valueStrings.join(', ');
  console.log(valueStrings);
  console.log(`INSERT INTO bedrock.asset_type_custom_fields (asset_type_id, custom_field_id, required) VALUES ${combinedValueString}`);

  try {
    res = await client
      .query(
        `INSERT INTO bedrock.asset_type_custom_fields (asset_type_id, custom_field_id, required) VALUES ${combinedValueString}`,
      );
  } catch (error) {
    throw new Error([`Postgres error: ${pgErrorCodes[error.code]}`, error]);
  }
  console.log(res);
  // if (res.rowCount !== 1) {
  //   throw new Error(`Unknown error inserting new ${name}`);
  // }
  console.log('end of customfieldsadding');
  return body;
}

async function addAssetType(
  connection,
  allFields,
  body,
  idField,
  name,
  tableName,
  tableNameCustomFields,
  requiredFields,
) {
  const shouldExist = false;
  let client;
  let clientInitiated = false;
  body.id = generateId();
  const idValue = body.id;

  const response = {
    error: false,
    message: `Successfully added ${name} ${idValue}`,
    result: null,
  };

  try {
    client = await newClient(connection);
    clientInitiated = true;
    checkInfo(body, requiredFields, name, idValue, idField);
    checkCustomFields(body);
  } catch (error) {
    if (clientInitiated) {
      await client.end();
    }
    response.error = true;
    response.message = error.message;
    return response;
  }

  try {
    await client.query('BEGIN');
    await checkExistence(client, tableName, idField, idValue, name, shouldExist);
    await addCustomFieldsInfo(client, idValue, body);
    response.result = await addInfo(client, allFields, body, tableName, name);
    await client.query('COMMIT');
    await client.end();
  } catch (error) {
    await client.query('ROLLBACK');
    if (clientInitiated) {
      await client.end();
    }
    response.error = true;
    response.message = error.message;
    return response;
  }
  return response;
}

export default addAssetType;
