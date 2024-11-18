import MultiStream from 'multistream';
import { stringify } from 'csv-stringify';

// Create multistream of header and body streams
async function ssTableHeaders(location, bodyStream, pool) {
  const headerSQL = `
    with data as (
      select top 100 percent COLUMN_NAME, TABLE_NAME from INFORMATION_SCHEMA.COLUMNS
      where TABLE_NAME = '${location.tablename}' and TABLE_SCHEMA = '${location.schemaname}'
      order by ORDINAL_POSITION)
    SELECT headerrow = STUFF((SELECT ',' + COLUMN_NAME FROM data FOR XML PATH ('')), 1, 1, '') 
    FROM data GROUP BY TABLE_NAME
    `;
  // Accela DB is too old for STRING_AGG so back to 'stuff for xml path' :(
  // https://stackoverflow.com/questions/31211506/how-stuff-and-for-xml-path-work-in-sql-server/31212160#31212160

  const request = await pool.request();
  request.stream = true;
  request.query(headerSQL);

  request.on('error', (err) => {
    throw err;
  });

  const headerStream = request
    .pipe(stringify({
      quote: '',
    }));
  const retStream = new MultiStream([headerStream, bodyStream]);
  return retStream;
}

export { ssTableHeaders };