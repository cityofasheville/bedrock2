/* eslint-disable import/extensions */
/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */
import pgpkg from 'pg';
import pgErrorCodes from '../pgErrorCodes.js';

function calculateRequestedFields(queryParams, allFields) {
  // Use fields from the query if they're present, otherwise use all available
  let requestedFields = null;
  if ('fields' in queryParams) {
    requestedFields = queryParams.fields.replace('[', '').replace(']', '').split(',');
  } else {
    requestedFields = [...allFields];
  }
  return requestedFields;
}

async function getCustomFieldsInfo(client, asset_type) {
  let sqlQuery;
  let sqlResult;
  let types = '';
  const customFields = new Map();
  try {
    // Get the asset type hierarchy
    sqlQuery = `
      WITH RECURSIVE ancestors AS (
        SELECT asset_type_id, parent, asset_type_name FROM bedrock2.asset_types
        WHERE asset_type_id = $1
        UNION
          SELECT t.asset_type_id, t.parent, t.asset_type_name
          FROM bedrock2.asset_types t
          INNER JOIN ancestors a ON a.parent = t.asset_type_id
      ) SELECT * FROM ancestors;
    `;
    sqlResult = await client.query(sqlQuery, [asset_type]);
    if (sqlResult.rowCount < 1) {
      console.log(`Asset type ${asset_type} not found`);
      throw new Error(`Asset type ${asset_type} not found`);
    }
    sqlResult.rows.forEach((itm, i) => {
      const comma = i > 0 ? ',' : '';
      types = `${types}${comma} '${itm.asset_type_id}'`;
    });

    // Now get custom fields associated with any of the types
    // Field is required if any type in the hierarchy requires it
    sqlQuery = `
      select custom_field_id, custom_field_name, field_type, bool_or(required) as required
      from (
        select c.custom_field_id, c.custom_field_name, c.field_type, j.asset_type_id, j.required from bedrock2.custom_fields c
        left outer join bedrock2.asset_type_custom_fields j
        on c.custom_field_id = j.custom_field_id
        where j.asset_type_id in (${types})
      ) a
      group by custom_field_id, custom_field_name, field_type
    `;
    sqlResult = await client.query(sqlQuery, []);
    sqlResult.rows.forEach((itm) => {
      customFields.set(itm.custom_field_id, itm);
    });
  } catch (error) {
    throw new Error(
      `PG error getting asset type hierarchy for type ${asset_type}: ${pgErrorCodes[error.code]}`,
    );
  }
  return customFields;
}

function getCustomValues(body) {
  const customValues = {};
  if ('custom_fields' in body) {
    const customFieldsObj = body.custom_fields;
    Object.keys(customFieldsObj).forEach((key) => {
      customValues[key] = customFieldsObj[key];
    });
  }
  return customValues;
}

function checkCustomFieldsInfo(body, customFields) {
  console.log('CUSTOMFIEEEELDS')
  console.log(customFields)
  console.log(Object.entries(customFields))
for (const [key, value] of customFields) {
    console.log(value.required)
    if (value.required) {
      const customFieldId = value.custom_field_id;
      if (!body.custom_fields.hasOwnProperty(customFieldId)) {
        throw new Error(`Body missing required custom field ${customFieldId} display name: ${value.custom_field_name}`);
      }
    }
  }
}

async function addCustomFieldsInfo(body, client, customFields, customValues) {
  const customOut = new Map();
  let sql;
  let args;
  let res;

  for (const [id, field] of customFields) {
    if (Object.keys(customValues).includes(id)) {
      sql = 'INSERT INTO bedrock2.custom_values (asset_id, custom_field_id, field_value) VALUES($1, $2, $3)';
      args = [body.asset_id, id, customValues[id]];


      try {
        res = await client.query(sql, args);
      } catch (error) {
        console.log(error.code);
        throw new Error(`Error inserting custom value ${id}: ${pgErrorCodes[error.code]}`);
      }
      customOut.set(id, customValues[id]);
    }
  }
  return customOut;
}

export {
  getCustomValues,
  checkCustomFieldsInfo,
  calculateRequestedFields,
  getCustomFieldsInfo,
  addCustomFieldsInfo,
};
