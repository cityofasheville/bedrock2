const {google} = require('googleapis');
const { Readable } = require('stream'); 
const csv = require('csv');

async function get_google_stream(location){
    if(location.fromto == 'source_location') {
        try {
            let jwtClient = new google.auth.JWT(
                location.conn_info.client_email,
                null,
                location.conn_info.private_key,
                ['https://www.googleapis.com/auth/spreadsheets.readonly']
            );        
            await jwtClient.authorize()

            let spreadsheetId = location.spreadsheetid
            let range = location.range
            let sheets = google.sheets('v4')

            let response = await sheets.spreadsheets.values.get({
                auth: jwtClient,
                spreadsheetId,
                range
            })

            console.log("Copy from Google Sheet: https://docs.google.com/spreadsheets/d/"+location.spreadsheetid+"/edit#gid="+range.split("!")[0])

                // console.log(response.data.values)

            const csvstring = csv.stringify(fix_uneven_rows(range,response.data.values))

            return Readable.from(csvstring);

        } catch (err) {
            console.error("Google Sheet error: ", err);
            throw("Google Sheet error: " + err)
        }   
    }else if(location.fromto == 'target_location'){
        throw ("Google Sheets 'To' not implemented")
    }
}

function fix_uneven_rows(range,values){
    // Google just drops data if a column is empty at the end of the row (lame)
    function sscol_to_number(letters){
        return letters.split('').reduce((r, a) => r * 26 + parseInt(a, 36) - 9, 0); 
    }
    let sscols = range.replace(/[0-9]/g, '').split("!")[1].split(":") // eg ['A','AB']
    let colnums = sscols.map(sscol_to_number)                         // eg [1,28]
    let numcols = colnums[1]-colnums[0]+1
    let fixed_data = []
    for(row of values) {
        let new_row = new Array(numcols)
        for(let i = 0; i < row.length; i++) {
            new_row[i] = row[i]
        }
        fixed_data.push(new_row)
    } 
    return fixed_data
}

module.exports= get_google_stream
