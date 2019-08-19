/**
 * Reflect the Line table in the Database.
 *
 * PinPal
 * ISTE 442 01
 * @author Brendon Strowe
 */

const DB = require("./DB");
const Shape = require("./Shape");

class ShapeLine extends Shape {

	/**
	* Creates a new ShapeLine object with the specified crieteria.
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
	 * @param  {number} x1 — X-axis coordinate of the line starting point.
	 *   Default value is 0.
	 * @param  {number} y1 — Y-axis coordinate of the line starting point.
	 *   Default value is 0.
	 * @param  {number} x2 — X-axis coordinate of the line ending point.
	 *   Default value is 0.
	 * @param  {number} y2 — Y-axis coordinate of the line ending point.
	 *   Default value is 0.
	 */
	constructor(id=-1, boardId=-1, strokeWidth=3, strokeColor="#34495E", fillColor="#9B59B6", x1=0, y1=0, x2=0, y2=0) {
		super(id, boardId, strokeWidth, strokeColor, fillColor);
		this.shapeType = "Line";
		this.x1 = x1;
		this.y1 = y1;
		this.x2 = x2;
		this.y2 = y2;
	}

	/**
	 * Adds a new ShapeLine to the database.
	 * @return {boolean} Whether or not the addition was successful.
	 */
	async create() {
		// Insert into the Shape table this Shape.
		try {
			let success = await super.create();
			if (!success) {
				throw new Error("ShapeCreateError");
			}
		} catch(error) {
			console.error("ERROR inserting new ShapeLine into database.\n", error);
			throw new Error("ShapeLineCreateError");
		}

		// Insert into the ShapeLine table this Shape
		try {
			var resultSet = await DB.setData(
					"INSERT INTO Line (shapeId, x1, y1, x2, y2) " +
					"VALUES (?, ?, ?, ?, ?)",
					[this.id, this.x1, this.y1, this.x2, this.y2]
			);
		} catch(error) {
			console.error("ERROR inserting new ShapeLine into database.\n", error);
			return false;
		}
		return (resultSet.affectedRows == 1);
	}

	/**
	 * Reads an existing ShapeLine from the database based on its ID number.
	 * @return {boolean} Whether or not the read was successful.
	 */
	async read() {
		// Read from the Shape table.
		try {
			let success = await super.read();
			if (!success) {
				throw new Error("ShapeReadError");
			}
		} catch(error) {
			console.error(`ERROR reading Shape from database by ID ${this.id}.\n`, error);
			throw new Error("ShapeReadError");
		}

		// Read from the ShapeLine table.
		try {
			var resultSet = await DB.getData(
					"SELECT x1, x2, y1, y2 " +
					"FROM Line " +
					"WHERE shapeId = ?"
					, [this.id]);
		} catch(error) {
			console.error(`ERROR reading ShapeLine from database by ID ${this.id}.\n`, error);
			throw new Error("ShapeLineReadError");
		}
		if (resultSet.rows.length) {
			this.x1 = resultSet.rows[0].x1;
			this.y1 = resultSet.rows[0].y1;
			this.x2 = resultSet.rows[0].x2;
			this.y2 = resultSet.rows[0].y2;
			return true;
		} else {
			throw new Error(404);
		}
	}

	/**
	 * Update an existing ShapeLine in the database.
	 * @return {number} Number of rows affected by the update if successful.
	 *   Otherwise, throws an error.
	 */
	async update() {
		// Update to the Shape table.
		try {
			let success = await super.update();
			if (!success) {
				throw new Error("ShapeUpdateError");
			}
		} catch(error) {
			console.error(`ERROR updating Shape from database by ID ${this.id}.\n`, error);
			throw new Error("ShapeUpdateError");
		}

		// Update to the ShapeLine table.
		try {
			var resultSet = await DB.setData(
					"UPDATE Line " +
					"SET x1 = ?, y1 = ?, x2 = ?, y2 = ? " +
					"WHERE shapeId = ?",
					[this.x1, this.y1, this.x2, this.y2, this.id]
			);
		} catch(error) {
			console.error(`ERROR updating ShapeLine in database by ID ${this.id}.\n`, error);
			throw new Error("ShapeLineUpdateError");
		}
		return resultSet.affectedRows;
	}

	/**
	 * Deletes an existing ShapeLine from the database.
	 * @return {number} Number of rows affected by the deletion.
	 *   Otherwise, throws an error.
	 */
	async delete() {
		// Deletion from the Shape table.
		try {
			var success = await super.delete();
			if (!success) {
				throw new Error("ShapeDeleteError");
			}
		} catch(error) {
			console.error(`ERROR deleting Shape from database by ID ${this.id}.\n`, error);
			throw new Error("ShapeDeleteError");
		}
		return success;
	}
}

module.exports = ShapeLine;
