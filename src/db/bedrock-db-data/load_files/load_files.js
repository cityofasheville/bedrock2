// A ONE TIME LOAD: Create JSON files from DB
/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
const { Client } = require('pg');
const fs = require('fs');

const { getDBConnection } = require('bedrock_common');

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
      if (task.type === 'table_copy' || task.type === 'file_copy') {
        thisTask.source_location = task.source;
        thisTask.target_location = task.target;
      } else if (task.type === 'sql') {
        thisTask.connection = task.target.connection;
        thisTask.sql_string = task.configuration;
      } else if (task.type === 'run_lambda' || task.type === 'encrypt') {
        thisTask = { ...thisTask, ...task.target};
      }
      etl.tasks.push(thisTask);
    }
  }
  return etlList;
}
////////////////////////////////////////////
async function readAssetList(client) {
  const sql = `SELECT * FROM bedrock.assets order by asset_name;`;
  // eslint-disable-next-line no-await-in-loop
  const res = await client.query(sql)
    .catch((err) => {
      const errmsg = [err.code];
      throw new Error([`Postgres error: ${errmsg}`, err]);
    });
  const assetList = res.rows;
  return assetList;
}

async function readDependencies(client, assetList) {
  for(asset of assetList) {
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
  for(asset of assetList) {
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

////////////////////////////////////////////
function writeAsset(assetList,assets_directory) {
  for(asset of assetList) {
    let name = asset.asset_name;
    if (!fs.existsSync(assets_directory + name)) {
      fs.mkdirSync(assets_directory + name);
    }
    fs.writeFileSync(assets_directory + name + '/' + name + '.json', JSON.stringify(asset, null, 2));
  }
}

////////////////////////////////////////////
function writeEtl(etlList,assets_directory) {
  for(etl of etlList) {
    let name = etl.asset_name;
    if (!fs.existsSync(assets_directory + name)) {
      fs.mkdirSync(assets_directory + name);
    }
    fs.writeFileSync(assets_directory + name + '/' + name + '.ETL.json', JSON.stringify(etl, null, 2));
  }
}
////////////////////////////////////////////
(async function loadfiles() {
  try {
    data_directory = '../test_data';
    assets_directory = data_directory + '/assets/';
    // create or clear assets dir
    if (fs.existsSync(assets_directory)) {
      fs.readdirSync(assets_directory).forEach(f => fs.rmSync(`${assets_directory}/${f}`, { recursive: true }));
    }else{
      fs.mkdirSync(assets_directory);
    }
    
    const dbConnection = await getDBConnection();
    const client = new Client(dbConnection);
    await client.connect();

    // load etl files
    let etlList = await readEtlList(client);
    etlList = await readTasks(client, etlList);
    // console.log(JSON.stringify(etlList, null, 2));
    writeEtl(etlList,assets_directory);

    // load asset files
    let assetList = await readAssetList(client);
    assetList = await readDependencies(client, assetList);
    assetList = await readTags(client, assetList);
    // console.log(JSON.stringify(assetList, null, 2));
    writeAsset(assetList,assets_directory);

    await client.end();
  }
  catch (err) {
    const errmsg = [err.code];
    throw new Error([`Postgres error: ${errmsg}`, err]);
  };
})();
