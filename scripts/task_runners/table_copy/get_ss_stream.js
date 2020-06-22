const sql = require('mssql');
const csv = require('csv');
const Stream = require('stream');

function get_ss_stream(location) { 
    return new Promise(async (resolve, reject) => {
        const config = {
            server: location.host,
            user: location.username,
            password: location.password,
            database: location.database,
            options: { enableArithAbort: true }
        }

        let pool = await sql.connect(config);

        const table = new sql.Table('[dbo].[moo]');
/////
        let ws = new Stream;
        ws.writable = true;
        let file_content = '';
      
        ws.write = function(buf) {
          file_content += buf;
        }
      
        ws.end = function(buf) {
          if(arguments.length) ws.write(buf);
          const s3_params = {
            Bucket: "telestaff-ftp-backup",
            Key: filename,
            Body: file_content,
            ContentType: "text/csv"
          };
          s3.putObject(s3_params).promise();
          ws.writable = false;
        }
//////
        let db_loader = csv.transform(function(data){
            return data;
        });
        db_loader.on('readable', function(){
          while(data = db_loader.read()){
            table.rows.add(...data);
          }
        });

        let request = await pool.request();
        request.stream = true;
    
        table.create = true;
        // setup columns
        table.columns.add('dat', sql.Int, { nullable: true });
    
        if(table.rows > 0) request.bulk(table);

        resolve( db_loader )
        
    })
}


module.exports = get_ss_stream

