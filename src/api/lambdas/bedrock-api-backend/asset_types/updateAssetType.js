/* eslint-disable no-console */
import {
  newClient, checkInfo, checkExistence, updateInfo, deleteInfo,
} from '../utilities/utilities.js';
import pgErrorCodes from '../pgErrorCodes.js';

async function addCustomFieldsInfo(client, idValue, body) {
  const valueStrings = [];

  body.custom_fields.forEach((obj) => {
    const customFieldId = Object.keys(obj);
    const required = obj[customFieldId];
    valueStrings.push(`('${idValue}', '${customFieldId}', ${required})`);
  });
  const combinedValueString = valueStrings.join(', ');

  try {
    await client
      .query(
        `INSERT INTO bedrock.asset_type_custom_fields (asset_type_id, custom_field_id, required) VALUES ${combinedValueString}`,
      );
  } catch (error) {
    throw new Error([`Postgres error: ${pgErrorCodes[error.code]}`, error]);
  }

  return body;
}

async function updateAssetType(
  connection,
  allFields,
  body,
  idField,
  idValue,
  name,
  tableName,
  tableNameCustomFields,
  requiredFields,
) {
  const shouldExist = true;
  let client;
  let clientInitiated = false;

  const response = {
    error: false,
    message: `Successfully updated ${name} ${idValue}`,
    result: null,
  };

  try {
    checkInfo(body, requiredFields, name, idValue, idField);
    client = await newClient(connection);
    clientInitiated = true;
    await checkExistence(client, tableName, idField, idValue, name, shouldExist);
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
    response.result = await updateInfo(client, allFields, body, tableName, idField, idValue, name);
    await deleteInfo(client, 'asset_type_custom_fields', 'asset_type_id', idValue, name);
    await addCustomFieldsInfo(client, idValue, body, tableName, name);
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

export default updateAssetType;
