/* eslint-disable import/extensions */
import pgpkg from 'pg';
import pgErrorCodes from '../pgErrorCodes.js';

const { Client } = pgpkg;

function checkParameters(queryParams) {
  const parameters = ['rungroup', 'tags', 'period', 'pattern', 'count', 'offset'];
  let message = '';

  Object.keys(queryParams).forEach((key) => {
    if (key === 'rungroup') {
      message += 'Query parameter rungroup not yet implemented.';
    } else if (key === 'tags') {
      message += 'Query parameter tags not yet implemented.';
    } else if (key === 'period') {
      message += 'Query parameter period not yet implemented.';
    } else if (!parameters.includes(key)) {
      message += `${key} is not a valid parameter.`;
    }
  });
  return message;
}

async function newClient(connection) {
  const client = new Client(connection);
  try {
    await client.connect();
    return client;
  } catch (error) {
    throw new Error(`PG error connecting: ${pgErrorCodes[error.code]||error.code}`);
  }
}

function createSqlWhereClause(queryParams) {
  const whereClause = {
    whereClause: '',
    sqlParams: [],
  };
  if ('pattern' in queryParams) {
    whereClause.whereClause = 'where a.asset_name like $1';
    whereClause.sqlParams.push(`%${queryParams.pattern}%`);
  }
  return whereClause;
}

async function getAssetCount(whereClause, client) {
  const sql = `SELECT count(*) FROM bedrock.assets a ${whereClause.whereClause}`;
  let sqlResult;
  try {
    sqlResult = await client.query(sql, whereClause.sqlParams);
  } catch (error) {
    throw new Error(`PG error getting asset count: ${pgErrorCodes[error.code]||error.code}`);
  }
  return Number(sqlResult.rows[0].count);
}

async function readAssets(client, offset, count, whereClause) {
  const sql = `
    SELECT a.*, e.run_group as etl_run_group, e.active as etl_active,
      c.connection_class FROM bedrock.assets a
    left join bedrock.etl e on a.asset_name = e.asset_name
    left join bedrock.connections c
      on c.connection_name = a."location"->>'connection'
    ${whereClause.whereClause}
    order by a.asset_name asc
    offset ${offset} limit ${count}
  `;
  let sqlResult;
  try {
    sqlResult = await client.query(sql, whereClause.sqlParams);
  } catch (error) {
    throw new Error(`PG error getting asset base information: ${pgErrorCodes[error.code]||error.code}`);
  }
  return sqlResult;
}

async function addBaseFields(sqlResult, requestedFields, availableFields) {
  const tempAssets = {
    assetNames: [],
    assetMap: new Map(),
  };
  for (let i = 0; i < sqlResult.rowCount; i += 1) {
    const row = sqlResult.rows[i];
    const assetName = row.asset_name;
    tempAssets.assetNames.push(`'${assetName}'`);
    const asset = new Map();
    tempAssets.assetMap.set(assetName, asset);
    asset.set('asset_name', row.asset_name);
    asset.set('asset_type', row.asset_type);
    asset.set('custom_fields', new Map());
    for (let j = 0; j < requestedFields.length; j += 1) {
      const itm = requestedFields[j];
      if (availableFields.includes(itm)) {
        if (itm === 'parents') {
          asset.set('parents', []);
        } else if (itm === 'tags') {
          asset.set('tags', []);
        } else {
          asset.set(itm, row[itm]);
        }
      }
    }
  }
  return tempAssets;
}

async function addTags(client, assets) {
  const sql = `
  select * from bedrock.asset_tags a left join bedrock.tags b on a.tag_name = b.tag_name
  where asset_name in (${assets.assetNames.join()})
`;
  let sqlResult;
  try {
    sqlResult = await client.query(sql);
  } catch (error) {
    throw new Error(`PG error getting asset tags: ${pgErrorCodes[error.code]||error.code}`);
  }
  return sqlResult;
}

async function addCustomFields(client, assets) {
  const sql = `
    select asset_name, field_id, field_value from bedrock.custom_values
    where asset_name in (${assets.assetNames.join()})
  `;
  let sqlResult;
  try {
    sqlResult = await client.query(sql);
  } catch (error) {
    throw new Error(`PG error getting asset custom values: ${pgErrorCodes[error.code]||error.code}`);
  }

  return sqlResult;
}

async function addDependencies(client, assets) {
  let res;
  const sql = `
    select asset_name, dependency from bedrock.dependencies
    where asset_name in (${assets.assetNames.join()})
  `;

  try {
    res = await client.query(sql);
  } catch (error) {
    throw new Error(`PG error getting asset dependencies: ${pgErrorCodes[error.code]||error.code}`);
  }
  return res;
}

function buildURL(queryParams, domainName, rowsReadCount, offset, total, pathElements) {
  let qPrefix = '?';
  let qParams = '';
  if ('pattern' in queryParams) {
    qParams += `${qPrefix}pattern=${queryParams.pattern}`;
    qPrefix = '&';
  }
  if ('rungroups' in queryParams) {
    qParams += `${qPrefix}rungroups=${queryParams.rungroups}`;
    qPrefix = '&';
  }
  if ('period' in queryParams) {
    qParams += `${qPrefix}period=${queryParams.period}`;
    qPrefix = '&';
  }
  if ('count' in queryParams) {
    qParams += `${qPrefix}count=${queryParams.count}`;
    qPrefix = '&';
  }
  let url = null;
  if (offset + rowsReadCount < total) {
    const newOffset = parseInt(offset, 10) + rowsReadCount;
    url = `https://${domainName}/${pathElements.join('/')}${qParams}`;
    url += `${qPrefix}offset=${newOffset.toString()}`;
  }
  return url;
}

async function getAssetList(domainName, pathElements, queryParams, connection) {
  const availableFields = [
    'display_name',
    'description',
    'connection_class',
    'location',
    'link',
    'active',
    'owner_id',
    'notes',
    'tags',
    'parents',
    'etl_run_group',
    'etl_active',
  ];

  // Use fields from the query if they're present, otherwise use all available
  let requestedFields = null;
  if ('fields' in queryParams) {
    requestedFields = queryParams.fields.replace('[', '').replace(']', '').split(',');
  } else {
    requestedFields = [...availableFields];
  }
  let client;
  const count = ('count' in queryParams) ? queryParams.count : 25;
  const offset = ('offset' in queryParams) ? queryParams.offset : 0;
  const whereClause = createSqlWhereClause(queryParams);
  const response = {
    error: false,
    message: checkParameters(queryParams),
    result: {
      items: [],
      offset,
      count,
      total: 0,
      url: null,
    },
  };

  try {
    client = await newClient(connection);
  } catch (error) {
    response.error = true;
    response.message = error.message;
    response.result = null;
    return response;
  }

  try {
    // Get the total asset count. If 0, return early.
    response.result.total = await getAssetCount(whereClause, client);
    if (response.result.total === 0) {
      client.end();
      response.message = 'No assets found.';
      return response;
    }

    // Read the base fields
    const overrideFields = ('fields' in queryParams);
    const sqlResult = await readAssets(client, offset, count, whereClause);
    let assets = {
      count: sqlResult.rowCount,
      assetNames: [],
      assetMap: new Map(),
    };
    response.result.count = assets.count;

    // Build the asset list
    assets = await addBaseFields(sqlResult, requestedFields, availableFields);
    // Add custom fields them to their respective assets
    const customFieldsResult = await addCustomFields(client, assets);
    for (let i = 0; i < customFieldsResult.rowCount; i += 1) {
      const row = customFieldsResult.rows[i];
      if (!overrideFields || requestedFields.includes(row.field_id)) {
        const cv = assets.assetMap.get(row.asset_name).get('custom_fields');
        cv.set(row.field_id, row.field_value);
      }
    }

    const tagsResult = await addTags(client, assets);
    for (let i = 0; i < tagsResult.rowCount; i += 1) {
      const row = tagsResult.rows[i];
      if (!overrideFields || requestedFields.includes('tags')) {
        const innerMap = assets.assetMap.get(row.asset_name);
        innerMap.get('tags').push({ tag_name: row.tag_name, display_name: row.display_name });
      }
    }

    // Now convert all the Map objects to ordinary objects
    for (const [nm, asset] of assets.assetMap) {
      asset.set('custom_fields', Object.fromEntries(asset.get('custom_fields').entries()));
    }

    if (requestedFields.includes('parents')) {
      const res = await addDependencies(client, assets);
      for (let i = 0; i < res.rowCount; i += 1) {
        const row = res.rows[i];
        assets.assetMap.get(row.asset_name).get('parents').push(row.dependency);
      }
    }

    // Now package up all the assets
    for (const [assetName, asset] of assets.assetMap) {
      response.result.items.push(Object.fromEntries(asset.entries()));
    }
    response.result.url = buildURL(
      queryParams,
      domainName,
      assets.count,
      offset,
      response.result.total,
      pathElements,
    );
    await client.end();
  } catch (error) {
    response.error = true;
    response.message = error.message;
    response.result = null;
    await client.end();
    return response;
  } finally {
    await client.end();
  }
  return response;
}

export default getAssetList;
