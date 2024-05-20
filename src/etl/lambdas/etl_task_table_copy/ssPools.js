import mssqlpkg from 'mssql';
const { ConnectionPool } = mssqlpkg;

const pools = {};

// SQL Server Advanced Pool Management https://github.com/tediousjs/node-mssql#advanced-pool-management
async function getPool(name, config) {
  if (!Object.prototype.hasOwnProperty.call(pools, name)) {
    const pool = new ConnectionPool(config);
    const close = pool.close.bind(pool);
    pool.close = (...args) => {
      delete pools[name];
      return close(...args);
    };
    await pool.connect();
    pools[name] = pool;
  }
  return pools[name];
}

// close all pools
function closeAllPools() {
  return Promise.all(Object.values(pools).map((pool) => pool.close()));
}

export {
  closeAllPools,
  getPool,
};
