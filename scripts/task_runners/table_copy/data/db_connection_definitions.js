const connections = {
  library: {
    type: 'pg',
    authMethod: 'password',
    host: process.env.libraryhost,
    database: process.env.librarydatabase,
    user: process.env.libraryuser,
    password: process.env.librarypassword,
  },
  datastore1: {
    type: 'pg',
    authMethod: 'password',
    host: process.env.db1host,
    database: process.env.db1database,
    user: process.env.db1user,
    password: process.env.db1password,
  },
  mdastore1: {
    type: 'pg',
    authMethod: 'password',
    host: process.env.db1host,
    database: process.env.db1database,
    user: process.env.db1user,
    password: process.env.db1password,
  },
  warehouse1: {
    type: 'pg',
    authMethod: 'password',
    host: process.env.wh1host,
    database: process.env.wh1database,
    user: process.env.wh1user,
    password: process.env.wh1password,
  },
  edit1: {
    type: 'pg',
    authMethod: 'password',
    host: process.env.edithost,
    database: process.env.editdatabase,
    user: process.env.edituser,
    password: process.env.editpassword,
  },
  accela: {
    type: 'sqlserver',
    authMethod: 'ad',
    host: process.env.accelahost,
    database: process.env.acceladatabase,
  },
  munis: {
    type: 'sqlserver',
    authMethod: 'ad',
    host: process.env.munishost,
    database: process.env.munisdatabase,
  },
  localpgfrom: {
    type: 'pg',
    authMethod: 'password',
    host: "localhost",
    database: "fromdb",
    user: "postgres",
    password: "password"
  },
  localpgto: {
    type: 'pg',
    authMethod: 'password',
    host: "localhost",
    database: "todb",
    user: "postgres",
    password: "password"
  },
  apc: {
    type: 'fixedwidth',
    filename: "1801.cha",
    filedir: "/Users/jon/Documents/bedrock2/scripts/task_runners/table_copy/data"
  }
};
module.exports = connections;
