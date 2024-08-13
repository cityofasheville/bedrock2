/* eslint-disable import/extensions */
/* eslint-disable no-console */
import pgpkg from 'pg';
import pgErrorCodes from '../pgErrorCodes.js';
import { checkExistence } from '../utilities/utilities.js';

const { Client } = pgpkg;

async function newClient(connection) {
  const client = new Client(connection);
  try {
    await client.connect();
    return client;
  } catch (error) {
    throw new Error(`PG error connecting: ${pgErrorCodes[error.code]||error.code}`);
  }
}

async function readAsset(client, idValue, tableName) {
  let res;
  const sql = `SELECT a.asset_id
  FROM ${tableName} a where a.asset_id like $1`;
  try {
    res = await client.query(sql, [idValue]);
  } catch (error) {
    throw new Error(`PG error getting asset information: ${pgErrorCodes[error.code]||error.code}`);
  }
  return res;
}

async function readRelations(client, idValue) {
  // this function queries the dependency_view , not the dependencies table.
  // this is done to capture any implied dependencies
  let res;
  const relations = {
    ancestors: {
      items: [],
      unique_items: [],
    },
    descendants: {
      items: [],
      unique_items: [],
    },
  };
  let sql = `
  WITH RECURSIVE subdependencies AS (
    SELECT asset_id, asset_name, dependent_asset_id, dependency 
    FROM bedrock.dependency_view
    WHERE asset_id = $1
    UNION
    SELECT d.asset_id, d.asset_name, d.dependent_asset_id, d.dependency
    FROM bedrock.dependency_view d
    INNER JOIN subdependencies s ON s.dependent_asset_id = d.asset_id
)
SELECT subdependencies.asset_id, subdependencies.asset_name, subdependencies.dependent_asset_id, subdependencies.dependency, a1.asset_type_id as asset_type, a2.asset_type_id as dependent_asset_type, at1.asset_type_name as asset_type_name, at2.asset_type_name as dependent_asset_type_name, a1.owner_id as asset_owner_id, a2.owner_id as dependent_owner_id, o1.owner_name as asset_owner_name, o2.owner_name as dependent_owner_name, r1.run_group_name as run_group_name, r2.run_group_name as dependent_run_group
FROM subdependencies
LEFT JOIN bedrock.assets a1 ON subdependencies.asset_id = a1.asset_id
LEFT JOIN bedrock.assets a2 ON subdependencies.dependent_asset_id = a2.asset_id
LEFT JOIN bedrock.asset_types at1 ON a1.asset_type_id  = at1.asset_type_id
LEFT JOIN bedrock.asset_types at2 ON a2.asset_type_id = at2.asset_type_id
LEFT JOIN bedrock.owners o1 ON a1.owner_id  = o1.owner_id
LEFT JOIN bedrock.owners o2 ON a2.owner_id = o2.owner_id
LEFT JOIN bedrock.etl e1 ON subdependencies.asset_id = e1.asset_id
LEFT JOIN bedrock.etl e2 ON subdependencies.dependent_asset_id = e2.asset_id
LEFT JOIN bedrock.run_groups r1 ON e1.run_group_id = r1.run_group_id
LEFT JOIN bedrock.run_groups r2 ON e2.run_group_id = r2.run_group_id
      `;
  let check = {};
  try {
    res = await client.query(sql, [idValue]);
  } catch (error) {
    throw new Error(`PG error getting ancestor information: ${pgErrorCodes[error.code]||error.code}`);
  }


  for (let i = 0; i < res.rowCount; i += 1) {
    relations.ancestors.items.push(
      {
        asset_id: res.rows[i].asset_id,
        asset_name: res.rows[i].asset_name,
        asset_type: res.rows[i].asset_type_name,
        asset_run_group: res.rows[i].run_group_name,
        asset_owner_name: res.rows[i].asset_owner_name,
        parent_id: res.rows[i].dependent_asset_id,
        parent_name: res.rows[i].dependency,
        parent_asset_type: res.rows[i].dependent_asset_type_name,
        parent_run_group: res.rows[i].dependent_run_group,
        parent_owner_name: res.rows[i].dependent_owner_name
      },
    );
    if (!(res.rows[i].dependent_asset_id in check)) {
      relations.ancestors.unique_items.push(res.rows[i].dependent_asset_id);
      check[res.rows[i].dependent_asset_id] = true;
    }
  }

  // Now the other direction
  sql = `
      WITH RECURSIVE subdependencies AS (
        SELECT asset_id, asset_name, dependent_asset_id, dependency 
        FROM bedrock.dependency_view
        WHERE dependent_asset_id = $1
        UNION
        SELECT d.asset_id, d.asset_name, d.dependent_asset_id, d.dependency
        FROM bedrock.dependency_view d
        INNER JOIN subdependencies s ON s.asset_id = d.dependent_asset_id
          )
    SELECT subdependencies.asset_id, subdependencies.asset_name, subdependencies.dependent_asset_id, subdependencies.dependency, a1.asset_type_id as asset_type, a2.asset_type_id as dependent_asset_type, at1.asset_type_name as asset_type_name, at2.asset_type_name as dependent_asset_type_name, a1.owner_id as asset_owner_id, a2.owner_id as dependent_owner_id, o1.owner_name as asset_owner_name, o2.owner_name as dependent_owner_name, r1.run_group_name as run_group_name, r2.run_group_name as dependent_run_group
    FROM subdependencies
    LEFT JOIN bedrock.assets a1 ON subdependencies.asset_id = a1.asset_id
    LEFT JOIN bedrock.assets a2 ON subdependencies.dependent_asset_id = a2.asset_id
    LEFT JOIN bedrock.asset_types at1 ON a1.asset_type_id  = at1.asset_type_id
    LEFT JOIN bedrock.asset_types at2 ON a2.asset_type_id = at2.asset_type_id
    LEFT JOIN bedrock.owners o1 ON a1.owner_id  = o1.owner_id
    LEFT JOIN bedrock.owners o2 ON a2.owner_id = o2.owner_id
    LEFT JOIN bedrock.etl e1 ON subdependencies.asset_id = e1.asset_id
    LEFT JOIN bedrock.etl e2 ON subdependencies.dependent_asset_id = e2.asset_id
    LEFT JOIN bedrock.run_groups r1 ON e1.run_group_id = r1.run_group_id
    LEFT JOIN bedrock.run_groups r2 ON e2.run_group_id = r2.run_group_id
      `;
  check = {};
  try {
    res = await client.query(sql, [idValue]);
  } catch (error) {
    throw new Error(`PG error getting descendent information: ${pgErrorCodes[error.code]||error.code}`);
  }


  for (let i = 0; i < res.rowCount; i += 1) {
    relations.descendants.items.push(
      {
        asset_id: res.rows[i].asset_id,
        asset_name: res.rows[i].asset_name,
        asset_type: res.rows[i].asset_type_name,
        asset_run_group: res.rows[i].run_group_name,
        asset_owner_name: res.rows[i].asset_owner_name,
        parent_id: res.rows[i].dependent_asset_id,
        parent_name: res.rows[i].dependency,
        parent_asset_type: res.rows[i].dependent_asset_type_name,
        parent_run_group: res.rows[i].dependent_run_group,
        parent_owner_name: res.rows[i].dependent_owner_name
      },
    );
    if (!(res.rows[i].asset_id in check)) {
      relations.descendants.unique_items.push(res.rows[i].asset_id);
      check[res.rows[i].asset_id] = true;
    }
  }
  return relations;
}

async function getTags(client, formattedTagList) {
  const sql = `
  select * from bedrock.asset_tags a left join bedrock.tags b on a.tag_id = b.tag_id
  where asset_id in (${formattedTagList.join()})
`;
  let sqlResult;
  try {
    sqlResult = await client.query(sql);
  } catch (error) {
    throw new Error(`PG error getting asset tags: ${pgErrorCodes[error.code]||error.code}`);
  }
  return sqlResult;
}

async function getAllAssetRelations(
  connection,
  idValue,
  tableName,
  idField,
  name
) {
  let client;
  let relations;
  let res;
  const shouldExist = true;
  const response = {
    error: false,
    message: '',
    result: {
      ancestors: {
        items: [],
        unique_items: [],
      },
      descendants: {
        items: [],
        unique_items: [],
      },
    },
  };

  try {
    client = await newClient(connection);
  } catch (error) {
    response.error = true;
    response.message = error.message;
    return response;
  }

  try {
    await checkExistence(client, 'bedrock.assets', idField, idValue, name, shouldExist)
    res = await readAsset(client, idValue, tableName);
    if (res.rowCount === 0) {
      response.message = 'No assets found';
      return response;
    }

    relations = await readRelations(client, idValue);
    response.result.ancestors.items = relations.ancestors.items;
    response.result.ancestors.unique_items = relations.ancestors.unique_items;
    response.result.descendants.items = relations.descendants.items;
    response.result.descendants.unique_items = relations.descendants.unique_items;

    const tagList = response.result.ancestors.unique_items.concat(response.result.descendants.unique_items)
    const formattedTagList = tagList.map(item => `'${item}'`);
    const tagsResult = await getTags(client, formattedTagList);

    // matching tags to the correct assets
    // we're only pushing tag name since that's all the frontend needs.

    for (let obj1 of response.result.ancestors.items) {
      obj1.asset_tags = [];
      obj1.parent_tags = [];
      for (let obj2 of tagsResult.rows) {
        if (obj1.parent_id === obj2.asset_id) {
          obj1.parent_tags.push(obj2.tag_name);
        }
        if (obj1.asset_id === obj2.asset_id) {
          obj1.asset_tags.push(obj2.tag_name);
        }
      }
    }

    for (let obj1 of response.result.descendants.items) {
      obj1.asset_tags = [];
      obj1.parent_tags = [];
      for (let obj2 of tagsResult.rows) {
        if (obj1.parent_id === obj2.asset_id) {
          obj1.parent_tags.push(obj2.tag_name);
        }
        if (obj1.asset_id === obj2.asset_id) {
          obj1.asset_tags.push(obj2.tag_name);
        }
      }
    }
  } catch (error) {
    response.error = true;
    response.message = error.message;
    response.result = null;
    return response;
  } finally {
    await client.end();
  }
  return response;
}

export default getAllAssetRelations;