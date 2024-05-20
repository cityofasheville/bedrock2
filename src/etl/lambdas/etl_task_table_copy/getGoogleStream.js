/* eslint-disable no-console */
import { google } from 'googleapis';
import { Readable } from 'stream';
import { stringify } from 'csv-stringify';
import createGoogleWritable from './createGoogleWritable.js';

function fixUnevenRows(range, values) {
  // Google just drops data if a field is empty at the end of the row (lame)
  function sscolToNumber(letters) {
    return letters.split('').reduce((r, a) => r * 26 + parseInt(a, 36) - 9, 0);
  }
  const sscols = range.replace(/[0-9]/g, '').split(':'); // eg ['A','AB']
  const colnums = sscols.map(sscolToNumber); // eg [1,28]
  const numcols = colnums[1] - colnums[0] + 1;
  const fixedData = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const row of values) {
    const newRow = new Array(numcols);
    for (let i = 0; i < row.length; i += 1) {
      newRow[i] = row[i];
    }
    fixedData.push(newRow);
  }
  return fixedData;
}

async function getGoogleStream(location) {
  if (location.fromto === 'source_location') {
    try {
      const jwtClient = new google.auth.JWT(
        location.conn_info.client_email,
        null,
        location.conn_info.private_key,
        ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      );
      await jwtClient.authorize();

      const spreadsheetId = location.spreadsheetid;
      const { tab, range } = location;
      const tabrange = `${tab}!${range}`;
      const sheets = google.sheets('v4');

      const response = await sheets.spreadsheets.values.get({
        auth: jwtClient,
        spreadsheetId,
        range: tabrange,
      });

      console.log(`Copy from Google Sheet: https://docs.google.com/spreadsheets/d/${location.spreadsheetid}/edit#gid=${range.split('!')[0]}`);
      const data = fixUnevenRows(range, response.data.values);
      if (location.append_asset_name) { // append asset name to each row. Used in aggregate tasktype
        for (let i = 0; i < data.length; i += 1) {
          data[i].push(location.asset);
        }
      }
      if (location.append_tab_name) { // append tab name to each row. Used in aggregate tasktype
        for (let i = 0; i < data.length; i += 1) {
          data[i].push(tab);
        }
      }
      // console.log(data);
      const csvstring = stringify(data);
      return { stream: Readable.from(csvstring), promise: Promise.resolve() };
    } catch (err) {
      console.error('Google Sheet error: ', err);
      throw new Error(`Google Sheet error: ${err}`);
    }
  } else if (location.fromto === 'target_location') {
    return createGoogleWritable(location);
  }
  return (0);
}

export default getGoogleStream;
