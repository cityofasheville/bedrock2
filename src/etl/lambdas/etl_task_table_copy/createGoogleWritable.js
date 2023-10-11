/* eslint-disable no-underscore-dangle */
/* eslint-disable no-console */
const stream = require('stream');
const { google } = require('googleapis');
const csvParse = require('csv/lib/sync');

async function writeToSheet(location, theData, append = false) {
  const jwtClient = new google.auth.JWT(
    location.conn_info.client_email,
    null,
    location.conn_info.private_key,
    ['https://www.googleapis.com/auth/spreadsheets'],
  );
  await jwtClient.authorize();

  const spreadsheetId = location.spreadsheetid;
  const sheets = google.sheets('v4');

  // First clear the spreadsheet
  if (!append) {
    await sheets.spreadsheets.values.clear({
      auth: jwtClient,
      spreadsheetId,
      range: location.range,
    });
  }
  // Now append the new values
  sheets.spreadsheets.values.append({
    auth: jwtClient,
    spreadsheetId,
    range: location.range,
    insertDataOption: 'OVERWRITE',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      majorDimension: 'ROWS',
      values: csvParse.parse(theData),
    },
  });
}

module.exports = async function createGoogleWritable(location) {
  let buff = '';
  const result = new Promise();
  const saveLocation = location;
  const { append } = location;
  const googleStream = new stream.Writable({
    write(chunk, encoding, done) {
      buff += chunk;
      done();
    },

    async final(done) {
      try {
        await writeToSheet(saveLocation, buff, append);
        console.log(`Copy to Google Sheet: https://docs.google.com/spreadsheets/d/${location.spreadsheetid}/edit#gid=${location.range.split('!')[0]}`);
        result.resolve();
      } catch (err) {
        console.error('Google Sheet error: ', err);
        result.reject(`Google Sheet error: ${err}`);
      }
      done();
    },
  });
  return { stream: googleStream, promise: result };
};
