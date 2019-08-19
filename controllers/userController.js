const User			 = require("../models/User");
const Board			 = require("../models/Board");
const Validate		 = require("../library/Validate");
const constants		 = require("../library/constants");

exports = module.exports = {};

exports.index = function(request, response) {
	response.redirect(`/user/${request.user.username}`);
};

/**
 * Handle GET requests to /user/:username
 */
exports.user_get = async function(request, response, next) {
	// Validate and sanitize user input
	// Make sure all required fields are submitted
	let username = Validate.sanitize(request.params.username);
	if (!Validate.username(username) || username.length < 1) {
		response.status(404);
		next("User not found");
		return;
	}

	let user = new User(undefined, username);
	try {
		await user.read();
		user.ownedBoards = await user.getOwnedBoards();
		user.editorBoards = await user.getEditorBoards();
	} catch(error) {
		if (error.message == 404) {
			response.status(404);
			error.message = `No user found with the username ${username}.`;
		} else {
			console.error(`ERROR reading user by username ${username} \n`, error);
			error.message = "There was a problem loading the user profile. Please try again.";
			response.status(500);
		}
		next(error);
		return;
	}

	// Check if the user is requesting their own userpage.
	user.currentUser = (user.id == request.user.id);

	response.format({
		json : function() {
			response.json(user);
		},
		html : function() {
			response.render("pages/profile", {user : user});
		}
	});
};

/**
 * Handle POST requests to /user/:username/update
 */
exports.user_update_post = async function(request, response) {
	// Validate and sanitize user input
	// Make sure all required fields are submitted
	let username = Validate.sanitize(request.params.username);
	if (!request.hasOwnProperty("body")
			|| !request.body.hasOwnProperty("username")
			|| !request.body.hasOwnProperty("displayName")
			|| username.length <= 0 || (!Validate.username(username))
		) {
		let errorMsg = "Please provide all fields.";
		response.status(400).json({success : false, message : errorMsg});
		return;
	}

	// Sanitize and validate the user-provided data
	let erroneousFields = {};

	let updatedUsername = Validate.sanitize(request.body.username);
	if (updatedUsername.length < 1 || !Validate.username(updatedUsername)) {
		erroneousFields["username"] = "Invalid username. " +
				"Can only contain letters, numbers, and underscores.";
	}
	let displayName = Validate.sanitize(request.body.displayName);
	if (displayName.length < 1 || displayName.length > constants.MAX_STRING_LENGTH) {
		erroneousFields["displayName"] = "Invalid display name. " +
				`Cannot exceed ${constants.MAX_STRING_LENGTH} characters in length.`;
	}

	// If any information was provided erroneuously, reject the update.
	if (Object.keys(erroneousFields).length > 0) {
		let errorMsg = "Invalid user data provided."
		response.status(400).json({
			success : false,
			message : errorMsg,
			erroneousFields : erroneousFields
		});
		return;
	}

	// If all information is correct, update the board
	let user = new User(undefined, username);
	try {
		await user.read();
	} catch(error) {
		console.error("ERROR reading user\n", error);
		let errorMsg = "There was an error updating your user profile. Please try again.";
		response.status(500).json({success : false, message : errorMsg});
		return;
	}

	// Verify that only the user can edit their own profile.
	if (user.id != request.user.id) {
		let errorMsg = "You can only make changes to your own user profile.";
		response.status(401).json({success : false, message : errorMsg});
		return;
	}

	// Update the user
	user.username = updatedUsername;
	user.displayName = displayName;
	try {
		await user.update();
	} catch(error) {
		if (error.message == 409) {
			response.status(409);
			error.message = `The username ${updatedUsername} is already taken.`;
		} else {
			console.error("ERROR updating user\n", error);
			response.status(500);
			error.message = "There was an error updating your profile. Please try again.";
		}
		response.json({success : false, message : error.message});
		return;
	}

	// If all is updated successfully, report as such
	let successMsg = "User profile updated successfully";
	response.json({success : true, message : successMsg});
};

/**
 * Handle POST requests to /user/:username/delete
 */
exports.user_delete_post = async function(request, response) {
	// Validate and sanitize user input
	// Make sure all required fields are submitted
	let username = Validate.sanitize(request.params.username);
	if (!request.hasOwnProperty("body")
			|| username.length <= 0 || (!Validate.username(username))
		) {
		let errorMsg = "Please provide all fields.";
		response.status(400).json({success : false, message : errorMsg});
		return;
	}


	// If all information is correct, delete the user
	let user = new User(undefined, username);
	try {
		await user.read();
	} catch(error) {
		console.error("ERROR reading user\n", error);
		let errorMsg = "There was an error deleting your account. Please try again.";
		response.status(500).json({success : false, message : errorMsg});
		return;
	}

	// Ensure only the active user can delete their own account.
	if (user.id != request.user.id) {
		let errorMsg = "You can only delete your own account.";
		response.status(403).json({success : false,	message : errorMsg});
		return;
	}

	// Delete the user
	try {
		await user.delete();
	} catch(error) {
		console.error("ERROR deleting user\n", error);
		let errorMsg = "There was an error deleting your account. Please try again.";
		response.status(500).json({success : false,	message : errorMsg});
		return;
	}

	// If all is deleted successfully, report as such
	let successMsg = "Account deleted successfully";
	response.json({success : true, message : successMsg});
}
