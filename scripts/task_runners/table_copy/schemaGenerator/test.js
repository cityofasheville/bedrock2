const SchemaGenerator = require( './SchemaGenerator');

const databaseConnection = {
    "user": "sa",
    "password": "P@55w0rd",
    "server": "localhost",
    "database": "rocktest"
}

const schemaGenerator = new SchemaGenerator(databaseConnection).generateSchemas({
    humanReadable: true,
    schemaFilePath: './schema/dbSchemas.js',
    tableSchemas: ['dbo'],
});