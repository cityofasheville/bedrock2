/* eslint-disable import/no-unresolved */
/* eslint-disable no-console */
import { Writable } from 'stream';
import { google } from 'googleapis';
import { parse } from 'csv-parse/sync';

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

  google.options({ auth: jwtClient });

  const { tab, range } = location;
  const tabrange = `${tab}!${range}`;
  // First clear the spreadsheet
  if (!append) {
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: tabrange,
    });
  }
  // Now append the new values
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: tabrange,
    // insertDataOption: 'OVERWRITE',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: parse(theData),
    },
  });
}

export default async function createGoogleWritable(location) {
  let buff = '';
  const { append } = location;
  const googleStream = new Writable({
    write(chunk, encoding, done) {
      buff += chunk;
      done();
    },

    async final(done) {
      try {
        await writeToSheet(location, buff, append);
        console.log(`Copy to Google Sheet: https://docs.google.com/spreadsheets/d/${location.spreadsheetid}/edit#gid=${location.range.split('!')[0]}`);
      } catch (err) {
        console.error('Google Sheet error: ', err);
      }
      done();
    },
  });
  return { stream: googleStream, promise: Promise.resolve() };
};
