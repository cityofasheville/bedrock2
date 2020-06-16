
let etl = {
    source_location: {
        location: "library",
        schemaname: "r_transit",
        tablename: "gtfs_stop_times",
    },
    target_location: {
        location: "localpgto",
        schemaname: "public",
        tablename: "gtfs_stop_times",
    },
    // target_location: {
    //     location: "localssto",
    //     schemaname: "dbo",
    //     tablename: "gtfs_stop_times",
    // },
    columns: {
        trip_id: {
            type: "varchar"
        },
        arrival_time: {
            type: "time"
        }
    },
    create_table: true
}

module.exports = etl;
