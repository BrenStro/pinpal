/**
 * Reflect the User table in the Database.
 *
 * PinPal
 * ISTE 442 01
 * @author Brendon Strowe
 */

const DB	 = require("./DB");
const Board	 = require("./Board")

class User {

	/**
	 * Creates a new User object with the specified crieteria.
	 * @param  {number} id — ID number of the User from the User table.
	 *   Default value is -1.
	 * @param  {string} username — Username of the User from the User table.
	 *   Default value is an empty string.
	 * @param  {string} displayName — Display Name of the User from the User table.
	 *   Default value is an empty string.
	 */
	constructor(id=-1, username="", displayName="") {
		this.id = id;
		this.username = username;
		this.password = "";
		this.displayName = displayName;
	}

	/**
	 * Adds a new User entry to the database
	 * @return {boolean} Whether or not the addition was successful.
	 */
	async create() {
		try {
			var resultSet = await DB.setData(
					"INSERT INTO User (username, password, displayName) " +
					"VALUES (?, ?, ?)",
					[this.username, this.password, this.displayName]
			);
		} catch(error) {
			console.error("ERROR inserting new User into database.\n", error);
			return false;
		}
		this.id = resultSet.insertId;

		// Add the user to the lobby board.
		try {
			let board = new Board(1);
			await board.read();

			let success = await board.addEditor(this.id);
			if (!success) {
				throw new Error("UserAddError");
			}
		} catch(error) {
			console.error(`ERROR adding new user ${this.id} as a board editor for the lobby Board.\n`, error);
			throw new Error("UserAddError");
		}

		return (resultSet.affectedRows == 1);
	}

	/**
	 * Reads a User entry from the database based on its ID number or username.
	 * @return {boolean} Whether or not the read was successful.
	 */
	async read() {
		let sql = "SELECT id, username, password, displayName FROM User WHERE ";
		let propertyList = [];
		if (this.id > -1) {
			sql += "id = ? ";
			propertyList = [this.id];
		} else if (this.username != "") {
			sql += "username = ? ";
			propertyList = [this.username];
		} else {
			throw new Error("NO USERNAME OR ID PROVIDED.");
		}
		sql += "LIMIT 1";

		try {
			var resultSet = await DB.getData(sql, propertyList);
		} catch(error) {
			console.error(`ERROR reading User from database by ID ${this.id}.\n`, error);
			throw new Error("UserReadError");
		}
		if (resultSet.rows.length) {
			this.id = resultSet.rows[0].id;
			this.username = resultSet.rows[0].username;
			this.password = resultSet.rows[0].password;
			this.displayName = resultSet.rows[0].displayName;
			return true;
		} else {
			throw new Error(404);
		}
	}

	/**
	 * Update an existing User in the database.
	 * @return {number} Number of rows affected by the update if successful.
	 *   Otherwise, throws an error.
	 */
	async update() {
		try {
			var resultSet = await DB.setData(
					"UPDATE User " +
					"SET username = ?, password = ?, displayName = ? " +
					"WHERE id = ?",
					[this.username, this.password, this.displayName, this.id]
			);
		} catch(error) {
			if (error.code == "ER_DUP_ENTRY") {
				throw new Error(409);
			}
			console.error(`ERROR updating User in database by ID ${this.id}.\n`, error.message);
			throw new Error("UserUpdateError");
		}
		return resultSet.affectedRows;
	}

	/**
	 * Deletes an existing User from the database.
	 * @return {number} Number of rows affected by the deletion.
	 *   Otherwise, throws an error.
	 */
	async delete() {
		try {
			var resultSet = await DB.setData(
					"DELETE FROM User " +
					"WHERE id = ?",
					[this.id]
			);
		} catch(error) {
			console.error(`ERROR deleting User in database by ID ${this.id}.\n`, error);
			throw new Error("UserDeleteError");
		}
		return resultSet.affectedRows;
	}

	/**
	 * Verify if this User currently exists in the database.
	 * @return {boolean} Whether or not this User exists in the database.
	 */
	async exists() {
		let sql = "SELECT id FROM User WHERE ";
		let propertyList = [];
		if (this.id > -1) {
			sql += "id = ? ";
			propertyList = [this.id];
		} else if (this.username != "") {
			sql += "username = ? ";
			propertyList = [this.username];
		} else {
			throw new Error("NO USERNAME OR ID PROVIDED.");
		}
		sql += "LIMIT 1";

		try {
			var resultSet = await DB.getData(sql, propertyList);
		} catch(error) {
			let msg = `ERROR verifying if user exists by ${propertyList[0]}.\n`;
			console.error(msg, error);
			throw new Error(msg);
		}
		return (resultSet.rows.length == 1);
	}

	async getOwnedBoards() {
		return await Board.getByOwner(this.id);
	}

	async getEditorBoards() {
		return await Board.getByEditor(this.id);
	}
}

module.exports = User;
