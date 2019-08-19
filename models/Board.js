/**
 * Reflect the Board table in the Database.
 *
 * PinPal
 * ISTE 442 01
 * @author Brendon Strowe
 */

const DB			 = require("./DB");
const Conversation	 = require("./Conversation");
const ShapeLine		 = require("./ShapeLine");
const ShapeRect		 = require("./ShapeRect");
const ShapeCircle	 = require("./ShapeCircle");

class Board {

	/**
	 * Creates a new Board object with the specified crieteria.
	 * @param  {number} id — ID number of the Board from the Board table.
	 *   Default value is -1.
	 * @param  {string} name — name of the Board from the Board table.
	 *   Default value is an empty string.
	 * @param  {Object} ownerId — ID number of User who owns the Board.
	 *   Default value is -1.
	 * @param  {Boolean} privateBoard — Whether the board should be privately or
	 *   publicly editable.
	 *   Default value is true.
	 * @param  {Object} conversationId — ID number of the Conversation
	 *   associated with this Board.
	 *   Default value is -1.
	 * @param  {number} lockedForEditingById — ID number of the user currently
	 *   editing this board.
	 *   Default value is null.
	 * @param  {date} lockedForEditingOn — Date that this board was last locked
	 *   for editing on.
	 *   Default value is null.
	 */
	constructor(id=-1, name="", ownerId=-1, privateBoard=true, conversationId=-1, lockedForEditingById=null, lockedForEditingOn=null) {
		this.id = id;
		this.name = name;
		this.ownerId = ownerId;
		this.private = privateBoard;
		this.conversationId = conversationId;
		this.lockedForEditingById = null;
		this.lockedForEditingOn = null;
	}

	/**
	 * Adds a new Board entry to the database and creates its affiliated Conversation.
	 * @return {boolean} Whether or not the addition was successful.
	 */
	async create() {
		// Create a new Conversation if no conversationId was provided.
		if (this.conversationId < 0) {
			// Create the Conversation.
			let newConversation = new Conversation();
			try {
				let success = await newConversation.create();
				if (!success) {
					throw new Error("ConversationCreateError");
				}
			} catch(error) {
				console.error("ERROR inserting new Conversation into database for new Board.\n", error);
				throw new Error("BoardCreateError");
			}
			this.conversationId = newConversation.id;

			// Add the board owner to the list of conversation participants.
			try {
				let success = await newConversation.addParticipant(this.ownerId);
				if (!success) {
					throw new Error("ConversationParticipantAddError");
				}
			} catch(error) {
				console.error(`ERROR inserting new conversation participant ${this.ownerId} into database for new Board ${this.id}.\n`, error);
				throw new Error("BoardCreateError");
			}
		}

		// Finally, insert the Board into the database.
		try {
			var resultSet = await DB.setData(
					"INSERT INTO Board (name, ownerId, private, conversationId) " +
					"VALUES (?, ?, ?, ?)",
					[this.name, this.ownerId, (this.private + ""), this.conversationId]
			);
		} catch(error) {
			console.error("ERROR attempting to insert a new Board into the database.\n", error);
			return false;
		}
		this.id = resultSet.insertId;
		return (resultSet.affectedRows == 1);
	}

	/**
	 * Reads a Board entry from the database based on its ID number.
	 * @return {Number} Returns 1 if successful. Else, throws an error.
	 */
	async read() {
		try {
			var resultSet = await DB.getData(
					"SELECT name, ownerId, private, conversationId, lockedForEditingById, lockedForEditingOn " +
					"FROM Board " +
					"WHERE id = ?"
					, [this.id]);
		} catch(error) {
			console.error(`ERROR attempting to read a Board from the database by ID ${this.id}.\n`, error);
			throw new Error("InvalidBoardId");
		}
		if (resultSet.rows.length) {
			this.name = resultSet.rows[0].name;
			this.ownerId = resultSet.rows[0].ownerId;
			this.private = (resultSet.rows[0].private == "true");
			this.conversationId = resultSet.rows[0].conversationId;
			this.lockedForEditingById = resultSet.rows[0].lockedForEditingById;
			this.lockedForEditingOn = new Date(resultSet.rows[0].lockedForEditingOn);
			return true;
		} else {
			throw new Error(404);
		}
	}

	async update() {
		try {
			var resultSet = await DB.setData(
					"UPDATE Board " +
					"SET name = ?, ownerId = ?, private = ?, lockedForEditingById = ?, lockedForEditingOn = ? " +
					"WHERE id = ?",
					[
						this.name,
						this.ownerId,
						(this.private + ""),
						this.lockedForEditingById,
						(this.lockedForEditingOn ? this.lockedForEditingOn.toISOString().substr(0,19) : null),
						this.id
					]
			);
		} catch(error) {
			let msg = `ERROR attempting to update user ${this.id}, ${this.username} in database.\n`;
			console.error(msg, error);
			throw new Error(msg);
		}
		return resultSet.affectedRows;
	}

	async delete() {
		try {
			var resultSet = await DB.setData(
					"DELETE FROM Board " +
					"WHERE id = ?",
					[this.id]
			);
		} catch(error) {
			console.error(`ERROR deleting Board ${this.id}, ${this.name} from database.\n`, error);
			throw new Error("InvalidBoardId");
		}
		return resultSet.affectedRows;
	}

	/**
	 * Adds a User to the list of Board Editors by their ID.
	 * @param  {number} editorId — ID number of the User to be added as a
	 *   board editor.
	 * @return {boolean} Whether or not the addition was successful.
	 */
	async addEditor(editorId) {
		// Add the new editor to the board
		try {
			var resultSet = await DB.setData(
					"INSERT INTO BoardEditor (boardId, userId)" +
					"VALUES (?, ?)",
					[this.id, editorId]
			);
		} catch(error) {
			console.error(`ERROR adding editor ${editorId} to board ${this.id}.\n`, error);
			throw new Error("EditorAddError");
		}

		// Add the new editor to the list of conversation participants for this board.
		try {
			let conversation = new Conversation(this.conversationId);

			let success = await conversation.addParticipant(editorId);
			if (!success) {
				throw new Error("ConversationParticipantAddError");
			}
		} catch(error) {
			console.error(`ERROR inserting new conversation participant ${editorId} into database for Board ${this.id}.\n`, error);
			throw new Error("EditorAddError");
		}

		return true;
	}

	async getEditors() {
		try {
			var resultSet = await DB.getData(
					"SELECT userId " +
					"FROM BoardEditor " +
					"WHERE boardId = ?",
					[this.id]
			);
		} catch(error) {
			console.error(`ERROR reading board editors from board ID ${this.id}`);
			throw new Error("InvalidBoardId");
		}
		let editors = [];
		if (resultSet.rows) {
			const User = require("./User");
			for (let row of resultSet.rows) {
				let user = new User(parseInt(row.userId));
				try {
					await user.read();
				} catch(error) {
					console.error(`ERROR getting board editors for ${this.id} as there was an error parsing one of the provided editors by id ${row.userId}`);
					throw new Error("InvalidUserId");
				}
				editors.push(user);
			}
		}
		return editors;
	}

	/**
	 * Removes a User from the list of board editors by their ID.
	 * @param  {number} editorId — ID number of the User to be removed as a
	 *   board editor.
	 * @return {boolean} Whether or not the removal was successful.
	 */
	async removeEditor(editorId) {
		// Remove editor from board
		try {
			var resultSet = await DB.setData(
					"DELETE FROM BoardEditor " +
					"WHERE boardId = ? AND userId = ?",
					[this.id, editorId]
			);
		} catch(error) {
			console.error(`ERROR removing editor ${editorId} from board ${this.id}.\n`, error);
			throw new Error("EditorRemovalError");
		}

		// Remove editor from list of conversation participants for this board.
		try {
			let conversation = new Conversation(this.conversationId);

			let success = await conversation.removeParticipant(editorId);
			if (!success) {
				throw new Error("ConversationParticipantRemovalError");
			}
		} catch(error) {
			console.error(`ERROR removing conversation participant ${editorId} from database for Board ${this.id}.\n`, error);
			throw new Error("EditorRemovalError");
		}
		return true;
	}

	async getShapes() {
		let shapes = [];

		// Get the pins for this board
		try {
			var resultSet = await DB.getData(
					"SELECT id, boardId, 'LINE' AS shapeType " +
					"FROM Line " +
					"JOIN Shape " +
					"  ON Line.shapeId = Shape.id " +
					"WHERE boardId = ? " +
					"UNION " +
					"SELECT id, boardId, 'RECT' AS shapeType " +
					"FROM Rect " +
					"JOIN Shape " +
					"  ON Rect.shapeId = Shape.id " +
					"WHERE boardId = ? " +
					"UNION " +
					"SELECT id, boardId, 'CIRCLE' AS shapeType " +
					"FROM Circle " +
					"JOIN Shape " +
					"  ON Circle.shapeId = Shape.id " +
					"WHERE boardId = ?",
					[this.id, this.id, this.id]
			);
		} catch(error) {
			console.error(`ERROR getting shapes for board ${this.id}.\n`, error);
			throw new Error("GetShapesError");
		}
		for (let row of resultSet.rows) {
			let shapeId = parseInt(row.id);
			switch (row.shapeType) {
				case "LINE":
					var shape = new ShapeLine(shapeId);
					break;
				case "RECT":
					var shape = new ShapeRect(shapeId);
					break;
				case "CIRCLE":
					var shape = new ShapeCircle(shapeId);
					break;
			}
			try {
				await shape.read();
			} catch(error) {
				console.error(`ERROR getting shapes for board ${this.id} as there was an error parsing one of the provided shapes by id ${row.id}`);
				throw new Error("GetShapesError");
			}
			shapes.push(shape);
		}

		shapes.sort(function(shapeA, shapeB) {
			return (shapeB.id - shapeA.id);
		});

		return shapes;
	}

	static async getByOwner(ownerId) {
		try {
			var resultSet = await DB.getData(
					"SELECT id, name, ownerId, private, conversationId, lockedForEditingById, lockedForEditingOn " +
					"FROM Board " +
					"WHERE ownerId = ?"
					, [ownerId]);
		} catch(error) {
			console.error(`ERROR attempting to read a Board from the database by ownerId ${ownerId}.\n`, error);
			throw new Error("InvalidBoardOwnerId");
		}
		let boards = [];

		for (let row of resultSet.rows) {
			boards.push(new Board(row.id, row.name, row.ownerId, row.conversationId, row.lockedForEditingById, row.lockedForEditingOn));
		}
		return boards;
	}

	static async getByEditor(editorId) {
		try {
			var resultSet = await DB.getData(
					"SELECT id, name, ownerId, private, conversationId, lockedForEditingById, lockedForEditingOn " +
					"FROM Board " +
					"JOIN BoardEditor " +
					"  ON Board.id = BoardEditor.boardId " +
					"WHERE BoardEditor.userId = ?"
					, [editorId]);
		} catch(error) {
			console.error(`ERROR attempting to read a Board from the database by editorId ${editorId}.\n`, error);
			throw new Error("InvalidBoardEditorId");
		}
		let boards = [];

		for (let row of resultSet.rows) {
			boards.push(new Board(row.id, row.name, row.ownerId, row.conversationId, row.lockedForEditingById, row.lockedForEditingOn));
		}
		return boards;
	}
}

module.exports = Board;
