/**
 * Reflect the Message table in the Database.
 *
 * PinPal
 * ISTE 442 01
 * @author Brendon Strowe
 */

const DB = require("./DB");
const Conversation = require("./Conversation");

class Message {

	/**
	 * Creates a new Message object with the specified crieteria.
	 * @param  {number} id — ID number of the Message from the Message table.
	 *   Default value is -1.
	 * @param  {number} conversationId — ID number from the Conversation table.
	 *   Default value is -1.
	 * @param  {number} authorId — ID number of User from the User table.
	 *   Default value is -1.
	 * @param  {string} text — Text message.
	 *   Default value is an empty string.
	 * @param  {Date} timestamp — Timestamp for the message.
	 *   Default is the current time.
	 */
	constructor(id=-1, conversationId=-1, authorId=-1, text="", timestamp=(new Date())) {
		this.id = id;
		this.conversationId = conversationId;
		this.authorId = authorId;
		this.text = text;
		this.timestamp = timestamp;
	}

	/**
	 * Adds a new Message entry to the database
	 * @return {boolean} Whether or not the addition was successful.
	 */
	async create() {
		try {
			var resultSet = await DB.setData(
					"INSERT INTO Message (conversationId, authorId, text, timestamp) " +
					"VALUES (?, ?, ?, ?)",
					[this.conversationId, this.authorId, encodeURIComponent(this.text), this.timestamp.toISOString().substr(0,19)]
			);
		} catch(error) {
			console.error("ERROR attempting to insert a new Message into the database.\n", error);
			return false;
		}
		this.id = resultSet.insertId;
		return (resultSet.affectedRows == 1);
	}

	/**
	 * Reads a Message entry from the database based on its ID number.
	 * @return {boolean} Whether or not the read was successful.
	 */
	async read() {
		try {
			var resultSet = await DB.getData(
					"SELECT conversationId, authorId, text, timestamp " +
					"FROM Message " +
					"WHERE id = ?"
					, [this.id]);
		} catch(error) {
			console.error(`ERROR attempting to read a Message from the database by ID ${this.id}.\n`, error);
			throw new Error("InvalidMessageId");
		}
		if (resultSet.rows.length) {
			this.conversationId = resultSet.rows[0].conversationId;
			this.authorId = resultSet.rows[0].authorId;
			this.text = decodeURIComponent(resultSet.rows[0].text);
			this.timestamp = new Date(resultSet.rows[0].timestamp);
			return true;
		} else {
			throw new Error(`Unexpected number (${resultSet.rows.length}) of users returned for id ${this.id}.`);
		}
	}

	/**
	 * Get the User who authored this Message.
	 * @return {User} Author of this Message.
	 */
	async getAuthor() {
		const User = require("./User");
		let author = new User(this.authorId);
		try {
			await author.read();
		} catch(error) {
			console.error(`ERROR attempting to read author ${this.authorId} from the database for message ${this.id}.\n`, error);
			throw new Error("InvalidMessageAuthor");
		}
		return author;
	}

	/**
	 * Get an array of Messages from the provided Conversation ID number.
	 * @param  {number} conversationId — ID number of the Conversation from
	 *   which to retrieve Messages.
	 * @return {[Message]} Array of Message objects.
	 */
	static async getByConversationId(conversationId) {
		try {
			var resultSet = await DB.getData(
					"SELECT id, conversationId, authorId, text, timestamp " +
					"FROM Message " +
					"WHERE conversationId = ?",
					[conversationId]);
		} catch(error) {
			console.error(`ERROR attempting to read Messages from the database based on conversation id ${conversationId}.\n`, error);
			throw new Error("InvalidConversationId");
		}
		let messages = [];

		for (let row of resultSet.rows) {
			let msg = new Message(row.id, row.conversationId, row.authorId, decodeURIComponent(row.text), (new Date(row.timestamp)));
			try {
				msg.author = await msg.getAuthor();
			} catch(error) {
				console.error(`ERROR attempting to read User by ID ${row.authorId}\n`, error);
				throw new Error("InvalidUserId");
			}
			messages.push(msg);
		}
		return messages;
	}
}

module.exports = Message;
