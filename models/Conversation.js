/**
 * Reflect the Conversation table in the Database.
 *
 * PinPal
 * ISTE 442 01
 * @author Brendon Strowe
 */

const DB		 = require("./DB");
const Message 	 = require("./Message");

class Conversation {

	/**
	 * Creates a new Conversation object with the specified crieteria.
	 * @param  {number} id — ID number of the Conversation from the table.
	 *   Default value is -1.
	 */
	constructor(id=-1) {
		this.id = id;
	}

	/**
	 * Adds a new Conversation entry to the database
	 * @return {boolean} Whether or not the addition was successful.
	 */
	async create() {
		try {
			var resultSet = await DB.setData(
					"INSERT INTO Conversation () " +
					"VALUES ()"
			);
		} catch(error) {
			console.error("ERROR inserting new Conversation into database.\n", error);
			return false;
		}
		this.id = resultSet.insertId;
		return (resultSet.affectedRows == 1);
	}

	/**
	 * Gets a list of Users who are participants in this Conversation.
	 * @return {[User]} An array of Users.
	 */
	async getParticipants() {
		// Get the list of User IDs from the database.
		try {
			var resultSet = await DB.getData(
					"SELECT userId " +
					"FROM ConversationParticipant " +
					"WHERE conversationId = ?",
					[this.id]
			);
		} catch(error) {
			console.error(`ERROR reading conversation participants by Conversation ID ${this.id}`);
			throw new Error("InvalidConversationId");
		}
		// Create a list of User objects from those IDs.
		let participants = [];
		if (resultSet.rows) {
			const User = require("./User");
			for (let row of resultSet.rows) {
				let user = new User(parseInt(row.userId));
				try {
					await user.read();
				} catch(error) {
					console.error(`ERROR getting conversation participants for ${this.id} as there was an error parsing one of the provided authors by ID ${row.userId}`);
					throw new Error("InvalidUserId");
				}
				participants.push(user);
			}
		}
		return participants;
	}

	/**
	 * Adds a User to the list of Conversation Participants by their ID.
	 * @param  {number} participantId — ID number of the User to be added as a
	 *   conversation participant.
	 * @return {boolean} Whether or not the addition was successful.
	 */
	async addParticipant(participantId) {
		try {
			var resultSet = await DB.setData(
					"INSERT INTO ConversationParticipant (conversationId, userId) " +
					"VALUES (?, ?)",
					[this.id, participantId]
			);
		} catch(error) {
			console.error(`ERROR adding participant ${participantId} to conversation ${this.id}.\n`, error);
			throw new Error("InvalidParticipantId");
		}
		return true;
	}

	/**
	 * Removes a User from the list of Conversation Participants by their ID.
	 * @param  {number} participantId — ID number of the User to be removed as a
	 *   conversation participant.
	 * @return {boolean} Whether or not the removal was successful.
	 */
	async removeParticipant(participantId) {
		try {
			var resultSet = await DB.setData(
					"DELETE FROM ConversationParticipant " +
					"WHERE conversationId = ? AND userId = ?",
					[this.id, participantId]
			);
		} catch(error) {
			console.error(`ERROR removing participant ${participantId} from conversation ${this.id}.\n`, error);
			throw new Error("InvalidParticipantId");
		}
		return true;
	}

	/**
	 * Get all Messages from this Conversation.
	 * @return {[Messages]} Array of Message objects.
	 */
	async getMessages() {
		try {
			var messages = Message.getByConversationId(this.id);
		} catch(error) {
			console.error(`ERROR Unable to read Messages by Conversation ID ${this.id}`);
			throw new Error("InvalidConversationId");
		}
		return messages;
	}

	/**
	 * Send a new Message to this Conversaiton.
	 * @param  {string} text — Message body.
	 * @param  {number} authorId — ID number of the User sending the message.
	 * @return {boolean} Whether or not the send was successful.
	 */
	async sendMessage(text, authorId) {
		let newMessage = new Message(undefined, this.id, authorId, text);
		try {
			var resultSet = await newMessage.create();
		} catch(error) {
			console.error(`ERROR sending message to conversation ${this.id}.\n`, error);
			throw new Error("SendMessageError");
		}
		return true;
	}
}

module.exports = Conversation;
