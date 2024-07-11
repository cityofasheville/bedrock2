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

async function getCustomFieldsInfo(client, assetType) {
  let sqlQuery;
  let sqlResult;
  const customFields = new Map();
  try {
    sqlQuery = `
      select custom_field_id, custom_field_name, field_type, bool_or(required) as required
      from (
        select c.custom_field_id, c.custom_field_name, c.field_type, j.asset_type_id, j.required from bedrock.custom_fields c
        left outer join bedrock.asset_type_custom_fields j
        on c.custom_field_id = j.custom_field_id
        where j.asset_type_id = $1
      ) a
      group by custom_field_id, custom_field_name, field_type
    `;
    sqlResult = await client.query(sqlQuery, [assetType]);
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
for (const [key, value] of customFields) {
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
      sql = 'INSERT INTO bedrock.custom_values (asset_id, custom_field_id, field_value) VALUES($1, $2, $3)';
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
