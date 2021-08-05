const stream = require('stream')
const { google } = require('googleapis')
const csvParse = require('csv/lib/sync')

async function writeToSheet (location, theData, append = false) {
  const jwtClient = new google.auth.JWT(
    location.conn_info.client_email,
    null,
    location.conn_info.private_key,
    ['https://www.googleapis.com/auth/spreadsheets']
  )
  await jwtClient.authorize()

  const spreadsheetId = location.spreadsheetid
  const sheets = google.sheets('v4')

  // First clear the spreadsheet
  if (!append) {
    await sheets.spreadsheets.values.clear({
      auth: jwtClient,
      spreadsheetId,
      range: location.range
    })
  }
  // Now append the new values
  await sheets.spreadsheets.values.append({
    auth: jwtClient,
    spreadsheetId,
    range: location.range,
    insertDataOption: 'OVERWRITE',
    valueInputOption: 'USER_ENTERED',
    resource: {
      majorDimension: 'ROWS',
      values: csvParse.parse(theData)
    }
  })
}

module.exports = async function createGoogleWritable (location) {
  const googleStream = new stream.Writable()
  let result = ''
  const saveLocation = location
  const append = location.append

  googleStream._write = function (chunk, encoding, done) {
    result += chunk
    done()
  }

  googleStream._final = async function (done) {
    console.log('Final result = ' + result)
    try {
      writeToSheet(saveLocation, result, append)
    } catch (err) {
      console.error('Google Sheet error: ', err)
      throw("Google Sheet error: " + err)
    }
    done()
  }

  return googleStream
}
