
const { ftp_get, del_files }  = require('./ftp_get');
const load_db = require('./load_db');

async function Run(){
    try {
        let filelist = await ftp_get();
        let files_to_del = await load_db(filelist);
        del_files(files_to_del);
    } catch(err) {
        console.error(err);
    }
}

Run();
