#!/usr/bin/env node
/**
 * Runner class for starting the application.
 *
 * PinPal
 * @author Brendon Strowe
 */

require("dotenv").config();

const express			 = require("express");
const cookieParser		 = require("cookie-parser");
const passport			 = require("passport");
const session			 = require("express-session");
const flashMessage		 = require("connect-flash");

const authentication	 = require("./authentication/auth");

const indexRouter		 = require("./routes/index");
const userRouter		 = require("./routes/user");
const boardRouter		 = require("./routes/board");
const conversationRouter = require("./routes/conversation");

// Connect to database
const connection = require("./models/DB");

let expressApp = express();

// Configure app to allow types of POST data
expressApp.use(express.urlencoded({
	type : ["application/x-www-form-urlencoded"],
	extended : true
}));
expressApp.use(express.json());
expressApp.use(cookieParser());

// Configure login sessions and Passport.
expressApp.use(session({
	secret : process.env.EXPRESS_SECRET,
	resave : true,
	saveUninitialized : true
}));
expressApp.use(passport.initialize());
expressApp.use(passport.session()); // Persistant sessions for logged-in users.
authentication(passport);

// Enable flash messages
expressApp.use(flashMessage());

// Endpoint setup
expressApp.use("/", indexRouter);
expressApp.use("/user", userRouter);
expressApp.use("/board", boardRouter);
expressApp.use("/conversation", conversationRouter);

// View engine setup
expressApp.set("views", "./views");
expressApp.set("view engine", "pug");

// Makes the generated html easier to read
expressApp.locals.pretty = true;

// Make resources available to views (i.e. css, client-side js, images, etc.)
expressApp.use(express.static(__dirname + "/resources"));

// Catch 404 and forward to error handler
expressApp.use(function(request, response, next) {
	let error = new Error("Not Found");
	error.status = 404;
	next(error);
});

// Error handler
expressApp.use(function(error, request, response, next) {
	if (error == "route") {return;}
	// Set locals, only providing error in development
	response.locals.message = error.message;
	response.locals.error = error;

	// Render the error page
	response.status(error.status || (response.statusCode >= 400 ? response.statusCode : false) || 500);

	response.format({
		json : function() {
			response.json({success : false, message : error.message});
		},
		html : function() {
			response.render("pages/error", {error : error, statusCode : response.statusCode});
		}
	});
});

// Begin the app
expressApp.listen(process.env.APP_PORT || 3000, function() {
	console.log("Starting PinPal app on port " + (process.env.APP_PORT || 3000));
});
