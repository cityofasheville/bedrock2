
// Example using connectionManager to connect to local Docker 
const connectionManager = require('./connection_manager');




async function new_db() {
    const client = connectionManager.getConnection('localpgfrom');
    const toclient = connectionManager.getConnection('localpgto');
    let sqlAsset = `SELECT dat from public.moo; `;
    let tosqlAsset = `insert into public.moo(dat)values($1); `;
    const assets = await client.query(sqlAsset);
    if (!assets.rows[0]) {
        console.log('No assets found');
    } else {
        for (let i = 0; i < assets.rows.length; i += 1) { 
            await toclient.query(tosqlAsset, [assets.rows[i].dat]);
        }
    }
}


insert_db();
// module.exports = new_db;

async function insert_db() {
    const client = connectionManager.getConnection('localpgfrom');
    let sqlAsset = `insert into public.moo(dat)values($1) `;
  
    for(let i=1;i<100000;i++) {
      let queryArgs=[i];
      const assets = await client.query(sqlAsset, queryArgs);
    }
  
  }
