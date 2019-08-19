/**
 * Reflect the Shape table in the Database.
 *
 * PinPal
 * ISTE 442 01
 * @author Brendon Strowe
 */

const DB = require("./DB");

class Shape {

	/**
	* Creates a new Shape object with the specified crieteria.
	* @param  {number} id — ID number of the Shape from the Shape table.
	*   Default value is -1.
	* @param  {number} boardId — ID number of the Board to wich this Shape belongs.
	*   Default value is -1.
	 * @param  {number} strokeWidth — Width of the stroke on this Shape when drawn.
	 *   Default value is 3.
	 * @param  {string} strokeColor — Color of the stroke on this Shape when drawn.
	 *   Default value is #34495E.
	 * @param  {string} fillColor — Color of the fill on this Shape when drawn.
	 *   Default value is #9B59B6.
	 */
	constructor(id=-1, boardId=-1, strokeWidth=3, strokeColor="#34495E", fillColor="#9B59B6") {
		this.id = id;
		this.boardId = boardId;
		this.strokeWidth = strokeWidth;
		this.strokeColor = strokeColor;
		this.fillColor = fillColor;
	}

	/**
	 * Adds a new Shape to the database.
	 * @return {boolean} Whether or not the addition was successful.
	 */
	async create() {
		try {
			var resultSet = await DB.setData(
					"INSERT INTO Shape (boardId, strokeWidth, strokeColor, fillColor) " +
					"VALUES (?, ?, ?, ?)",
					[this.boardId, this.strokeWidth, this.strokeColor, this.fillColor]
			);
		} catch(error) {
			console.error("ERROR inserting new Shape into database.\n", error);
			return false;
		}
		this.id = resultSet.insertId;
		return (resultSet.affectedRows == 1);
	}

	/**
	 * Reads an existing Shape from the database based on its ID number.
	 * @return {boolean} Whether or not the read was successful.
	 */
	async read() {
		try {
			var resultSet = await DB.getData(
					"SELECT boardId, strokeWidth, strokeColor, fillColor " +
					"FROM Shape " +
					"WHERE id = ?"
					, [this.id]);
		} catch(error) {
			console.error(`ERROR reading Shape from database by ID ${this.id}.\n`, error);
			throw new Error("ShapeReadError");
		}
		if (resultSet.rows.length) {
			this.boardId = resultSet.rows[0].boardId;
			this.strokeWidth = resultSet.rows[0].strokeWidth;
			this.strokeColor = resultSet.rows[0].strokeColor;
			this.fillColor = resultSet.rows[0].fillColor;
			return true;
		} else {
			throw new Error(404);
		}
	}

	/**
	 * Update an existing Shape in the database.
	 * @return {number} Number of rows affected by the update if successful.
	 *   Otherwise, throws an error.
	 */
	async update() {
		try {
			var resultSet = await DB.setData(
					"UPDATE Shape " +
					"SET strokeWidth = ?, strokeColor = ?, fillColor = ? " +
					"WHERE id = ?",
					[this.strokeWidth, this.strokeColor, this.fillColor, this.id]
			);
		} catch(error) {
			console.error(`ERROR updating Shape in database by ID ${this.id}.\n`, error);
			throw new Error("ShapeUpdateError");
		}
		return resultSet.affectedRows;
	}

	/**
	 * Deletes an existing Shape from the database.
	 * @return {number} Number of rows affected by the deletion.
	 *   Otherwise, throws an error.
	 */
	async delete() {
		try {
			var resultSet = await DB.setData(
					"DELETE " +
					"FROM Shape " +
					"WHERE id = ?",
					[this.id]
			);
		} catch(error) {
			console.error(`ERROR deleting Shape in database by ID ${this.id}.\n`, error);
			throw new Error("ShapeDeleteError");
		}
		return resultSet.affectedRows;
	}
}

module.exports = Shape;
