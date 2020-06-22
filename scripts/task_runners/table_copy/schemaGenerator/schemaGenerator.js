// https://github.com/RobertMacauley/node-mssql-bulk-insert

const sql = require( 'mssql');
const fs = require( 'fs');


class SchemaGenerator {
    constructor(config) {
        this.connection = new sql.ConnectionPool(config).connect();
    }
    async generateSchemas(options) {
        const connection = await this.connection;
        const tableSchemas = options.tableSchemas.map((schema) => { return `N'${schema}'`; });
        console.log(tableSchemas);
        connection.request().query(`
        SELECT 
        t.name
        ,s.name as [schema]
        FROM sys.tables AS t
        INNER JOIN sys.schemas AS s
        ON t.[schema_id] = s.[schema_id]
        WHERE s.name in (${tableSchemas});`).then(async (result) => {
            const schemas = {};
            for (const table of result.recordset) {
                schemas[table.name] = await this.getTableDetail(table.schema, table.name);
            }
            let content = JSON.stringify(schemas, null, options.humanReadable ? "\t" : null);
            content = "export default " + content;
            fs.writeFileSync(options.schemaFilePath, content);
        });
    }
    async getTableDetail(schemaName, tableName) {
        return new Promise(async (resolve, reject) => {
            const connection = await this.connection;
            connection.request().query(`
                SELECT
                    c.name 'columnName',
                    t.Name 'dataType',
                    c.max_length 'maxLength',
                    c.is_nullable 'nullable'
                FROM
                    sys.columns c
                INNER JOIN
                    sys.types t ON c.user_type_id = t.user_type_id
                LEFT OUTER JOIN
                    sys.index_columns ic ON ic.object_id = c.object_id AND ic.column_id = c.column_id
                LEFT OUTER JOIN
                    sys.indexes i ON ic.object_id = i.object_id AND ic.index_id = i.index_id
                WHERE
                    c.object_id = OBJECT_ID('${schemaName}.${tableName}')
            `).then((tableDetails) => {
                resolve(this.getMSSQLSchema(tableDetails.recordset));
            });
        });
    }
    getMSSQLSchema(tableSchema) {
        const MSSQLSchema = [];
        if (tableSchema.length > 0) {
            tableSchema.forEach((column) => {
                MSSQLSchema.push({
                    name: column.columnName,
                    dataType: column.dataType,
                    maxLength: column.maxLength == "-1" ? "MAX" : column.maxLength,
                    options: { nullable: column.nullable }
                });
            });
        }
        return MSSQLSchema;
    }
};
module.exports = SchemaGenerator;