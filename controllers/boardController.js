const Board			 = require("../models/Board");
const Shape			 = require("../models/Shape");
const ShapeLine		 = require("../models/ShapeLine");
const ShapeRect		 = require("../models/ShapeRect");
const ShapeCircle	 = require("../models/ShapeCircle");
const Conversation	 = require("../models/Conversation");
const User			 = require("../models/User");
const Validate		 = require("../library/Validate");
const constants		 = require("../library/constants");

exports = module.exports = {};

/**
 * Handle POST requests to /board/create
 */
exports.board_create_post = async function(request, response) {
	// Validate and sanitize user input
	// Make sure all required fields are submitted
	if (!request.hasOwnProperty("body")
			|| !request.body.hasOwnProperty("name")
			|| !request.body.hasOwnProperty("private")
		) {
		response.status(400);
		let errorMsg = "Please provide all fields.";
		response.json({success : false, message : errorMsg});
	}

	// Sanitize and validate the user-provided data
	let erroneousFields = {};

	let name = Validate.sanitize(request.body.name);
	if (!Validate.alphabeticNumericPunct(name)) {
		erroneousFields["name"] = "Invalid board name. " +
				"Can only contain alphanumeric, space, and punctuation characters.";
	}
	let private = Validate.sanitize(request.body.private);
	// Convert to Boolean value
	private = private + "";
	if (private != "true" && private != "false") {
		erroneousFields["private"] = "Invalid privacy setting. " +
				"Must be true or false.";
	}

	// If any information was provided erroneuously, reject the creation.
	if (Object.keys(erroneousFields).length > 0) {
		response.status(400);
		let errorMsg = "Invalid board data provided.";
		response.json({
			success : false,
			message : errorMsg,
			erroneousFields : erroneousFields
		});
		return;
	}

	// If all information is correct, create the board
	let newBoard = new Board(undefined, name, request.user.id, private);
	try {
		await newBoard.create();
	} catch(error) {
		console.error("ERROR createing new board\n", error);
		response.status(500);
		let errorMsg = "There was an error creating your new board. Please try again.";
		response.json({success : false, message : errorMsg});
		return;
	}

	// If all is created successfully, redirect user to the new board's page
	response.redirect(`/board/${newBoard.id}`);
};

/**
 * Handle GET requests to /board/:boardId
 */
exports.board_get = async function(request, response, next) {
	// Validate and sanitize user input
	// Make sure all required fields are submitted
	let boardId = Validate.sanitize(request.params.boardId);
	if (!Validate.numbers(boardId) || boardId < 1) {
		response.status(404);
		next("Board not found");
		return;
	}

	let board = new Board(boardId);
	try {
		await board.read();
		board.shapes = await board.getShapes();
	} catch(error) {
		if (error.message == 404) {
			response.status(404);
			error.message = "Board not found.";
		} else {
			console.error(`ERROR reading board by id ${boardId} \n`, error);
			response.status(500);
			error.message = "There was a problem loading the board. Please try again.";
		}
		next(error);
		return;
	}

	// Forbid private boards from being viewed by users who do now own the board.
	if (board.private && board.ownerId != request.user.id) {
		response.status(403);
		next({message : "No Access: Private Board"});
		return;
	}

	// Check if the user is requesting their own board.
	if (board.ownerId == request.user.id) {
		board.boardOwner = true;
	}

	response.format({
		json : function() {
			response.json(board);
		},
		html : function() {
			response.render("pages/board", {board : board});
		}
	});
};

/**
 * Handle POST requests to /board/:boardId/update
 */
exports.board_update_post = async function(request, response) {
	// Validate and sanitize user input
	// Make sure all required fields are submitted
	let boardId = Validate.sanitize(request.params.boardId);
	if (!request.hasOwnProperty("body")
			|| !request.body.hasOwnProperty("name")
			|| !request.body.hasOwnProperty("private")
			|| (!Validate.numbers(boardId) || boardId < 1)
		) {
		response.status(400);
		let errorMsg = "Please provide all fields.";
		response.json({success : false, message : errorMsg});
		return;
	}

	// Sanitize and validate the user-provided data
	let erroneousFields = {};

	let name = Validate.sanitize(request.body.name);
	if (!Validate.alphabeticNumericPunct(name)) {
		erroneousFields["name"] = "Invalid board name. " +
				"Can only contain alphanumeric, space, and punctuation characters.";
	}
	let private = Validate.sanitize(request.body.private);
	// Convert to String value
	private = private.toString();
	if (private != "true" && private != "false") {
		erroneousFields["private"] = "Invalid privacy setting. " +
				"Must be true or false.";
	}

	// If any information was provided erroneuously, reject the update.
	if (Object.keys(erroneousFields).length > 0) {
		response.status(400);
		let errorMsg = "Invalid board data provided."
		response.json({
				success : false,
				message : errorMsg,
				erroneousFields : erroneousFields
		});
		return;
	}

	// If all information is correct, update the board
	let board = new Board(boardId);
	try {
		await board.read();
	} catch(error) {
		if (error.message == 404) {
			response.status(404);
			error.message = "Board not found.";
		} else {
			console.error("ERROR reading board\n", error);
			response.status(500);
			error.message = "There was an error updating your board. Please try again.";
		}
		response.json({success : false, message : error.message});
		return;
	}

	// Verify that only the board owner can edit their own board.
	if (board.ownerId != request.user.id) {
		response.status(401);
		let errorMsg = "Only the board owner can make changes.";
		response.json({success : false, message : errorMsg});
		return;
	}

	// Update the board
	board.name = name;
	board.private = private;
	try {
		await board.update();
	} catch(error) {
		console.error("ERROR updating board\n", error);
		response.status(500);
		let errorMsg = "There was an error updating your board. Please try again.";
		response.json({success : false, message : errorMsg});
		return;
	}

	// If all is updated successfully, report as such
	let successMsg = "Board updated successfully";
	response.json({success : true, message : successMsg});
};

/**
 * Handle POST requests to /board/:boardId/delete
 */
exports.board_delete_post = async function(request, response) {
	// Validate and sanitize user input
	// Make sure all required fields are submitted
	let boardId = Validate.sanitize(request.params.boardId);
	if (!Validate.numbers(boardId) || boardId < 1) {
		response.status(400);
		let errorMsg = "Please a valid board ID.";
		response.json({success : false, message : errorMsg});
		return;
	}

	// If all information is correct, delete the board
	let board = new Board(boardId);
	try {
		await board.read();
	} catch(error) {
		if (error.message == 404) {
			response.status(404);
			error.message = "Board not found.";
		} else {
			console.error("ERROR reading board\n", error);
			response.status(500);
			let errorMsg = "There was an error deleting your board. Please try again.";
		}
		response.json({success : false, message : errorMsg});
		return;
	}

	// Verify that the board owner is the one making the edit
	if (board.ownerId != request.user.id) {
		response.status(403);
		let errorMsg = "Only the board owner can delete a board.";
		response.json({success : false,	message : errorMsg});
		return;
	}

	// Delete the board
	try {
		await board.delete();
	} catch(error) {
		console.error("ERROR deleting board\n", error);
		response.status(500);
		let errorMsg = "There was an error deleting your board. Please try again.";
		response.json({success : false,	message : errorMsg});
		return;
	}

	// If all is deleted successfully, report as such
	let successMsg = "Board deleted successfully";
	response.json({success : true, message : successMsg});
};

/**
 * Handle POST requests to /board/:boardId/addEditor
 */
exports.board_addEditor_post = async function(request, response) {
	// Validate and sanitize user input
	// Make sure all required fields are submitted
	let boardId = Validate.sanitize(request.params.boardId);
	if (!request.hasOwnProperty("body")
			|| !request.body.hasOwnProperty("username")
			|| (!Validate.numbers(boardId) || boardId < 1)
		) {
		response.status(400);
		let errorMsg = "Please provide all fields.";
		response.json({success : false, message : errorMsg});
		return;
	}

	// Sanitize and validate the user-provided data
	let erroneousFields = {};

	let username = Validate.sanitize(request.body.username);
	if (!Validate.username(username)) {
		erroneousFields["username"] = "Invalid username.";
	}

	// If any information was provided erroneuously, reject the update.
	if (Object.keys(erroneousFields).length > 0) {
		response.status(400);
		let errorMsg = "Invalid username provided.";
		response.json({
			success : false,
			message : errorMsg,
			erroneousFields : erroneousFields
		});
		return;
	}

	// If all information is correct, update the board
	let board = new Board(boardId);
	try {
		await board.read();
	} catch(error) {
		if (error.message == 404) {
			response.status(404);
			error.message = "Board not found.";
		} else {
			console.error("ERROR reading board\n", error);
			response.status(500);
			error.message = "There was an error updating your board. Please try again.";
		}
		response.json({success : false, message : error.message});
		return;
	}

	// Verify that only the board owner can edit their own board.
	if (board.ownerId != request.user.id) {
		response.status(401);
		let errorMsg = "Only the board owner can make changes.";
		response.json({success : false, message : errorMsg});
		return;
	}

	// Update the board
	try {
		var user = new User(undefined, username);
		await user.read();
		await board.addEditor(user.id);
	} catch(error) {
		if (error.message == 404) {
			response.status(404);
			error.message = "User not found.";
		} else {
			console.error("ERROR updating board\n", error);
			response.status(500);
			error.message = "There was an error updating your board. Please try again.";
		}
		response.json({success : false, message : error.message});
		return;
	}

	// If all is updated successfully, report as such
	let successMsg = `User ${user.displayName} added successfully.`;
	response.json({success : true, message : successMsg});
}

/**
 * Handle POST requests to /board/:boardId/removeEditor
 */
exports.board_removeEditor_post = async function(request, response) {
	// Validate and sanitize user input
	// Make sure all required fields are submitted
	let boardId = Validate.sanitize(request.params.boardId);
	if (!request.hasOwnProperty("body")
			|| !request.body.hasOwnProperty("username")
			|| (!Validate.numbers(boardId) || boardId < 1)
		) {
		response.status(400);
		let errorMsg = "Please provide all fields.";
		response.json({success : false, message : errorMsg});
		return;
	}

	// Sanitize and validate the user-provided data
	let erroneousFields = {};

	let username = Validate.sanitize(request.body.username);
	if (!Validate.username(username)) {
		erroneousFields["username"] = "Invalid username.";
	}

	// If any information was provided erroneuously, reject the update.
	if (Object.keys(erroneousFields).length > 0) {
		response.status(400);
		let errorMsg = "Invalid username provided."
		response.json({
			success : false,
			message : errorMsg,
			erroneousFields : erroneousFields
		});
		return;
	}

	// If all information is correct, update the board
	let board = new Board(boardId);
	try {
		await board.read();
	} catch(error) {
		if (error.message == 404) {
			response.status(404);
			error.message = "User not found.";
		} else {
			console.error("ERROR updating board\n", error);
			response.status(500);
			error.message = "There was an error updating your board. Please try again.";
		}
		response.json({success : false, message : error.message});
		return;	}

	// Verify that only the board owner can edit their own board.
	if (board.ownerId != request.user.id) {
		response.status(401);
		let errorMsg = "Only the board owner can make changes.";
		response.json({success : false, message : errorMsg});
		return;
	}

	// Update the board
	try {
		var user = new User(undefined, username);
		await user.read();
		await board.removeEditor(user.id);
	} catch(error) {
		if (error.message == 404) {
			response.status(404);
			error.message = "User not found.";
		} else {
			console.error("ERROR updating board\n", error);
			response.status(500);
			error.message = "There was an error updating your board. Please try again.";
		}
		response.json({success : false, message : error.message});
		return;
	}

	// If all is updated successfully, report as such
	let successMsg = `User ${user.displayName} removed successfully`;
	response.json({success : true, message : successMsg});
}

/**
 * Handle POST requests to /board/:boardId/shape/beginDraw
 */
exports.board_shapeBeginDraw_post = [async function(request, response, next) {
	next();
}, shapeValidation, function(request, response, next) {
	let shapeType = request.body.shapeType;
	// If all information is correct, create the shape
	for (let type of constants.SUPPORTED_SHAPE_TYPES) {
		if (type == shapeType) {
			shapeInitializers[type](request, response);
			break;
		}
	}
}];

/**
 * Handle POST requests to /board/:boardId/shape/:shapeId/endDraw
 */
exports.boad_shapeEndDraw_post = [async function(request, response, next) {
	next();
}, shapeValidation, function(request, response, next) {
	let shapeType = request.body.shapeType;
	// If all information is correct, update the shape
	for (let type of constants.SUPPORTED_SHAPE_TYPES) {
		if (type == shapeType) {
			shapeUpdaters[type](request, response);
			break;
		}
	}
}];


/**
 * Handle POST requests to /board/:boardId/shape/:shapeId/erase
 */
exports.board_shapeErase_post = async function(request, response) {
	// Validate and sanitize user input
	// Make sure all required fields are submitted
	let boardId = Validate.sanitize(request.params.boardId);
	let shapeId = Validate.sanitize(request.params.shapeId);
	if (!Validate.numbers(boardId) || boardId < 1
			|| !Validate.numbers(shapeId) || shapeId < 1
		) {
		response.status(400);
		let errorMsg = "Please provide all fields.";
		response.json({success : false, message : errorMsg});
		return;
	} else {
		request.body.boardId = boardId;
		request.body.shapeId = shapeId;
	}

	// Attempt to unlock board
	let board = new Board(boardId);
	try {
		await board.read();
		board.editors = await board.getEditors();

		// Verify if this user has edit permissions
		let editPermissions = (board.ownerId == request.user.id ||
			function () {
				for (let editor of board.editors) {
					if (editor.id == request.user.id) {
						return true;
					}
				}
				return false;
		}());
		if (!editPermissions) {
			response.status(401);
			response.json({
				success : false,
				message : "You are not an Editor of this Board."
			});
			next("route");
			return;
		}

		board.lockedForEditingById = null;
		board.lockedForEditingOn = null;
		board.update();
	} catch(error) {
		console.error("ERROR processing board locking\n", error);
		response.status(500);
		let errorMsg = "There was an error editing your shape. Please try again.";
		response.json({success : false, message : errorMsg});
		next("route");
	}

	let shape = new Shape(shapeId);
	try {
		await shape.read();
		await shape.delete();
	} catch(error) {
		console.error("ERROR deleting shape\n", error);
		response.status(500);
		let errorMsg = "There was an error deleting your shape. Please try again.";
		response.json({success : false, message : errorMsg});
		return;
	}

	response.json({success : true, message : "Successfully erased shape."});
};

async function shapeValidation(request, response, next) {
	// Validate and sanitize user input
	// Make sure all required fields are submitted
	let boardId = Validate.sanitize(request.params.boardId);
	if (!request.hasOwnProperty("body")
			|| !request.body.hasOwnProperty("strokeWidth")
			|| !request.body.hasOwnProperty("strokeColor")
			|| !request.body.hasOwnProperty("fillColor")
			|| !request.body.hasOwnProperty("shapeType")
			|| (!Validate.numbers(boardId) || boardId < 1)
		) {
		response.status(400);
		let errorMsg = "Please provide all fields.";
		response.json({success : false, message : errorMsg});
		return;
	} else {
		request.body.boardId = boardId;
	}

	// Check if this board is locked for editing by someone.
	//   If not, lock this board in edit mode.
	let board = new Board(boardId);
	try {
		await board.read();
		board.editors = await board.getEditors();

		// Verify if this user has edit permissions
		let editPermissions = (board.ownerId == request.user.id ||
			function () {
				for (let editor of board.editors) {
					if (editor.id == request.user.id) {
						return true;
					}
				}
				return false;
		}());
		if (!editPermissions) {
			response.status(401);
			response.json({
				success : false,
				message : "You are not an Editor of this Board."
			});
			next("route");
			return;
		}

		// If the board is currently locked by someone else and it has been for
		//   less than the predefined lockout time, do not allow any further edits.
		if (board.lockedForEditingById != request.user.id && (new Date() - board.lockedForEditingOn) <= constants.LOCKOUT_TIME) {
			let user = new User(board.lockedForEditingById);
			await user.read();
			response.status(423);
			response.json({
				success : false,
				message : `Board is locked for editing by ${user.displayName}`
			});
			next("route");
			return;
		} else {
			board.lockedForEditingById = request.user.id;
			board.lockedForEditingOn = new Date();
			await board.update();
		}
	} catch(error) {
		console.error("ERROR processing board locking\n", error);
		response.status(500);
		let errorMsg = "There was an error editing your shape. Please try again.";
		response.json({success : false, message : errorMsg});
		next("route");
	}

	// Sanitize and validate the user-provided data
	let erroneousFields = {};

	let shapeType = Validate.sanitize(request.body.shapeType);
	shapeType = shapeType.toUpperCase();
	if (!Validate.shapeType(shapeType)) {
		erroneousFields["shapeType"] = "Unsupported shape type.";
	} else {
		for (let type of constants.SUPPORTED_SHAPE_TYPES) {
			if (type == shapeType) {
				shapeTypeValidators[type](request, response, erroneousFields);
				break;
			}
		}
	}

	let strokeWidth = Validate.sanitize(request.body.strokeWidth);
	if (!Validate.numbers(strokeWidth) || strokeWidth >= constants.MAX_UNSIGNED_INT || strokeWidth < 0) {
		erroneousFields ["strokeWidth"] = `Invalid stroke width. ` +
				`Must be less than ${constants.MAX_UNSIGNED_INT}`;
	} else {
		request.body.strokeWidth = strokeWidth;
	}
	let strokeColor = Validate.sanitize(request.body.strokeColor);
	if (!Validate.colorHexCode(strokeColor)) {
		erroneousFields["strokeColor"] = "Invalid stroke color. " +
				"Must be a valid hex code.";
	} else {
		request.body.strokeColor = strokeColor;
	}
	let fillColor = Validate.sanitize(request.body.fillColor);
	if (!Validate.colorHexCode(fillColor)) {
		erroneousFields["fillColor"] = "Invalid fill color. " +
				"Must be a valid hex code.";
	} else {
		request.body.fillColor = fillColor;
	}

	// If any information was provided erroneuously, reject the creation.
	if (Object.keys(erroneousFields).length > 0) {
		try {
			board.lockedForEditingById = null;
			board.lockedForEditingOn = null;
			await board.update();
		} catch(error) {
			console.error("ERROR processing board locking\n", error);
			response.status(500);
			let errorMsg = "There was an error editing your shape. Please try again.";
			response.json({success : false, message : errorMsg});
			next("route");
			return;
		}
		response.status(400);
		let errorMsg = "Invalid shape data provided."
		response.json({
			success : false,
			message : errorMsg,
			erroneousFields : erroneousFields
		});
		return;
	}

	next();
}

function validateShapeType_line(request, response, erroneousFields) {
	// Validate and sanitize user input
	// Make sure all required fields are submitted
	if (   !request.body.hasOwnProperty("x1")
		|| !request.body.hasOwnProperty("y1")
		|| !request.body.hasOwnProperty("x2")
		|| !request.body.hasOwnProperty("y2")
		) {
		let errorMsg = "Invalid.";
		erroneousFields["x1"] = errorMsg;
		erroneousFields["y1"] = errorMsg;
		erroneousFields["x2"] = errorMsg;
		erroneousFields["y2"] = errorMsg;
		return false;
	}

	let x1 = Validate.sanitize(request.body.x1);
	if (!Validate.numbers(x1) || x1 < 0 || x1 >= constants.MAX_UNSIGNED_INT) {
		erroneousFields["x1"] =`Invalid x1 length. ` +
				`Must be less than ${constants.MAX_UNSIGNED_INT}`;
	} else {
		request.body.x1 = x1;
	}
	let y1 = Validate.sanitize(request.body.y1);
	if (!Validate.numbers(y1) || y1 < 0 || y1 >= constants.MAX_UNSIGNED_INT) {
		erroneousFields["y1"] =`Invalid y1 length. ` +
				`Must be less than ${constants.MAX_UNSIGNED_INT}`;
	} else {
		request.body.y1 = y1;
	}
	let x2 = Validate.sanitize(request.body.x2);
	if (!Validate.numbers(x2) || x2 < 0 || x2 >= constants.MAX_UNSIGNED_INT) {
		erroneousFields["x2"] =`Invalid x2 length. ` +
				`Must be less than ${constants.MAX_UNSIGNED_INT}`;
	} else {
		request.body.x2 = x2;
	}
	let y2 = Validate.sanitize(request.body.y2);
	if (!Validate.numbers(y2) || y2 < 0 || y2 >= constants.MAX_UNSIGNED_INT) {
		erroneousFields["y2"] = `Invalid y2 length. ` +
				`Must be less than ${constants.MAX_UNSIGNED_INT}`;
	} else {
		request.body.y2 = y2;
	}
}

function validateShapeType_rect(request, response, erroneousFields) {
	// Validate and sanitize user input
	// Make sure all required fields are submitted
	if (   !request.body.hasOwnProperty("x")
		|| !request.body.hasOwnProperty("y")
		|| !request.body.hasOwnProperty("width")
		|| !request.body.hasOwnProperty("height")
		) {
		let errorMsg = "Invalid value.";
		erroneousFields["x"] = errorMsg;
		erroneousFields["y"] = errorMsg;
		erroneousFields["width"] = errorMsg;
		erroneousFields["height"] = errorMsg;
		return;
	}

	let x = Validate.sanitize(request.body.x);
	if (!Validate.numbers(x) || x < 0 || x >= constants.MAX_UNSIGNED_INT) {
		erroneousFields["x"] =`Invalid x length. ` +
				`Must be less than ${constants.MAX_UNSIGNED_INT}`;
	} else {
		request.body.x = x;
	}
	let y = Validate.sanitize(request.body.y);
	if (!Validate.numbers(y) || y < 0 || y >= constants.MAX_UNSIGNED_INT) {
		erroneousFields["y"] = `Invalid y length. ` +
				`Must be less than ${constants.MAX_UNSIGNED_INT}`;
	} else {
		request.body.y = y;
	}
	let width = Validate.sanitize(request.body.width);
	if (!Validate.numbers(width) || width < 0 || width >= constants.MAX_UNSIGNED_INT) {
		erroneousFields["width"] = `Invalid width length. ` +
				`Must be less than ${constants.MAX_UNSIGNED_INT}`;
	} else {
		request.body.width = width;
	}
	let height = Validate.sanitize(request.body.height);
	if (!Validate.numbers(height) || height < 0 || height >= constants.MAX_UNSIGNED_INT) {
		erroneousFields["height"] = `Invalid height length. ` +
				`Must be less than ${constants.MAX_UNSIGNED_INT}`;
	} else {
		request.body.height = height;
	}
}

function validateShapeType_circle(request, response, erroneousFields) {
	// Validate and sanitize user input
	// Make sure all required fields are submitted
	if (   !request.body.hasOwnProperty("cx")
		|| !request.body.hasOwnProperty("cy")
		|| !request.body.hasOwnProperty("r")
		) {
		let errorMsg = "Invalid value.";
		erroneousFields["cx"] = errorMsg;
		erroneousFields["cy"] = errorMsg;
		erroneousFields["r"] = errorMsg;
		return;
	}

	let cx = Validate.sanitize(request.body.cx);
	if (!Validate.numbers(cx) || cx < 0 || cx >= constants.MAX_UNSIGNED_INT) {
		erroneousFields["cx"] = `Invalid cx. ` +
				`Must be less than ${constants.MAX_UNSIGNED_INT}`;
	} else {
		request.body.cx = cx;
	}
	let cy = Validate.sanitize(request.body.cy);
	if (!Validate.numbers(cy) || cy < 0 || cy >= constants.MAX_UNSIGNED_INT) {
		erroneousFields["cy"] = `Invalid cy. ` +
				`Must be less than ${constants.MAX_UNSIGNED_INT}`;
	} else {
		request.body.cy = cy;
	}
	let r = Validate.sanitize(request.body.r);
	if (!Validate.numbers(r) || r < 0 || r >= constants.MAX_UNSIGNED_INT) {
		erroneousFields["r"] = `Invalid r length. ` +
				`Must be less than ${constants.MAX_UNSIGNED_INT}`;
	} else {
		// truncate the radius to have only 1 decimal place.
		request.body.r = Math.floor(r * 10)/10;
	}
}

const shapeTypeValidators = {
	"LINE" : validateShapeType_line,
	"RECT" : validateShapeType_rect,
	"CIRCLE" : validateShapeType_circle
};

async function initializeShapeType_line(request, response) {
	let newShapeLine = new ShapeLine(
			undefined,
			request.body.boardId,
			request.body.strokeWidth,
			request.body.strokeColor,
			request.body.fillColor,
			request.body.x1,
			request.body.y1,
			request.body.x2,
			request.body.y2
	);
	try {
		await newShapeLine.create();
	} catch(error) {
		console.error("ERROR createing new line shape\n", error);
		response.status(500);
		let errorMsg = "There was an error creating your new shape. Please try again.";
		response.json({success : false, message : errorMsg});

		// Attempt to unlock board
		let board = new Board(request.body.boardId);
		try {
			await board.read();
			board.lockedForEditingById = null;
			board.lockedForEditingOn = null;
			board.update();
		} catch(error) {
			console.error("ERROR processing board locking\n", error);
			response.status(500);
			let errorMsg = "There was an error editing your shape. Please try again.";
			response.json({success : false, message : errorMsg});
		}
		return;
	}
	// If all is created successfully, send the shape
	response.json(newShapeLine);
}

async function initializeShapeType_rect(request, response) {
	let newShapeRect = new ShapeRect(
			undefined,
			request.body.boardId,
			request.body.strokeWidth,
			request.body.strokeColor,
			request.body.fillColor,
			request.body.x,
			request.body.y,
			request.body.width,
			request.body.height
	);
	try {
		await newShapeRect.create();
	} catch(error) {
		console.error("ERROR createing new rectangle shape\n", error);
		response.status(500);
		let errorMsg = "There was an error creating your new shape. Please try again.";
		response.json({success : false, message : errorMsg});

		// Attempt to unlock board
		let board = new Board(request.body.boardId);
		try {
			await board.read();
			board.lockedForEditingById = null;
			board.lockedForEditingOn = null;
			board.update();
		} catch(error) {
			console.error("ERROR processing board locking\n", error);
			response.status(500);
			let errorMsg = "There was an error editing your shape. Please try again.";
			response.json({success : false, message : errorMsg});
		}
		return;
	}
	// If all is created successfully, send the shape
	response.json(newShapeRect);
}

async function initializeShapeType_circle(request, response) {
	let newShapeCircle = new ShapeCircle(
			undefined,
			request.body.boardId,
			request.body.strokeWidth,
			request.body.strokeColor,
			request.body.fillColor,
			request.body.cx,
			request.body.cy,
			request.body.r
	);
	try {
		await newShapeCircle.create();
	} catch(error) {
		console.error("ERROR createing new circle shape\n", error);
		response.status(500);
		let errorMsg = "There was an error creating your new shape. Please try again.";
		response.json({success : false, message : errorMsg});

		// Attempt to unlock board
		let board = new Board(request.body.boardId);
		try {
			await board.read();
			board.lockedForEditingById = null;
			board.lockedForEditingOn = null;
			board.update();
		} catch(error) {
			console.error("ERROR processing board locking\n", error);
			response.status(500);
			let errorMsg = "There was an error editing your shape. Please try again.";
			response.json({success : false, message : errorMsg});
		}
		return;
	}
	// If all is created successfully, send the shape
	response.json(newShapeCircle);
}

const shapeInitializers = {
	"LINE" : initializeShapeType_line,
	"RECT" : initializeShapeType_rect,
	"CIRCLE" : initializeShapeType_circle
};


async function updateShapeType_line(request, response) {
	let shapeLine = new ShapeLine(
			request.body.id,
			request.body.boardId,
			request.body.strokeWidth,
			request.body.strokeColor,
			request.body.fillColor,
			request.body.x1,
			request.body.y1,
			request.body.x2,
			request.body.y2
	);
	try {
		await shapeLine.update();
	} catch(error) {
		console.error("ERROR updating line shape\n", error);
		response.status(500);
		let errorMsg = "There was an error updating your shape. Please try again.";
		response.json({success : false, message : errorMsg});
		return;
	}
	// If all is created successfully, send the shape
	response.json(shapeLine);
}

async function updateShapeType_rect(request, response) {
	let shapeRect = new ShapeRect(
			request.body.id,
			request.body.boardId,
			request.body.strokeWidth,
			request.body.strokeColor,
			request.body.fillColor,
			request.body.x,
			request.body.y,
			request.body.width,
			request.body.height
	);
	try {
		await shapeRect.update();
	} catch(error) {
		console.error("ERROR updating rectangle shape\n", error);
		response.status(500);
		let errorMsg = "There was an error updating your shape. Please try again.";
		response.json({success : false, message : errorMsg});
		return;
	}
	// If all is created successfully, send the shape
	response.json(shapeRect);
}

async function updateShapeType_circle(request, response) {
	let shapeCircle = new ShapeCircle(
			request.body.id,
			request.body.boardId,
			request.body.strokeWidth,
			request.body.strokeColor,
			request.body.fillColor,
			request.body.cx,
			request.body.cy,
			request.body.r
	);
	try {
		await shapeCircle.update();
	} catch(error) {
		console.error("ERROR updating circle shape\n", error);
		response.status(500);
		let errorMsg = "There was an error updating your shape. Please try again.";
		response.json({success : false, message : errorMsg});
		return;
	}
	// If all is created successfully, send the shape
	response.json(shapeCircle);
}

const shapeUpdaters = {
	"LINE" : updateShapeType_line,
	"RECT" : updateShapeType_rect,
	"CIRCLE" : updateShapeType_circle
};
