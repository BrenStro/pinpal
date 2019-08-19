/**
 * Reflect the Rect table in the Database.
 *
 * PinPal
 * ISTE 442 01
 * @author Brendon Strowe
 */

const DB = require("./DB");
const Shape = require("./Shape");

class ShapeRect extends Shape {

	/**
	* Creates a new ShapeRect object with the specified crieteria.
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
	 * @param  {number} x — X-axis coordinate of the rectangle starting point.
	 *   Default value is 0.
	 * @param  {number} y — Y-axis coordinate of the rectangle starting point.
	 *   Default value is 0.
	 * @param  {number} width — Width of the rectangle.
	 *   Default value is 0.
	 * @param  {number} height — Height of the rectangle.
	 *   Default value is 0.
	 */
	constructor(id=-1, boardId=-1, strokeWidth=3, strokeColor="#34495E", fillColor="#9B59B6", x=0, y=0, width=0, height=0) {
		super(id, boardId, strokeWidth, strokeColor, fillColor);
		this.shapeType = "Rect";
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
	}

	/**
	 * Adds a new ShapeRect to the database.
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
			console.error("ERROR inserting new ShapeRect into database.\n", error);
			throw new Error("ShapeRectCreateError");
		}

		// Insert into the ShapeRect table this Shape
		try {
			var resultSet = await DB.setData(
					"INSERT INTO Rect (shapeId, x, y, width, height) " +
					"VALUES (?, ?, ?, ?, ?)",
					[this.id, this.x, this.y, this.width, this.height]
			);
		} catch(error) {
			console.error("ERROR inserting new ShapeRect into database.\n", error);
			return false;
		}
		return (resultSet.affectedRows == 1);
	}

	/**
	 * Reads an existing ShapeRect from the database based on its ID number.
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

		// Read from the ShapeRect table.
		try {
			var resultSet = await DB.getData(
					"SELECT x, y, width, height " +
					"FROM Rect " +
					"WHERE shapeId = ?"
					, [this.id]);
		} catch(error) {
			console.error(`ERROR reading ShapeRect from database by ID ${this.id}.\n`, error);
			throw new Error("ShapeRectReadError");
		}
		if (resultSet.rows.length) {
			this.x = resultSet.rows[0].x;
			this.y = resultSet.rows[0].y;
			this.width = resultSet.rows[0].width;
			this.height = resultSet.rows[0].height;
			return true;
		} else {
			throw new Error(404);
		}
	}

	/**
	 * Update an existing ShapeRect in the database.
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

		// Update to the ShapeRect table.
		try {
			var resultSet = await DB.setData(
					"UPDATE Rect " +
					"SET x = ?, y = ?, width = ?, height = ? " +
					"WHERE shapeId = ?",
					[this.x, this.y, this.width, this.height, this.id]
			);
		} catch(error) {
			console.error(`ERROR updating ShapeRect in database by ID ${this.id}.\n`, error);
			throw new Error("ShapeRectUpdateError");
		}
		return resultSet.affectedRows;
	}

	/**
	 * Deletes an existing ShapeRect from the database.
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

module.exports = ShapeRect;
