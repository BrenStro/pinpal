/**
 * Passport authentication.
 * Set up Passport to authenticate persistent login sessions. Passport needs
 *  the ability to serialize and deserialize users in and out of a session.
 */

const LocalStrategy			 = require("passport-local").Strategy;
const bcrypt				 = require("bcrypt");
const User					 = require("../models/User");

module.exports = function(passport) {
	/**
	 * Used to serialize the user for the start of a session load.
	 * @param {User} user - User to be serialized.
	 * @param {Function} done - Callback function for completion of user serialization.
	 */
	passport.serializeUser(function(user, done) {
		done(null, user.id);
	});

	/**
	 * Used to deserialize the user at the end of a session load.
	 * @param {string} username - Username of the User to be sdeerialized.
	 * @param {Function} done - Callback function for completion of user deserialization.
	 */
	passport.deserializeUser(function(id, done) {
		// Query database with the serialized Id
		let user = new User(id);
		user.read().then(function() {
			done(null, user);
		}).catch(function(error) {
			done(error);
		})
	});

	/**
	 * Local Sign-Up setup.
	 */
	passport.use("local-registration", new LocalStrategy (
		{
			usernameField : "username",
			passwordField : "password",
			passReqToCallback : true // Allows us to pass back the entire request to the callback/done function
		},
		async function(request, username, password, done) {
			let newUser = new User(undefined, username);
			try {
				var userAlreadyExists = await newUser.exists();
			} catch(error) {
				console.error(`ERROR determining if user ${username} exists.`);
				done("There was an error registering your account.");
				return;
			}
			if (userAlreadyExists) {
				request.flash(
						"registrationErrorMsg",
						`A user with the username ${username} already exists.`
				);
				done(null, false);
				return;
			}

			// hash the provided password
			try {
				var hash = await bcrypt.hash(password, 10);
			} catch (error) {
				console.error("ERROR hashing password\n", error);
				done("There was an error registering your account.");
				return
			}
			newUser.password = hash;

			newUser.displayName = request.body.displayName;

			// Put new user into the database.
			try {
				let success = await newUser.create();
				done(null, newUser);
			} catch(error) {
				console.error("ERROR creating new user\n", error);
				done("There was an error registering your account.");
			}
			return;
		}
	));


	// The local strategy requires a `verify` function which receives the
	// credentials ("username" and "password") submitted by the user. The function
	// must verify that the password is correct and then invoke `cb` with a
	// user object, which will be set at `req.user` in route handlers after
	// authentication.
	passport.use("local-login", new LocalStrategy (
		{
			usernameField : "username",
			passwordField : "password",
			passReqToCallback : true // Allows us to pass back the entire request to the callback/done function
		},
		async function(request, username, password, done) {
			// Query database with furRitUsername and password.
			//  We want to validate their login credentials.
			let existingUser = new User(undefined, username);
			try {
				var userAlreadyExists = await existingUser.exists();
			} catch(error) {
				console.error(`ERROR determining if user ${username} exists.`);
				return done("There was an error processing your login.");
			}
			if (!userAlreadyExists) {
				return done(null, false, request.flash("loginErrorMsg",
						"You have entered an erroneous username or password."
				));
			}

			try {
				await existingUser.read();
			} catch(error) {
				console.error("ERROR reading existing user from database.\n", error);
				return done("There was an error processing your login.");
			}

			// Verify password
			try {
				var result = await bcrypt.compare(password, existingUser.password);
			} catch(error) {
				console.error("ERROR comparing provided and stored passwords.\n", error);
				return done("There was an error processing your login.");
			}
			if (result) {
				return done(null, existingUser);
			} else {
				return done(null, false, request.flash("loginErrorMsg",
						"You have entered an erroneous username or password."
				));
			}
		}
	));
}
