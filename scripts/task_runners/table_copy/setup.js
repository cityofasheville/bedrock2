
let blueprint = {
    source_location: {
        location: "localpgfrom",
        schemaname: "fromdb",
        tablename: "moo",
    },
    target_location: {
        location: "localpgto",
        schemaname: "todb",
        tablename: "moo",
    },
    columns: [
        {
            name: "dat",
            type: "number"
        }
    ]
}

let create_table = true;

function setup() {
    return { blueprint, create_table };
}

module.exports = setup;
