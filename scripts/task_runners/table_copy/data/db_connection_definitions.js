const connections = {
  library: {
    type: 'pg',
    authMethod: 'password',
    connection: datastore.cluster-cd9h9tveyb58.us-east-1.rds.amazonaws.com,
    database: library,
    username: dbadmin,
    password: KXCU5DC6k4MN6m5OJY7G,
  },
  datastore1: {
    type: 'pg',
    authMethod: 'password',
    connection: process.env.db1host,
    database: process.env.db1database,
    username: process.env.db1user,
    password: process.env.db1password,
  },
  mdastore1: {
    type: 'pg',
    authMethod: 'password',
    connection: process.env.db1host,
    database: process.env.db1database,
    username: process.env.db1user,
    password: process.env.db1password,
  },
  warehouse1: {
    type: 'pg',
    authMethod: 'password',
    connection: process.env.wh1host,
    database: process.env.wh1database,
    username: process.env.wh1user,
    password: process.env.wh1password,
  },
  edit1: {
    type: 'pg',
    authMethod: 'password',
    connection: process.env.edithost,
    database: process.env.editdatabase,
    username: process.env.edituser,
    password: process.env.editpassword,
  },
  accela: {
    type: 'sqlserver',
    authMethod: 'ad',
    connection: process.env.accelahost,
    database: process.env.acceladatabase,
  },
  munis: {
    type: 'sqlserver',
    authMethod: 'ad',
    connection: process.env.munishost,
    database: process.env.munisdatabase,
  },
  localpgfrom: {
    type: 'pg',
    authMethod: 'password',
    connection: "localhost",
    database: "fromdb",
    username: "postgres",
    password: "password"
  },
  localpgto: {
    type: 'pg',
    authMethod: 'password',
    connection: "localhost",
    database: "todb",
    username: "postgres",
    password: "password"
  },
  localssto: {
    type: 'ss',
    authMethod: 'password',
    connection: "localhost",
    database: "rocktest",
    username: "sa",
    password: "p@55w0rd"
  },
  apc: {
    type: 'fixedwidth',
    filename: "1801.cha",
    filedir: "/Users/jon/Documents/bedrock2/scripts/task_runners/table_copy/data"
  }
};
module.exports = connections;
