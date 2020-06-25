const get_pg_stream = require('./get_pg_stream');

let fromloc = {
    type: 'postgresql', 
    authmethod: 'password', 
    host: 'localhost', 
    username: 'postgres',
    password: 'password',
    port: 5432, 
    database: 'fromdb',
    table: {type: 'database', 
            connection: 'localpgfrom', 
            schemaname: 'public', 
            tablename: 'telestaff_person01'
    },
    fromto: 'from'
}

async function moo(){
    let from_stream = await get_pg_stream(fromloc)
   from_stream.pipe(process.stdout)
}
moo()