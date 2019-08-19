const Conversation	 = require("../models/Conversation");
const Validate		 = require("../library/Validate");
const constants		 = require("../library/constants");

exports = module.exports = {};

/**
 * Handle GET requests to /conversation/:conversationId
 */
exports.conversation_get = async function(request, response) {
	// Validate and sanitize user input
	// Make sure all required fields are submitted.
	let conversationId = Validate.sanitize(request.params.conversationId);
	if ((!Validate.numbers(conversationId) || conversationId < 1)) {
		let errorMsg = "This chat does not exist.";
		response.status(404).json({success : false, message : errorMsg});
		return;
	}

	let conversation = new Conversation(conversationId);

	try {
		conversation.messages = await conversation.getMessages();
	} catch(error) {
		console.error(`ERROR reading conversation by ID ${conversationId}\n`, error);
		let errorMsg = "There was a problem loading the conversation.";
		response.status(500).json({success : false, message : errorMsg});
		return;
	}

	response.json({success : true, data : conversation});
};

/**
 * Handle POST requests to /conversation/:conversationId/send
 */
exports.conversation_send_post = async function(request, response) {
	// Validate and sanitize user input
	// Make sure all required fields are submitted.
	let conversationId = Validate.sanitize(request.params.conversationId);
	if (!request.hasOwnProperty("body")
			|| !request.body.hasOwnProperty("message")
			|| (!Validate.numbers(conversationId) || conversationId < 1)) {
		let errorMsg = "Please provide all fields.";
		response.status(400).json({success : false, message : errorMsg});
		return;
	}

	let message = Validate.sanitize(request.body.message);
	if (message.length < 1 || message.length > constants.MAX_PARAGRAPH_LENGTH) {
		let errorMsg = `Messages cannot exceed ${constants.MAX_PARAGRAPH_LENGTH} characters in length.`;
		response.status(400).json({success : false, message : errorMsg});
		return;
	}

	// Get the requested Conversation from the database.
	let conversation = new Conversation(conversationId);
	try {
		conversation.participants = await conversation.getParticipants();
	} catch(error) {
		console.error(`ERROR reading conversation\n ${conversationId}`, error);
		let errorMsg = "There was a problem sending your message. Please try again.";
		response.status(500).json({success : false, message : errorMsg});
		return;
	}

	// Verify that the user should be able to participate in this Conversaiton
	let validParticipant = false;
	for (let participant of conversation.participants) {
		if (participant.id == request.user.id) {
			validParticipant = true;
			break;
		}
	}
	if (!validParticipant) {
		let errorMsg = "You are not a participant in this conversation.";
		response.status(403).json({success : false, message : errorMsg});
		return;
	}

	// If the user is authorized and their message is valid, save it
	try {
		await conversation.sendMessage(message, request.user.id);
	} catch(error) {
		console.error(`ERROR sending message to conversation\n ${conversationId}`, error);
		let errorMsg = "There was a problem sending your message. Please try again.";
		response.status(500).json({success : false, message : errorMsg});
		return;
	}
	response.json({success : true});
};
