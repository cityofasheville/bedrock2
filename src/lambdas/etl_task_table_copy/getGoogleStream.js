const { google } = require('googleapis')
const { Readable } = require('stream')
const createGoogleWritable = require('./createGoogleWritable')
const csv = require('csv')

async function getGoogleStream (location) {
  if (location.fromto === 'source_location') {
    try {
      const jwtClient = new google.auth.JWT(
        location.conn_info.client_email,
        null,
        location.conn_info.private_key,
        ['https://www.googleapis.com/auth/spreadsheets.readonly']
      )
      await jwtClient.authorize()

      const spreadsheetId = location.spreadsheetid
      const range = location.range
      const sheets = google.sheets('v4')

      const response = await sheets.spreadsheets.values.get({
        auth: jwtClient,
        spreadsheetId,
        range
      })

      console.log('Copy from Google Sheet: https://docs.google.com/spreadsheets/d/' + location.spreadsheetid + '/edit#gid=' + range.split('!')[0])
      // console.log(response.data.values)
      const csvstring = csv.stringify(fixUnevenRows(range, response.data.values))
      return Readable.from(csvstring)
    } catch (err) {
      console.error('Google Sheet error: ', err)
      throw new Error('Google Sheet error: ' + err)
    }
  } else if (location.fromto === 'target_location') {
    return createGoogleWritable(location)
  }
}

function fixUnevenRows (range, values) {
  // Google just drops data if a field is empty at the end of the row (lame)
  function sscolToNumber (letters) {
    return letters.split('').reduce((r, a) => r * 26 + parseInt(a, 36) - 9, 0)
  }
  const sscols = range.replace(/[0-9]/g, '').split('!')[1].split(':') // eg ['A','AB']
  const colnums = sscols.map(sscolToNumber) // eg [1,28]
  const numcols = colnums[1] - colnums[0] + 1
  const fixedData = []
  for (const row of values) {
    const newRow = new Array(numcols)
    for (let i = 0; i < row.length; i++) {
      newRow[i] = row[i]
    }
    fixedData.push(newRow)
  }
  return fixedData
}

module.exports = getGoogleStream
