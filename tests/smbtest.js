// // load the library
// var SMB2 = require('smb2');

// // create an SMB2 instance
// var smb2Client = new SMB2({
//   share:''
// , domain:''
// , username:''
// , password:''
// });

// smb2Client.readFile('fieldeditor.xml', function(err, data){
//     if(err) throw err;
//     console.log(data);
// });

let fs = require("fs")

let cont = fs.readFileSync("//10.20.1.100/data/fieldeditor.xml")

console.log(cont)