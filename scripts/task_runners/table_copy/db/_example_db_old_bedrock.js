/* eslint-disable no-console, spaced-comment */
const fs = require('fs');
const CommandLineArgs = require('./common/CommandLineArgs');
const connectionManager = require('./db/connection_manager');
const prettyJson = require('./common/pretty_json');

function processAsset(obj) {
  const nobj = {};
  Object.keys(obj).forEach(mbr => {
    if (obj[mbr] && obj[mbr].constructor === Array) { // this should be temporary
      nobj[mbr] = obj[mbr].filter(itm => {
        return !(typeof itm === 'string' && itm.length === 0);
      });
    } else if (mbr.startsWith('geo_extent')) {
      if (!nobj.geographic_extent) nobj.geographic_extent = {};
      nobj.geographic_extent[mbr.substring(11)] = obj[mbr];
    } else {
      nobj[mbr] = obj[mbr];
    }
    if (mbr === 'tags') nobj.tag_len = nobj[mbr].length;
  });
  return nobj;
}

async function checkout() {
  const args = new CommandLineArgs(process.argv.slice(2));
  //TODO if (args.argCount() < 1) usageAndExit();
  const oneAsset = args.getArg(1);
  const startDir = args.getOption('start', '.');
  const blueprintMap = {};

  const client = connectionManager.getConnection('bedrock');
  let sqlAsset = `SELECT ast.id, ast.name, loc.short_name AS location, 
  ast.active, ast.type, ast.description, ast.category, ast.tags, ast.schema, ast.title, 
  ast.publication_date, ast.responsible_party,ast.responsible_party_role, ast.url, 
  ast.abstract, ast.status, ast.update_frequency, ast.keywords,ast.use_constraints, 
  ast.metadata_constraints, ast.resource_constraints, ast.topic_category, 
  ast.geo_extent_east, ast.geo_extent_west, ast.geo_extent_north, ast.geo_extent_south, 
  ast.feature_catalog, ast.process_description, ast.spatial_reference, 
  ast.metadata_creation_date, ast.contact_role_code FROM bedrock.assets ast
  INNER JOIN bedrock.asset_locations loc
  ON ast.location = loc.id; `;
  const queryArgs = [];
  if (oneAsset) {
    sqlAsset += 'WHERE ast.name = $1 ';
    queryArgs.push(oneAsset);
  }
  const assets = await client.query(sqlAsset, queryArgs);

  if (!assets.rows[0]) {
    console.log('No assets found');
  } else {
    for (let i = 0; i < assets.rows.length; i += 1) { // const asset of assets.rows) {
      const asset = processAsset(assets.rows[i]);
      const fullpath = `${startDir}/${asset.name}`;
      if (!fs.existsSync(fullpath)) fs.mkdirSync(fullpath);

      const objectsQuery = 'SELECT name, schema, type, blueprint FROM bedrock.asset_objects WHERE asset_id = $1';
      const objs = await client.query(objectsQuery, [asset.id]);
      asset.objects = objs.rows;

      objs.rows.forEach(obj => {
        if (obj.blueprint && obj.blueprint.length > 0) blueprintMap[obj.blueprint] = true;
      });

      const dependsQuery = 'SELECT depends FROM bedrock.asset_depends where asset_id = $1';
      const depends = await client.query(dependsQuery, [asset.id]);
      asset.depends = depends.rows.map(itm => { return itm.depends; });

      const orderedFields = ['name', 'location', 'active', 'type', 'description', 'depends', 'objects'];
      const mdaStr = prettyJson(asset, orderedFields);

      const fileDataMda = new Uint8Array(Buffer.from(mdaStr));
      fs.writeFileSync(`${fullpath}/mda.json`, fileDataMda, 'utf8');

      //write etl.json
      const etl = { tasks: [] };

      const sqlEtl = 'SELECT asset_id, active, task_order '
    + 'FROM bedrock.etl_tasks WHERE asset_id = $1 ORDER BY task_order';
      const etlData = await client.query(sqlEtl, [asset.id]);
      if (etlData.rows[0]) {
        for (let k = 0; k < etlData.rows.length; k += 1) { // (const row of etlData.rows) {
          const row = etlData.rows[k];
          etl.tasks.push({
            active: row.active,
          });
        }
        const etlString = prettyJson(etl);
        const fileDataEtl = new Uint8Array(Buffer.from(etlString));
        fs.writeFileSync(`${fullpath}/etl.json`, fileDataEtl, 'utf8');
      }
    }

    // Now let's download any blueprints that are referenced

    const bdir = `${startDir}/blueprints`;
    if (!fs.existsSync(bdir)) fs.mkdirSync(bdir);

    const blueprints = Object.keys(blueprintMap);
    for (let j = 0; j < blueprints.length; j += 1) {
      const sql = `SELECT b.name, b.description, b.update_date, c.blueprint_name, 
        c.column_name, c.ordinal_position, c.is_nullable, c.data_type, c.character_maximum_length,
        c.numeric_precision, c.numeric_precision_radix, c.numeric_scale, c.datetime_precision,
        c.interval_type, c.interval_precision FROM bedrock.object_blueprints b LEFT OUTER JOIN
        bedrock.object_blueprint_columns c ON b.name = c.blueprint_name
        WHERE b.name = $1`;
        /* eslint-disable no-loop-func, spaced-comment */

      const bp = await client.query(sql, [blueprints[j]]);

      if (bp.rows && bp.rows.length > 0) {
        const bpColString = bp.rows.reduce((accum, row, idx) => {
          const item = `    {
        "column_name": "${row.column_name}",
        "data_type": "${row.data_type}",
        "ordinal_position": "${row.ordinal_position}",
        "is_nullable": "${row.is_nullable}",
        "character_maximum_length": "${row.character_maximum_length}",
        "numeric_precision": "${row.numeric_precision}",
        "numeric_precision_radix": "${row.numeric_precision_radix}",
        "numeric_scale": "${row.numeric_scale}",
        "datetime_precision": "${row.datetime_precision}",
        "interval_type": "${row.interval_type}",
        "interval_precision": "${row.interval_precision}"
      }${(idx === bp.rows.length - 1) ? '\n' : ',\n'}`;
          return accum + item;
        }, '');


        // const bpStr = `{
        //  "name": "${bp.rows[0].blueprint_name}",
        //  "description": "${bp.rows[0].description}",
        //  "update_date": "${bp.rows[0].update_date}",
        //  "columns": [
        //    ${bpColString}
        //  ]
        // }`;
        const bpStr = prettyJson(bp.rows[0], ['name', 'description', 'update_date', 'columns']);

        const fileDataBp = new Uint8Array(Buffer.from(bpStr));
        fs.writeFileSync(`${bdir}/${bp.rows[0].name}.json`, fileDataBp, 'utf8');
      }
    }
  }
}

function arrToStr(arr) {
  return arr
    ? '['
  + `${arr[0] === '' ? '' : `\n    "${arr.join('",\n    "')}"\n  `}`
  + ']'
    : '[]';
}

function dateToStr(dt) {
  return dt
    ? dt.toISOString()
    : '';
}

module.exports = checkout;
