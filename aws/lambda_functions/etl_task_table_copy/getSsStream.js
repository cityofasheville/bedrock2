const sql = require('mssql')
const csv = require('csv')
const stream = require('stream');
var MultiStream = require('multistream')
const { closeAllPools, getPool } = require('./ssPools')

async function getSsStream(location) {
	return new Promise( function (resolve, reject) {
		sql.on('error', err => {
			reject(err)
		})
		try {
			if (location.fromto === 'source_location') {
				const arrayOfSQL = []
				let nonObjStream
				const tablename = `${location.schemaname}.${location.tablename}`
				const connInfo = location.conn_info
				const poolName = location.connection
				const orderby = location.sortdesc ? ` order by ${location.sortdesc} desc `
					: location.sortasc ? ` order by ${location.sortasc} asc `
						: ""
				if (location.tableheaders) {
					arrayOfSQL.push(`
					with data as (
						select top 100 percent COLUMN_NAME, TABLE_NAME from INFORMATION_SCHEMA.COLUMNS
						where TABLE_NAME = '${location.tablename}' and TABLE_SCHEMA = '${location.schemaname}'
						order by ORDINAL_POSITION)
					SELECT headerrow = STUFF((SELECT ',' + COLUMN_NAME FROM data FOR XML PATH ('')), 1, 1, '') 
					FROM data GROUP BY TABLE_NAME
					`
					) // Accela DB is too old for STRING_AGG so back to 'stuff for xml path' :(
					// https://stackoverflow.com/questions/31211506/how-stuff-and-for-xml-path-work-in-sql-server/31212160#31212160
				} else {
					arrayOfSQL.push('')
				}

				arrayOfSQL.push(`SELECT * FROM ${tablename} ${orderby}`)

				const config = {
					server: connInfo.host,
					port: connInfo.port,
					user: connInfo.username,
					password: connInfo.password,
					database: connInfo.database,
					connectionTimeout: 30000,
					requestTimeout: 680000,
					options: {
						enableArithAbort: true
					},
					pool: {
						max: 10,
						min: 0,
						idleTimeoutMillis: 30000
					},
					trustServerCertificate: true,  // Accela has self-signed certs?
				}
				if (connInfo.domain) config.domain = connInfo.domain
				if (connInfo.parameters) {
					if (connInfo.parameters.encrypt === false) config.options.encrypt = false // for <= SQL 2008
				}
				getPool(poolName, config)
				.then(pool => {
					const arrayOfStreams = arrayOfSQL.map((sqlString, index) => {
						const request = pool.request()

						request.stream = true

						request.query(sqlString)

						request.on('error', err => {
							reject(err)
						})
						if (index === 0) {
							nonObjStream = request
								.pipe(csv.stringify({
									quote: ""
								}))
						} else {
							let stringify_options = {
								cast: {
									date: (date) => {
										return date.toISOString()
									},
									boolean: (value) => {
										return value ? '1' : '0'
									}
								},
								quoted_match: /\r/ // csv.stringify already checks for \n and \r\n. Our data has \r too. ¯\_(ツ)_/¯
							}
							if(location.fixedwidth_noquotes) { 
								stringify_options.quote = ""
							}
							nonObjStream = request
								.pipe(csv.stringify(stringify_options))
						}
						return nonObjStream
					})

					console.log('Copy from SQL Server: ', location.connection, tablename)
					const retStream = new MultiStream(arrayOfStreams)

					retStream.on('done', result => {
						console.log('SQL Server rows affected: ' + result.rowsAffected)
					})

					resolve(retStream)
				})


			} else if (location.fromto === 'target_location') {
				reject(new Error("SQL Server 'To' not implemented"))
			}
		} catch (err) {
			reject(new Error('SQL Server stream error ' + err))
		}
	})
}

module.exports = getSsStream