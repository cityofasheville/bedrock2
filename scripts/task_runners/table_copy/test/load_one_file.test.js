const sql = require('mssql');
const load_one_file = require('../load_one_file');
require('dotenv').config({path:'./.env'});

const config = {
    user: process.env.sql_user, 
    password: process.env.sql_pw, 
    server: process.env.sql_host,
    database: process.env.sql_db,
    options: { enableArithAbort: true }
}

const filenm = 'fourteen.csv';

const run = async ()=>{
    try {
        let pool = await sql.connect(config);

        let file = await load_one_file(filenm, pool);

        console.log(file);
    } catch(err) {
        console.error(err);
    }
}
run();