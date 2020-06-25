
let etl = {
    source_location: {
        type: "database",
        connection: "localss",
        schemaname: "dbo",
        // connection: "localpgfrom",
        // schemaname: "public",
        tablename: "telestaff_person01",  
    },
    target_location: {
        type: "database",
        connection: "localpgto",
        schemaname: "public",
        tablename: "telestaff_person01",
    }
}
// let etl = {
//     source_location: {
//         type: "database",
//         connection: "munis_etl",
//         schemaname: "dbo",
//         tablename: "telestaff_person01",  
//     }
// }
// target_location: {
//     type: "database",
//     connection: "localss",
//     schemaname: "dbo",
//     tablename: "gtfs_stop_times",
// },

// let etl = {
//     source_location: {
//         type: "database",
//         connection: "localpgfrom",
//         schemaname: "public",
//         tablename: "moo",
//     },
//     target_location: {
//         type: "database",
//         connection: "localpgto",
//         schemaname: "public",
//         tablename: "moo",
//     },
//     columns: [
//         {
//             name: "dat",
//             type: "number"
//         }
//     ]
// }

module.exports = etl;

// let example_apc_fixedwidth = {
//     source_location: {
//         type: 'fixedwidth',
//         filename: "1801.cha",
//         filedir: "/Users/jon/Documents/bedrock2/scripts/task_runners/table_copy/data"
//     },
//   }


// MAYBE THE DATA WILL INCLUDE COLUMNS?
//     columns: {
//         dat: {
//             type: "integer"
//         }
//     }