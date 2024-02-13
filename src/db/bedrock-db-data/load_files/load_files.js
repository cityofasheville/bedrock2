// A ONE TIME LOAD: Create JSON files from DB
/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
const { Client } = require('pg');
const fs = require('fs');

const { getDBConnection } = require('bedrock_common');
// const { getDBConnection } = require('./bedrock_NOGITHUB');

async function readEtlList(client) {
  let etlList = [];
  const sql = `SELECT * FROM bedrock.etl order by asset_name;`;
  const res = await client.query(sql)
    .catch((err) => {
      const errmsg = [err.code];
      throw new Error([`Postgres error: ${errmsg}`, err]);
    });
  etlList = res.rows;
  return etlList;
}

async function readTasks(client, etlList) {
  for (etl of etlList) {
    etl.tasks = [];
    const sql = `SELECT * FROM bedrock.tasks where asset_name = '${etl.asset_name}' order by seq_number;`;
    // eslint-disable-next-line no-await-in-loop
    const res = await client.query(sql)
      .catch((err) => {
        const errmsg = [err.code];
        throw new Error([`Postgres error: ${errmsg}`, err]);
      });
    for (let j = 0; j < res.rowCount; j += 1) {
      const task = res.rows[j];
      let thisTask = {
        type: task.type,
        active: task.active,
      };
      if (task.type === 'table_copy' || task.type === 'file_copy' || task.type === 'aggregate') {
        thisTask.source_location = task.source;
        thisTask.target_location = task.target;
      } else if (task.type === 'sql') {
        thisTask.connection = task.target.connection;
        thisTask.sql_string = task.configuration;
      } else if (task.type === 'run_lambda' || task.type === 'encrypt') {
        thisTask = { ...thisTask, ...task.target };
      }
      etl.tasks.push(thisTask);
    }
  }
  return etlList;
}
////////////////////////////////////////////
async function readAssetList(client) {
  let sql = `SELECT * FROM bedrock.assets order by asset_name;`;
  // eslint-disable-next-line no-await-in-loop
  let res = await client.query(sql)
    .catch((err) => {
      const errmsg = [err.code];
      throw new Error([`Postgres error: ${errmsg}`, err]);
    });
  const assetList = res.rows;
  const nAssets = res.rowCount

  /*
   * Get custom fields for all the asset. We are just going to assume
   * that the fields are valid for the type
   */

  // Set up a map of custom field values, by asset_name
  sql = 'SELECT * FROM bedrock.custom_values order by asset_name;'
  res = await client.query(sql)
  .catch((err) => {
    const errmsg = [err.code];
    throw new Error([`Postgres error: ${errmsg}`, err]);
  });

  const cValues = {};
  for (let i = 0; i < res.rowCount; i += 1) {
    if (res.rows[i].asset_name in cValues) {
      cValues[res.rows[i].asset_name].push(res.rows[i]);
    } else {
      cValues[res.rows[i].asset_name] = [res.rows[i]];
    }
  }

  // Now insert the custom values in the asset, if valid for the asset's type
  for (let i = 0; i < nAssets; i += 1) {
    const asset = assetList[i];
    if (asset.asset_name in cValues) {
      asset['custom_fields'] = {};
      const vals = cValues[asset.asset_name];
      for (let j = 0; j < vals.length; j += 1) {
        asset['custom_fields'][vals[j].field_id] = vals[j].field_value;
//        assetList[i][vals[j].field_name] = vals[j].field_value;
      }
    }
  }
  return assetList;
}

async function readDependencies(client, assetList) {
  for (asset of assetList) {
    asset.depends = [];
    const sql = `SELECT * FROM bedrock.dependencies where asset_name = '${asset.asset_name}';`;
    // eslint-disable-next-line no-await-in-loop
    const res = await client.query(sql)
      .catch((err) => {
        const errmsg = [err.code];
        throw new Error([`Postgres error: ${errmsg}`, err]);
      });
    for (let j = 0; j < res.rowCount; j += 1) {
      const d = res.rows[j];
      asset.depends.push(d.dependency);
    }
  }
  return assetList;
}

async function readTags(client, assetList) {
  for (asset of assetList) {
    asset.tags = [];
    const sql = `select tag_name from bedrock.asset_tags inner join bedrock.tags using (tag_name) where asset_name = '${asset.asset_name}';`;
    // eslint-disable-next-line no-await-in-loop
    const res = await client.query(sql)
      .catch((err) => {
        const errmsg = [err.code];
        throw new Error([`Postgres error: ${errmsg}`, err]);
      });
    for (let j = 0; j < res.rowCount; j += 1) {
      const d = res.rows[j];
      asset.tags.push(d.tag_name);
    }
  }
  return assetList;
}

function getAssetBase(assetName) {
  const idx = assetName.lastIndexOf('.');
  if (idx < 0) {
    return assetName;
  }
  return assetName.substr(0, idx);
}

////////////////////////////////////////////
function writeAsset(assetList, assets_directory) {
  for (asset of assetList) {
    let name = asset.asset_name;
    let base_name = getAssetBase(name);
    if (!fs.existsSync(assets_directory + base_name)) {
      fs.mkdirSync(assets_directory + base_name);
    }
    fs.writeFileSync(assets_directory + base_name + '/' + name + '.json', JSON.stringify(asset, null, 2));
  }
}

////////////////////////////////////////////
function writeEtl(etlList, assets_directory) {
  for (etl of etlList) {
    let name = etl.asset_name;
    let base_name = getAssetBase(name);
    if (!fs.existsSync(assets_directory + base_name)) {
      fs.mkdirSync(assets_directory + base_name);
    }
    fs.writeFileSync(assets_directory + base_name + '/' + name + '.ETL.json', JSON.stringify(etl, null, 2));
  }
}

////////////////////////////////////////////
// load stand-alone files: run_groups.csv and tags.csv
async function writeOther(client, data_directory, tablename) {
  const sql = `SELECT * FROM bedrock.${tablename}`;
  // eslint-disable-next-line no-await-in-loop
  const res = await client.query(sql)
    .catch((err) => {
      const errmsg = [err.code];
      throw new Error([`Postgres error: ${errmsg}`, err]);
    });
  let fileContent = "";
  for (row of res.rows) {
    let vals = Object.values(row);
    fileContent += vals.map(val => '"' + val + '"').join(",") + "\n";
  }
  fs.writeFileSync(data_directory + `/${tablename}.csv`, fileContent);
}

////////////////////////////////////////////
(async function loadfiles() {
  data_directory = '../data';
  assets_directory = data_directory + '/assets/';
  // create or clear assets dir
  if (fs.existsSync(assets_directory)) {
    fs.readdirSync(assets_directory).forEach(f => fs.rmSync(`${assets_directory}/${f}`, { recursive: true }));
  } else {
    fs.mkdirSync(assets_directory);
  }

  console.log('Connect to the DB');
  const dbConnection = await getDBConnection();
  const client = new Client(dbConnection);
  await client.connect();
  console.log('Connected, create the files');
  
  // load etl files
  let etlList = await readEtlList(client);
  etlList = await readTasks(client, etlList);
  // console.log(JSON.stringify(etlList, null, 2));
  writeEtl(etlList, assets_directory);

  // load asset files
  let assetList = await readAssetList(client);
  assetList = await readDependencies(client, assetList);
  assetList = await readTags(client, assetList);
  // console.log(JSON.stringify(assetList, null, 2));
  writeAsset(assetList, assets_directory);

  await writeOther(client, data_directory, 'run_groups');
  await writeOther(client, data_directory, 'tags');
  await writeOther(client, data_directory, 'connections');

  await client.end();
})();
