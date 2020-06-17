
// let etl = {
//     source_location: {
//         type: "database",
//         connection: "localpgto",
//         schemaname: "public",
//         tablename: "gtfs_stop_times",
//     },
//     target_location: {
//         type: "database",
//         connection: "localssto",
//         schemaname: "dbo",
//         tablename: "gtfs_stop_times",
//     },
//     columns: {
//         trip_id: {
//             type: "varchar"
//         },
//         arrival_time: {
//             type: "time"
//         }
//     },
//     create_table: true
// }


// target_location: {
//     type: "database",
//     connection: "localssto",
//     schemaname: "dbo",
//     tablename: "gtfs_stop_times",
// },

let etl = {
    source_location: {
        type: "database",
        connection: "localpgfrom",
        schemaname: "public",
        tablename: "moo",
    },
    target_location: {
        type: "database",
        connection: "localpgto",
        schemaname: "public",
        tablename: "moo",
    },
    columns: [
        {
            name: "dat",
            type: "number"
        }
    ],
    create_table: true
}

module.exports = etl;

// let example_apc_fixedwidth = {
//     source_location: {
//         type: 'fixedwidth',
//         filename: "1801.cha",
//         filedir: "/Users/jon/Documents/bedrock2/scripts/task_runners/table_copy/data"
//     },
//   }
