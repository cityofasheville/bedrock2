const get_ss_stream = require('../get_ss_stream');

let fromloc = {
    type: 'sqlserver', 
    authmethod: 'password', 
    host: 'localhost', 
    username: 'sa',
    password: 'P@55w0rd',
    port: 5432, 
    database: 'rocktest',
    table: {type: 'database', 
            connection: 'localss', 
            schemaname: 'dbo', 
            tablename: 'telestaff_person01'
    },
    fromto: 'from'
}

async function moo(){
    let from_stream = await get_ss_stream(fromloc)
   from_stream.pipe(process.stdout)
}
moo()