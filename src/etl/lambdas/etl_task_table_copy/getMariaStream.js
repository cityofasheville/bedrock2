// sample code: https://dev.to/_patrickgod/fetching-millions-of-rows-with-streams-in-node-js-487e
import { createPool } from 'mariadb';
const pool = createPool({ host: "HOST", user: "USER", password: "PASSWORD", port: 3308, database: "DATABASE", connectionLimit: 5 });
let conn = await pool.getConnection();
const result = await conn.query(sql);
res.send(result);

let conn2 = await pool.getConnection();
const queryStream = conn.queryStream(sql);
const ps = new stream.PassThrough();
const transformStream = new stream.Transform({
    objectMode: true,
    transform: function transformer(chunk, encoding, callback) {
        callback(null, JSON.stringify(chunk));
    }
});
stream.pipeline(
    queryStream,
    transformStream,
    ps,
    (err) => {
        if (err) {
            console.log(err)
            return res.sendStatus(400);
        }
    })
ps.pipe(res);