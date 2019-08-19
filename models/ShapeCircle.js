/**
 * Reflect the Circle table in the Database.
 *
 * PinPal
 * ISTE 442 01
 * @author Brendon Strowe
 */

const DB = require("./DB");
const Shape = require("./Shape");

class ShapeCircle extends Shape {

	/**
	* Creates a new ShapeCircle object with the specified crieteria.
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
	 * @param  {number} r — Radius of the circle.
	 *   Default value is 0.
	 * @param  {number} cx — X-axis coordinate of the circle center pint.
	 *   Default value is 0.
	 * @param  {number} cy — Y-axis coordinate of the circle center point.
	 *   Default value is 0.
	 */
	constructor(id=-1, boardId=-1, strokeWidth=3, strokeColor="#34495E", fillColor="#9B59B6", cx=0, cy=0, r=0) {
		super(id, boardId, strokeWidth, strokeColor, fillColor);
		this.shapeType = "Circle";
		this.cx = cx;
		this.cy = cy;
		this.r = r;
	}

	/**
	 * Adds a new ShapeCircle to the database.
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
			console.error("ERROR inserting new ShapeCircle into database.\n", error);
			throw new Error("ShapeCircleCreateError");
		}

		// Insert into the ShapeCircle table this Shape
		try {
			var resultSet = await DB.setData(
					"INSERT INTO Circle (shapeId, r, cx, cy) " +
					"VALUES (?, ?, ?, ?)",
					[this.id, this.r, this.cx, this.cy]
			);
		} catch(error) {
			console.error("ERROR inserting new ShapeCircle into database.\n", error);
			return false;
		}
		return (resultSet.affectedRows == 1);
	}

	/**
	 * Reads an existing ShapeCircle from the database based on its ID number.
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

		// Read from the ShapeCircle table.
		try {
			var resultSet = await DB.getData(
					"SELECT r, cx, cy " +
					"FROM Circle " +
					"WHERE shapeId = ?"
					, [this.id]);
		} catch(error) {
			console.error(`ERROR reading ShapeCircle from database by ID ${this.id}.\n`, error);
			throw new Error("ShapeCircleReadError");
		}
		if (resultSet.rows.length) {
			this.r = resultSet.rows[0].r;
			this.cx = resultSet.rows[0].cx;
			this.cy = resultSet.rows[0].cy;
			return true;
		} else {
			throw new Error(404);
		}
	}

	/**
	 * Update an existing ShapeCircle in the database.
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

		// Update to the ShapeCircle table.
		try {
			var resultSet = await DB.setData(
					"UPDATE Circle " +
					"SET r = ?, cx = ?, cy = ? " +
					"WHERE shapeId = ?",
					[this.r, this.cx, this.cy, this.id]
			);
		} catch(error) {
			console.error(`ERROR updating ShapeCircle in database by ID ${this.id}.\n`, error);
			throw new Error("ShapeCircleUpdateError");
		}
		return resultSet.affectedRows;
	}

	/**
	 * Deletes an existing ShapeCircle from the database.
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

module.exports = ShapeCircle;
