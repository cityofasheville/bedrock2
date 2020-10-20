const sql = require('mssql')

const pools = {}

// manage a set of pools by name (config will be required to create the pool)
// a pool will be removed when it is closed
async function get_pool(name, config) {
  if (!Object.prototype.hasOwnProperty.call(pools, name)) {
    const pool = new sql.ConnectionPool(config)
    const close = pool.close.bind(pool)
    pool.close = (...args) => {
      delete pools[name]
      return close(...args)
    }
    await pool.connect()
    pools[name] = pool
  }
  return pools[name]
}

// close all pools
function close_all_pools() {
  return Promise.all(Object.values(pools).map((pool) => {
    return pool.close()
  }))
}

module.exports = {
  close_all_pools,
  get_pool
}