/* eslint-disable import/extensions */
/* eslint-disable no-console */
import { getInfo } from '../utilities/utilities.js';


async function getAssetInfo(db, idValue, name) {
  // Querying database to get information. Function can be used multiple times per method
  // if we need information from multiple tables
  const sql = 'SELECT a.*, b.asset_name FROM bedrock.etl a left join bedrock.assets b on a.asset_id = b.asset_id where run_group_id like $1';
  let res;
  try {
    res = await db.query(sql, [idValue]);
  } catch (error) {
    throw new Error([`Postgres error:  ${error}`]);
  }

  return res;
}

async function getRunGroup(
  db,
  idField,
  idValue,
  name,
  tableName,
) {

  const response = {
    statusCode: 200,
    message: '',
    result: null,
  };

  response.result = await getInfo(db, idField, idValue, name, tableName);
  const assetInfo = await getAssetInfo(db, idValue, name);
  response.result.assets = [];
  assetInfo.rows.forEach((obj) => {
    response.result.assets.push({ asset_id: obj.asset_id, asset_name: obj.asset_name, display_name: obj.display_name });
  });

  return response;
}

export default getRunGroup;
