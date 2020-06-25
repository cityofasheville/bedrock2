const fs = require("fs")
const readstream = fs.createReadStream('../data/numb.txt')
const get_ss_stream = require('./_combinepoolstream');
const db_defs = JSON.parse(fs.readFileSync('../data/bedrock_connections.json'))
const etl = require('../setup')

async function run(){
    let toloc = db_defs[etl.target_location.connection]
    toloc.table = etl.target_location
    toloc.fromto = 'to'

    let to_stream = await get_ss_stream(toloc)

    // readstream.pipe(to_stream) 
}
run()