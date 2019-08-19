const passport	 = require("passport");

const Board		 = require("../models/Board");

const Validate	 = require("../library/Validate");
const constants	 = require("../library/constants");

exports = module.exports = {};

/**
 * Handle GET requests to /
 */
exports.index_get = function(request, response) {
	response.render("pages/index", {isNotLoggedIn : !request.isAuthenticated()});
};

/**
 * Handle GER requests to /logout
 */
exports.logout_get = function(request, response) {
	request.logout();
	response.redirect("/");
};

/**
 * Handle GET requests to /login
 */
exports.login_get = function(request, response) {
	let flash = request.flash();
	response.render("pages/login", {flashMessages : flash});
};

/**
 * Handle POST requests to /login
 */
exports.login_post = function(request, response, next) {
	// Validate and sanitize user input
	// Make sure all required fields are submitted (username & password).
	if (!request.hasOwnProperty("body")
			|| !request.body.hasOwnProperty("username")
			|| !request.body.hasOwnProperty("password")
		) {
		let errorMsg = "You have entered an erroneous username or password.";
		response.status(400);
		response.format({
			json : function() {
				response.json({success : false, message : errorMsg});
			},
			html : function() {
				request.flash("loginErrorMsg", errorMsg);
				response.redirect("/login");
			}
		});
		return;
	}

	let username = Validate.sanitize(request.body.username);
	if (!Validate.username(username)) {
		let errorMsg = "You have entered an erroneous username or password.";
		response.status(401);
		response.format({
			json : function() {
				response.json({success : false, message : errorMsg});
			},
			html : function() {
				request.flash("loginErrorMsg", errorMsg);
				response.redirect("/login");
			}
		});
		return;
	} else {
		// update the body's username value post-sanitization to be used by Passport.
		request.body.username = username;
	}

	let password = Validate.sanitize(request.body.password);
	if (password.length < 1 || password.length > constants.MAX_PASSWORD_LENGTH) {
		response.status(401);
		let errorMsg = "You have entered an erroneous username or password.";
		response.format({
			json : function() {
				response.json({success : false, message : errorMsg});
			},
			html : function() {
				request.flash("loginErrorMsg", errorMsg);
				response.redirect("/login");
			}
		});
		return;
	} else {
		// update the body's password value post-sanitization to be used by Passport.
		request.body.password = password;
	}


	// Once all fields are sanitized and validated, attempt authentication.
	passport.authenticate("local-login", function(error, user) {
		// Handle an error with Passport.
		if (error) {
			let friendlyErrorMsg = "There was an error logging you in. Please try again.";
			console.error("ERROR performing login attempt with Passport\n", error);
			response.status(500);
			response.format({
				json : function() {
					response.json({success : false, message : friendlyErrorMsg});
				},
				html : function() {
					request.flash("loginErrorMsg", friendlyErrorMsg);
					response.redirect("/login");
				}
			});
			return;
		}
		// Handle invalid user credentials.
		if (!user) {
			response.status(401);
			response.format({
				json : function() {
					response.json({
						success : false,
						message : request.flash("loginErrorMsg")});
				},
				html : function() {
					// Flash message is already handled by Passport.
					response.redirect("/login");
				}
			});
			return;
		}

		// Attempt to establish a login session with the authenticated user.
		request.logIn(user, function(error) {
			// Handle session start error.
			if (error) {
				let friendlyErrorMsg = "There was an internal server error. Please try again.";
				console.error("ERROR establishing login session\n", error);
				response.status(500);
				response.format({
					json : function() {
						response.json({success : false, message : friendlyErrorMsg});
					},
					html : function() {
						request.flash("loginErrorMsg", friendlyErrorMsg);
						response.redirect("/login");
					}
				});
				return;
			}

			// Send the user to their userpage upon successful login session start.
			response.redirect("/lobby");
			return;
		});
	})(request, response, next);
};

/**
 * Handle GET requests to /register
 */
exports.register_get = function(request, response) {
	let flash = request.flash();
	let erroneousFields = flash.erroneousFields ? flash.erroneousFields[0] : {};

	response.render("pages/register", {flashMessages : flash, erroneousFields : erroneousFields});
};

/**
 * Handle POST requests to /register
 */
exports.register_post = function(request, response, next) {
	// Validate and sanitize user input
	// Make sure all required fields are submitted ()
	if (!request.hasOwnProperty("body")
			|| !request.body.hasOwnProperty("username")
			|| !request.body.hasOwnProperty("password")
			|| !request.body.hasOwnProperty("displayName")
		) {
		let errorMsg = "Please provide all fields.";
		response.status(400);
		response.format({
			json : function() {
				response.json({success : false, message : errorMsg});
			},
			html : function() {
				request.flash("registrationErrorMsg", errorMsg);
				response.redirect("/register");
			}
		});
		return;
	}

	// Sanitize and validate the user-provided data
	let erroneousFields = {};

	let username = Validate.sanitize(request.body.username);
	if (!Validate.username(username)) {
		erroneousFields["username"] = "Invalid Username. " +
				"Can only contain letters, numbers, and underscores.";
	} else {
		// update the body's username value post-sanitization to be used by Passport.
		request.body.username = username;
	}
	let password = Validate.sanitize(request.body.password);
	if (password.length < 1 || password.length > constants.MAX_PASSWORD_LENGTH) {
		erroneousFields["password"] = `Invalid password. ` +
				`Cannot exceed ${constants.MAX_PASSWORD_LENGTH} characters in length.`
	} else {
		// update the body's password value post-sanitization to be used by Passport.
		request.body.password = password;
	}
	let displayName = Validate.sanitize(request.body.displayName);
	if (displayName.length < 1 || displayName.length > constants.MAX_STRING_LENGTH) {
		erroneousFields["displayName"] = `Invalid display name. ` +
				`Cannot exceed ${constants.MAX_STRING_LENGTH} characters in length.`
	} else {
		// update the body's displayName value post-sanitization to be used by Passport.
		request.body.displayName = displayName;
	}

	// If any information was provided erroneuously, reject the update.
	if (Object.keys(erroneousFields).length > 0) {
		let errorMsg = "Invalid user data provided.";
		response.status(400);
		response.format({
			json : function() {
				response.json({
					success : false,
					message : errorMsg,
					erroneousFields : erroneousFields
				});
			},
			html : function() {
				request.flash("registrationErrorMsg", errorMsg);
				request.flash("erroneousFields", erroneousFields);
				response.redirect("/register");
			}
		});
		return;
	}


	// Once all fields are sanitized and validated, attempt authentication.
	passport.authenticate("local-registration", function(error, user) {
		// Handle an error with Passport.
		if (error) {
			let friendlyErrorMsg = "There was an error registering your account. Please try again.";
			console.error("ERROR performing registration attempt\n", error);
			response.status(500);
			response.format({
				json : function() {
					response.json({success : false, message : friendlyErrorMsg});
				},
				html : function() {
					request.flash("registrationErrorMsg", friendlyErrorMsg);
					response.redirect("/register");
				}
			});
			return;
		}

		// Handle when account already exists
		if (!user) {
			response.format({
				json : function() {
					response.json({
						success : false,
						message : request.flash("registrationErrorMsg")});
				},
				html : function() {
					// Flash message is already handled by Passport.
					response.redirect("/register");
				}
			});
			return;
		}

		// Attempt to establish a login session with newly created user account.
		request.logIn(user, function(error) {
			// Handle session start error.
			if (error) {
				let friendlyErrorMsg = `You have been successfully registered under ${user.username}. Please login.`;
				console.error(`ERROR establishing login session for user ${user.id} post registration\n`, error);
				response.status(500);
				response.format({
					json : function() {
						response.json({success : false, message : friendlyErrorMsg});
					},
					html : function() {
						request.flash("registrationSuccessMsg", friendlyErrorMsg);
						response.redirect("/login");
					}
				});
				return;
			}

			// If a login session can be established, direct the user to login.
			let msg = `You have been successfully registered under ${user.username}. Please login.`;
			request.logout();
			response.format({
				json : function() {
					response.json({success : true, message : msg});
				},
				html : function() {
					request.flash("registrationSuccessMsg", msg);
					response.redirect("/login");
				}
			});
			return;
		});

	})(request, response, next);
};

/**
 * Handle GET requests to /lobby
 */
exports.lobby_get = async function(request, response, next) {
	let board = new Board(1);

	try {
		await board.read();
		board.shapes = await board.getShapes();
	} catch(error) {
		console.error("ERROR reading lobby board\n", error);
		let errorMsg = "There was a problem loading the lobby. Please try again.";
		error.message = errorMsg;
		response.status(500);
		next(error);
		return;
	}

	response.render("pages/board", {board : board});
};
