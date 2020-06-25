'use strict';
//WORKS!
const fs = require("fs")
const csv = require('csv');
const Stream = require('stream');
const readstream = fs.createReadStream('../data/numb.txt')
let output = []

function getstream(){
    const parser = csv.parse({from_line: 2})

    parser.on('readable', function(){
    let record
    while (record = parser.read()) {
        output.push(record)
    }
    })
    parser.on('error', function(err){
        console.error(err.message)
    })

    parser.on('end', function(){
        console.log(output)
    })
    return parser
}

let thestream = getstream()
readstream.pipe(thestream) 

