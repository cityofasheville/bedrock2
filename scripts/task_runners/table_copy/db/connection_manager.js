const Connection = require('./connection');
const connectionDefinitions = require('../data/db_connection_definitions');

class ConnectionManager {
  constructor(config) {
    this.connections = {};
    Object.getOwnPropertyNames(config).forEach(cname => {
      this.connections[cname] = {
        config: config[cname],
        connection: null,
      };
    });
  }

  addConnection(name, config) {
    if (name in this.connections) throw new Error(`Connection ${name} already exists`);
    this.connections[name] = { config, connection: null };
    return this.getConnection(name);
  }

  getConnection(name) {
    let c = null;
    if (name in this.connections) {
      const connection = this.connections[name];
      c = connection.connection;
      if (!c) {
        connection.connection = new Connection(name, connection.config);
        c = new Connection(name, connection.config);
      }
    } else {
      console.error(`Unknown database connection ${name}`);
    }
    return c;
  }
}

module.exports = new ConnectionManager(connectionDefinitions);
