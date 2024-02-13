const pgErrorCodes = require('../pgErrorCodes');

async function getCustomFieldsInfo(client, asset_type) {
  let sqlQuery;
  let sqlResult;
  let types = '';
  let customFields = new Map();
  try {
    // Get the asset type hierarchy
    sqlQuery = `
      WITH RECURSIVE ancestors AS (
        SELECT id, parent, name FROM asset_types
        WHERE id = $1
        UNION
          SELECT t.id, t.parent, t.name
          FROM asset_types t
          INNER JOIN ancestors a ON a.parent = t.id
      ) SELECT * FROM ancestors;
    `;
    sqlResult = await client.query(sqlQuery, [asset_type]);
    if (sqlResult.rowCount < 1) {
      console.log(`Asset type ${asset_type} not found`);
      throw new Error(`Asset type ${asset_type} not found`);
    }
    sqlResult.rows.forEach((itm, i) => {
      const comma = i > 0 ? ',' : '';
      types = `${types}${comma} '${itm.id}'`;
    });
    // Now get custom fields associated with any of the types
    // Field is required if any type in the hierarchy requires it
    sqlQuery = `
      select id, field_display, field_type, bool_or(required) as required
      from (
        select c.id, c.field_display, c.field_type, j.asset_type_id, j.required from bedrock.custom_fields c
        left outer join bedrock.asset_type_custom_fields j
        on c.id = j.custom_field_id
        where j.asset_type_id in (${types})
      ) a
      group by id, field_display, field_type
    `;
    sqlResult = await client.query(sqlQuery, []);
    sqlResult.rows.forEach(itm => {
      customFields.set(itm.id, itm);
    });
  } catch (error) {
    throw new Error(
      `PG error getting asset type hierarchy for type ${asset_type}: ${pgErrorCodes[error.code]}`,
    );
  } 
  return customFields;
}

module.exports = getCustomFieldsInfo;
