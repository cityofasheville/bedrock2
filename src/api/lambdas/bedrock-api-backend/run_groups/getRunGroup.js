/* eslint-disable import/extensions */
/* eslint-disable no-console */
import { newClient, getInfo } from '../utilities/utilities.js';
import pgErrorCodes from '../pgErrorCodes.js';

async function getAssetInfo(client, idValue, name) {
  // Querying database to get information. Function can be used multiple times per method
  // if we need information from multiple tables
  const sql = 'SELECT a.*, b.display_name FROM bedrock.etl a left join bedrock.assets b on a.asset_name = b.asset_name where run_group like $1';
  let res;
  try {
    res = await client.query(sql, [idValue]);
  } catch (error) {
    throw new Error([`Postgres error: ${pgErrorCodes[error.code]}`, error]);
  }

  if (res.rowCount === 0) {
    throw new Error(`Asset information for ${name} not found`);
  }
  return res;
}

async function getRunGroup(
  connection,
  idField,
  idValue,
  name,
  tableName,
) {
  let client;
  let clientInitiated = false;

  const response = {
    error: false,
    message: '',
    result: null,
  };

  try {
    client = await newClient(connection);
    clientInitiated = true;
    response.result = await getInfo(client, idField, idValue, name, tableName);
    const assetInfo = await getAssetInfo(client, idValue, name);
    console.log(assetInfo);
    response.result.assets = [];
    assetInfo.rows.forEach((obj) => {
      response.result.assets.push({ asset_name: obj.asset_name, display_name: obj.display_name }); 
    });
    await client.end();
  } catch (error) {
    if (clientInitiated) {
      await client.end();
    }
    response.error = true;
    response.message = error.message;
    return response;
  }
  return response;
}

export default getRunGroup;
