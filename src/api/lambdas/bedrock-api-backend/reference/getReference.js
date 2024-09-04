/* eslint-disable import/extensions */
/* eslint-disable no-console */
import pgpkg from 'pg';

import { getCustomFieldsInfo } from '../utilities/assetUtilities.js';

async function getInfo(db, info) {
  let sql = `SELECT * FROM bedrock.${info.table_name}`;
  let res;
  let resultArray = [];

  if (info.field_name !== 'all') {
    sql += ` order by ${info.field_name} asc`;
  }

  try {
    res = await db.query(sql, []);
    // Either build the array of strings if you just need one field,
    // or just add the entire res.rows if you need all fields
    if (info.field_name !== 'all') {
      for (let i = 0; i < res.rows.length; i += 1) {
        resultArray.push(res.rows[i][info.field_name]);
      }
    } else {
      resultArray = res.rows;
    }
  } catch (error) {
    throw new Error(`PG error getting ${info.table_name} information: ${error}`);
  }

  return resultArray;
}

async function getTaskType(db) {
  const sql = 'SELECT unnest(enum_range(NULL::task_types)) as task_type;';
  let res;
  const resultArray = [];

  // We're only adding unique task types
  try {
    res = await db.query(sql, []);
    for (let i = 0; i < res.rows.length; i += 1) {
      resultArray.push(res.rows[i].task_type);
    }
  } catch (error) {
    throw new Error(`PG error getting tasks information: ${error}`);
  }

  return resultArray;
}

async function getConnectionClass(db) {
  const sql = 'SELECT unnest(enum_range(NULL::connections_classes)) as connection_class;';
  let res;
  const resultArray = [];

  // We're only adding unique task types
  try {
    res = await db.query(sql, []);
    for (let i = 0; i < res.rows.length; i += 1) {
      resultArray.push(res.rows[i].connection_class);
    }
  } catch (error) {
    throw new Error(`PG error getting tasks information: ${error}`);
  }

  return resultArray;
}

async function getCustomFields(db) {
  const sql = 'SELECT asset_type_id, asset_type_name FROM bedrock.asset_types';
  let res;

  const resultMap = new Map();
  const types = [];

  try {
    res = await db.query(sql, []);
    res.rows.forEach((row) => {
      types.push(row.asset_type_id);
      const typeMap = new Map();
      typeMap.set('asset_type_name', row.asset_type_name);
      resultMap.set(row.asset_type_id, typeMap);
    });
  } catch (error) {
    throw new Error(`PG error getting asset types: ${error}`);
  }
  let type;
  for (type of types) {
    const customFields = await getCustomFieldsInfo(db, type);
    const typeMap = resultMap.get(type);
    typeMap.set('fields', Object.fromEntries(customFields.entries()));
  }

  for (const [id, itm] of resultMap) {
    resultMap[id] = Object.fromEntries(resultMap.get(id).entries());
  }

  return resultMap;
}

async function getReference(db) {
  const result = {
    statusCode: 200,
    message: '',
    result: {},
  };

  // if you want to add info from a new another table, and need either a single column
  // or all the columns, just add it to this array
  const queryInfo = [
    // { table_name: 'run_groups', field_name: 'run_group_id' },
    // { table_name: 'tags', field_name: 'all' },
    { table_name: 'connections', field_name: 'all' },
    // { table_name: 'owners', field_name: 'all' },
  ];

  // loop through queryInfo array, adding info for each table listed in the array
  for (let i = 0; i < queryInfo.length; i += 1) {
    try {
      result.result[queryInfo[i].table_name] = await getInfo(db, queryInfo[i]);
    } catch (error) {
      result.statusCode = 500;
      result.message = error.message;
      return result;
    }
  }

  // Tasks and connections class gets their own functions because
  // we have to build the array differently
  try {
    result.result.task_type = await getTaskType(db);
    result.result.connection_class = await getConnectionClass(db);
  } catch (error) {
    result.statusCode = 500;
    result.message = error.message;
    return result;
  }

  // Custom fields also gets its own function because we're creating a map to return
  try {
    result.result.custom_fields = await getCustomFields(db);
  } catch (error) {
    result.statusCode = 500;
    result.message = error.message;
    return result;
  }

  return result;
}

export default getReference;
