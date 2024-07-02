// A ONE TIME LOAD: Create JSON files from DB
/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
import pgpkg from 'pg';
const { Client } = pgpkg;
import { existsSync, mkdirSync, readFileSync, readdirSync } from 'fs';

import { getDBConnection } from 'bedrock_common';
import { parse } from 'csv-parse/sync';

async function clearOutDB(client) {
  let sql = `
    truncate table ${process.env.BEDROCK_DB_SCHEMA}.assets;
    truncate table ${process.env.BEDROCK_DB_SCHEMA}.dependencies;
    truncate table ${process.env.BEDROCK_DB_SCHEMA}.etl;
    truncate table ${process.env.BEDROCK_DB_SCHEMA}.tasks;
    truncate table ${process.env.BEDROCK_DB_SCHEMA}.asset_tags;
    truncate table ${process.env.BEDROCK_DB_SCHEMA}.tags;
    truncate table ${process.env.BEDROCK_DB_SCHEMA}.run_groups;
    truncate table ${process.env.BEDROCK_DB_SCHEMA}.connections;
    truncate table ${process.env.BEDROCK_DB_SCHEMA}.custom_fields;
    truncate table ${process.env.BEDROCK_DB_SCHEMA}.custom_values;
    truncate table ${process.env.BEDROCK_DB_SCHEMA}.owners;
    truncate table ${process.env.BEDROCK_DB_SCHEMA}.asset_types;
    truncate table ${process.env.BEDROCK_DB_SCHEMA}.asset_type_custom_fields;
  `;
  await client.query(sql)
    .catch((err) => {
      const errmsg = [err.code];
      throw new Error([`Postgres error: ${errmsg}`, err]);
    });
}


async function readCsvFiles(client, data_directory) {
  let file_names = readdirSync(data_directory);
  for (let file_name of file_names) {
    let fileNm = file_name.split('.');
    let tableName = fileNm[0];
    if (fileNm[fileNm.length - 1].toLowerCase() === 'csv')  {
      let fileContent = readFileSync  (data_directory + '/' + file_name, 'utf8').trim();

      let values = parse(fileContent,{ 
        cast: (value, {quoting}) => {
            if (value === 'NULL') {return null;}
            if (quoting) {return value;}
            if (value === '') {return null;}
            return value;
          }
       });
      let numCols = values[0].length;

      // load into DB
      let sql = `insert into ${process.env.BEDROCK_DB_SCHEMA}.${tableName} values (`;
      let ii = []; // for the $1, $2, $3, etc.
      for (let i = 1; i < numCols + 1; i++) {
        ii.push(`$${i}`);
      }
      sql += ii.join(',') + ');';
      for(let row of values) {
        await client.query(sql, row)
          .catch((err) => {
            const errmsg = [err.code];
            throw new Error([`Postgres error: ${errmsg}`, err]);
          });
      }
    }
  }
}

async function readAssetFiles(client, assets_directory) {
  if (existsSync(assets_directory)) {
    let asset_subdirs = readdirSync(assets_directory);
    for (let asset_subdir of asset_subdirs) {
      let file_list = readdirSync(assets_directory + asset_subdir);
      for (let f of file_list) {
        let fileContent = readFileSync(assets_directory + asset_subdir + '/' + f, 'utf8');
        let fileNm = f.split('.');
        if (fileNm[fileNm.length - 2].toLowerCase() === 'etl')  {
          // ETL files
            let etl = JSON.parse(fileContent);
            let sql = `insert into ${process.env.BEDROCK_DB_SCHEMA}.etl(asset_id, run_group_id, active) values ($1,$2,$3);`;
            await client.query(sql, [etl.asset_id, etl.run_group_id, etl.active])
              .catch((err) => {
                const errmsg = [err.code];
                throw new Error([`Postgres error: ${errmsg}`, err]);
              });
            for (let task of etl.tasks) {
              sql = `insert into ${process.env.BEDROCK_DB_SCHEMA}.tasks
              (task_id, asset_id, seq_number, description, "type", active, "source", target, "configuration") values ($1,$2,$3,$4,$5,$6,$7,$8,$9);`;
              await client.query(sql, [task.task_id, etl.asset_id, task.seq_number, task.description, task.type, task.active, task.source, 
                task.target, task.configuration])
                .catch((err) => {
                  const errmsg = [err.code];
                  throw new Error([`Postgres error: ${errmsg}`, err]);
                });
            }
        } else {
          // Asset files
          let asset = JSON.parse(fileContent);
          // console.log(asset);
          let sql = `insert into ${process.env.BEDROCK_DB_SCHEMA}.assets
          (asset_id, asset_name, description, "location", asset_type_id, owner_id, notes, link, active) values ($1,$2,$3,$4,$5,$6,$7,$8,$9);`;
          await client.query(sql, [asset.asset_id, asset.asset_name, asset.description, asset.location, asset.asset_type_id, asset.owner_id, asset.notes, asset.link, asset.active])
            .catch((err) => {
              const errmsg = [err.code];
              throw new Error([`Postgres error: ${errmsg}`, err]);
            });
          for (let tag of asset.tags) {
            sql = `insert into ${process.env.BEDROCK_DB_SCHEMA}.asset_tags(asset_id, tag_id) values ($1,$2);`;
            await client.query(sql, [asset.asset_id, tag])
              .catch((err) => {
                const errmsg = [err.code];
                throw new Error([`Postgres error: ${errmsg}`, err]);
              });
          }
          for (let dependency of asset.depends) {
            sql = `insert into ${process.env.BEDROCK_DB_SCHEMA}.dependencies(asset_id, dependent_asset_id) values ($1,$2);`;
            await client.query(sql, [asset.asset_id, dependency])
              .catch((err) => {
                const errmsg = [err.code];
                throw new Error([`Postgres error: ${errmsg}`, err]);
              });
          }
          if(asset.custom_fields) {
            for (let custom_field of Object.keys(asset.custom_fields)) {
              sql = `insert into ${process.env.BEDROCK_DB_SCHEMA}.custom_values(asset_id, custom_field_id, field_value) values ($1,$2,$3);`;
              await client.query(sql, [asset.asset_id, custom_field, asset.custom_fields[custom_field]])
                .catch((err) => {
                  const errmsg = [err.code];
                  throw new Error([`Postgres error: ${errmsg}`, err]);
                });
            }
          }
        }
      };
    };
  }
}

////////////////////////////////////////////

let data_directory = '../data';
let assets_directory = data_directory + '/assets/';

console.log('Connect to the DB');
const dbConnection = await getDBConnection();
const client = new Client(dbConnection);
await client.connect();
console.log('Connected, read the files');

await clearOutDB(client);
await readCsvFiles(client, data_directory);
await readAssetFiles(client, assets_directory);

await client.end();
