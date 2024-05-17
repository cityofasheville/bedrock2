/* eslint-disable no-console */
const {
  newClient, checkInfo, checkExistence, addInfo,
} = require('../utilities/utilities');

async function addCustomField(
  connection,
  body,
  idField,
  idValue,
  name,
  tableName,
  requiredFields,
) {
  const shouldExist = false;
  let client;
  let clientInitiated = false;

  const response = {
    error: false,
    message: `Successfully added ${name} ${idValue}`,
    result: null,
  };

  try {
    client = await newClient(connection);
    checkInfo(body, requiredFields, name, idValue, idField);
  } catch (error) {
    response.error = true;
    response.message = error.message;
    return response;
  }

  await client.query('BEGIN');

  try {
    await checkExistence(client, tableName, idField, idValue, name, shouldExist);
    response.result = await addInfo(client, body, tableName, name);
    await client.query('COMMIT');
    await client.end();
  } catch (error) {
    await client.query('ROLLBACK');
    await client.end();
    response.error = true;
    response.message = error.message;
    return response;
  }
  return response;
}

// module.exports = addTag;

 


//   try {
//     await checkExistence(client, pathElements);
//     response.result = await baseInsert(client, body);
//     assetTypeInfo = await assetTypeInsert(client, body)
//     response.result.asset_type_id = assetTypeInfo.asset_type_id
//     response.result.required = assetTypeInfo.required
//     await client.query('COMMIT');
//   } catch (error) {
//     await client.query('ROLLBACK');
//     response.error = true;
//     response.message = error.message;
//   } finally {
//     await client.end();
//     return response;
//   }
// }

module.exports = addCustomField;
