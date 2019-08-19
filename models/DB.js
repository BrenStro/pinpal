/**
 * Allows for a connection to be made to a MySQL Database.
 *
 * PinPal
 * ISTE 442 01
 * @author Brendon Strowe
 */

const MYSQL = require("mysql");

/**
 * Connection pool object
 * @type {Pool}
 */
const pool = MYSQL.createPool({
	charset : "UTF8MB4_UNICODE_CI",
	connectionLimit : 256,
	host	 : process.env.DB_HOST,
	user	 : process.env.DB_USERNAME,
	password : process.env.DB_PASSWORD,
	database : process.env.DB_DATABASE
});

/**
 * This method will query the database using a precompiled SQL Statement.
 *  The SQL statement provided should include '?' where data values are to be
 *  inserted. An array of values to be inserted should also be provided.
 *
 * @param {string} sql - A string of precompiled SQL.
 * @param {array} values - A list of values to be bound to the precompiled SQL Statement.
 * @return {Promise} Whether or not establishing a connection and retrieving
 *   the data was successful.
 */
exports.getData = function(sql, values=[]) {
	// If an error is encountered, the Promise will be rejected with an explanatory error.
	//  Else, it will be resolved with the resulting data from the database query.
	return new Promise(function(resolve, reject) {
		// Attempt to connect using connection pool.
		pool.getConnection(function(connectionError, connection) {
			if (connectionError) {
				return reject("ERROR connecting to database.\n" + connectionError.code);
			}

			// Perform SQL query.
			connection.query(sql, values, function(queryError, results, fields) {
				connection.release();

				if (queryError) {
					reject(`ERROR querying database.\n ${queryError.code}\n SQL:\n  ${sql}\n VALUES:\n  ${values.toString()}`);
				}

				let resultSet = {
					headers : fields,
					rows : results
				};
				resolve(resultSet);
			});
		});
	});
};

/**
 * This method will update the database using a precompiled SQL Statement.
 *
 * @param {string} sql - A string of precompiled SQL.
 * @param {array} values - A list of values to be bound to the precompiled SQL Statement.
 * @return {Promise} Whether or not establishing a connection and updating
 *   the data was successful.
 */
exports.setData = function(sql, values=[]) {
	// If an error is encountered, the Promise will be rejected with an explanatory error.
	//  Else, it will be resolved with the resulting data from the database query.
	return new Promise(function(resolve, reject) {
		pool.getConnection(function(connectionError, connection) {
			if (connectionError) {
				reject("ERROR connecting to database.\n" + connectionError.code);
			}

			// Perform database update
			connection.query(sql, values, function(updateError, results) {
				connection.release();

				if (updateError) {
					console.error(sql, values);
					reject({message : "ERROR updating database.", code : updateError.code});
				}
				/*
				console.log("SET DATA RESULTS:");
				console.log(results);
				*/
				resolve(results);
			});
		});
	});
};
