const sql = require('mssql');
const load_one_file = require('./load_one_file');

require('dotenv').config({path:'./.env'})

// Module test
const filelist = [ 'payroll-export--T20200305-I000-S1583427600712.csv' ]; //, 'payroll-export--T20200227-I000-S1582822800661.csv' ];
load_db( filelist )
.then(files_to_del => {
  console.log('files_to_del',files_to_del);
}, function onReject(err) {
  console.error(err);
});
// module.exports = load_db;

async function load_db( filelist ) {
	const config = {
		user: process.env.sql_user, 
		password: process.env.sql_pw, 
		server: process.env.sql_host,
		database: process.env.sql_db,
		options: { enableArithAbort: true }
	}
	let retnoerr = [];
	try {
		let pool = await sql.connect(config);
		await clear_table(pool);
		for( filenm of filelist) {
			let file = await load_one_file(filenm, pool);
			retnoerr.push(file);
		};
		// Promise.all(filelist.map(async (filenm) => {
		// 	let file = await load_one_file(filenm, pool);
		// 	retnoerr.push(file);
		// }));
		await run_stored_proc(pool);
		pool.close();
		return retnoerr;
	} catch (err) {
		// pool.close();
		throw new Error(err); //in async fn, this is like a reject
	}
}

async function clear_table(pool) { // delete old rows from table
	try {
		await pool.request()
		.query('DELETE FROM [avl].[telestaff_import_time]');
		console.log("Table Cleared");
	} catch(err) {
		throw new Error(err);
	}
}

async function run_stored_proc(pool) { 
	try {
		await pool.request()
		.query("exec [avl].[sptelestaff_insert_time]");
		console.log("Stored Procedure Run");
	} catch(err) {
		throw new Error(err);
	}
}

// async function load_one_file( filenm, pool ) {
// 	return new Promise(function(resolve, reject) {
// 		console.log('loading', filenm)
// 		resolve(filenm);
// 	});
// }