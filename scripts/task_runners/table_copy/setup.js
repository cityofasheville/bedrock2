
let etl = {
    source_location: {
        location: "localpgto",
        schemaname: "public",
        tablename: "moo",
    },
    target_location: {
        location: "localpgfrom",
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
