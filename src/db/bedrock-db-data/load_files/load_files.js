// A ONE TIME LOAD: Create JSON files from DB
/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
import pgpkg from 'pg';
const { Client } = pgpkg;
import { existsSync, mkdirSync, writeFileSync, readdirSync, rmSync } from 'fs';

import { getDBConnection } from 'bedrock_common';

async function readEtlList(client) {
  let etlList = [];
  const sql = `SELECT assets.asset_name, etl.* FROM bedrock.etl
  inner join bedrock.assets on etl.asset_id = assets.asset_id;`;
  const res = await client.query(sql)
    .catch((err) => {
      const errmsg = [err.code];
      throw new Error([`Postgres error: ${errmsg}`, err]);
    });
  etlList = res.rows;
  return etlList;
}

async function readTasks(client, etlList) {
  for (let etl of etlList) {
    etl.tasks = [];
    const sql = `SELECT * FROM bedrock.tasks where asset_id = '${etl.asset_id}' order by seq_number;`;
    // eslint-disable-next-line no-await-in-loop
    const res = await client.query(sql)
      .catch((err) => {
        const errmsg = [err.code];
        throw new Error([`Postgres error: ${errmsg}`, err]);
      });
    for (let j = 0; j < res.rowCount; j += 1) {
      const task = res.rows[j];
      etl.tasks.push(task);
    }
  }
  return etlList;
}
////////////////////////////////////////////
async function readAssetList(client) {
  let sql = `SELECT * FROM bedrock.assets;`;
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
  sql = `SELECT * FROM bedrock.custom_values;`
  res = await client.query(sql)
  .catch((err) => {
    const errmsg = [err.code];
    throw new Error([`Postgres error: ${errmsg}`, err]);
  });

  const cValues = {};
  for (let i = 0; i < res.rowCount; i += 1) {
    if (res.rows[i].asset_id in cValues) {
      cValues[res.rows[i].asset_id].push(res.rows[i]);
    } else {
      cValues[res.rows[i].asset_id] = [res.rows[i]];
    }
  }
  // Now insert the custom values in the asset, if valid for the asset's type
  for (let i = 0; i < nAssets; i += 1) {
    const asset = assetList[i];
    if (asset.asset_id in cValues) {
      asset['custom_fields'] = {};
      const vals = cValues[asset.asset_id];
      for (let j = 0; j < vals.length; j += 1) {
        asset['custom_fields'][vals[j].custom_field_id] = vals[j].field_value;
//        assetList[i][vals[j].field_name] = vals[j].field_value;
      }
    }
  }
  return assetList;
}

async function readDependencies(client, assetList) {
  for (let asset of assetList) {
    asset.depends = [];
    const sql = `SELECT dependent_asset_id, relation_type FROM bedrock.dependencies where asset_id = '${asset.asset_id}';`;
    // eslint-disable-next-line no-await-in-loop
    const res = await client.query(sql)
      .catch((err) => {
        const errmsg = [err.code];
        throw new Error([`Postgres error: ${errmsg}`, err]);
      });
    for (let j = 0; j < res.rowCount; j += 1) {
      const d = res.rows[j];
      asset.depends.push(d);
    }
  }
  return assetList;
}

async function readTags(client, assetList) {
  for (let asset of assetList) {
    asset.tags = [];
    const sql = `select tag_id from bedrock.asset_tags inner join bedrock.tags using (tag_id) where asset_id = '${asset.asset_id}';`;
    // eslint-disable-next-line no-await-in-loop
    const res = await client.query(sql)
      .catch((err) => {
        const errmsg = [err.code];
        throw new Error([`Postgres error: ${errmsg}`, err]);
      });
    for (let j = 0; j < res.rowCount; j += 1) {
      const d = res.rows[j];
      asset.tags.push(d.tag_id);
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
  for (let asset of assetList) {
    let name = asset.asset_name;
    let base_name = getAssetBase(name);
    if (!existsSync(assets_directory + base_name)) {
      mkdirSync(assets_directory + base_name);
    }
    console.log(`Writing ${name}.json`);
    writeFileSync(assets_directory + base_name + '/' + name + '.json', JSON.stringify(asset, null, 2));
  }
}

////////////////////////////////////////////
function writeEtl(etlList, assets_directory) {
  for (let etl of etlList) {
    let name = etl.asset_name;
    let base_name = getAssetBase(name);
    if (!existsSync(assets_directory + base_name)) {
      mkdirSync(assets_directory + base_name);
    }
    writeFileSync(assets_directory + base_name + '/' + name + '.ETL.json', JSON.stringify(etl, null, 2));
  }
}

////////////////////////////////////////////
// load stand-alone csv files: eg. run_groups.csv and tags.csv
async function writeOther(client, data_directory, tablename) {
  console.log(`Writing ${tablename}.csv`);
  const sql = `SELECT * FROM bedrock.${tablename}`;
  // eslint-disable-next-line no-await-in-loop
  const res = await client.query(sql)
    .catch((err) => {
      const errmsg = [err.code];
      throw new Error([`Postgres error: ${errmsg}`, err]);
    });
  let fileContent = "";
  for (let row of res.rows) {
    if(tablename === 'custom_fields') {
      row.field_data = JSON.stringify(row.field_data).replace(/"/g, '""');
    }
    let vals = Object.values(row);
    fileContent += vals.map(val => {
      if( val === null) { return null; }
      return '"' + val + '"';
    }).join(",") + "\n";


  }
  writeFileSync(data_directory + `/${tablename}.csv`, fileContent);
}

////////////////////////////////////////////

let data_directory = `../../../../${process.env.data_directory.replace(/"|'/g,"")}`;
let assets_directory = data_directory + '/assets/';
// create or clear assets dir
if (existsSync(assets_directory)) {
  readdirSync(assets_directory).forEach(f => rmSync(`${assets_directory}/${f}`, { recursive: true }));
} else {
  mkdirSync(assets_directory);
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

await writeOther(client, data_directory, 'asset_type_custom_fields');
await writeOther(client, data_directory, 'asset_types');
await writeOther(client, data_directory, 'connections');
await writeOther(client, data_directory, 'custom_fields');
await writeOther(client, data_directory, 'owners');
await writeOther(client, data_directory, 'run_groups');
await writeOther(client, data_directory, 'tags');


await client.end();

