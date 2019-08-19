const constants	 = require("./constants");

/**
 * Handles validation of various types of expected input.
 */
class Validate {

	/**
	 * Strip back-slashes '\' from a string.
	 * @param  {String} value — String to be stripped of shashes.
	 * @return {String} Returns a string with backslashes stripped off.
	 *   (\' becomes ' and so on.) Double backslashes (\\) are made into a
	 *   single backslash (\).
	 */
	static stripSlashes(value) {
		return value.replace(/\\'/g,'\'').replace(/\"/g,'"')
				.replace(/\\\\/g,'\\').replace(/\\0/g,'\0');
	}

	/**
	 * Strip HTML and PHP tags from a string.
	 * @param  {String} value — String to be stripped of tags.
	 * @param  {String} allowableTags — A string listing tags to be overlooked
	 *   when stripping.
	 * @return {String} Returns the stripped string.
	 */
	static stripTags(value, allowableTags) {
		// making sure the allow arg is a string containing only tags
		//   in lowercase (<a><b><c>)
		allowableTags = (((allowableTags || "") + "").toLowerCase()
				.match(/<[a-z][a-z0-9]*>/g) || []).join('');

		let tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
		let commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;
		return value.replace(commentsAndPhpTags, '')
				.replace(tags, function ($0, $1) {
			return allowableTags.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : '';
		});
	}

	/**
	 * Sanatizes a string, ridding it of tags and back-slashes.
	 * @param  {String} value — String to be sanitized.
	 * @return {String} The sanitized string.
	 */
	static sanitize(value) {
		if (typeof value === "string") {
			value = value.trim();
			value = this.stripSlashes(value);
			value = this.stripTags(value);
		}
		return value;
	}

	/**
	 * Determines if the provided value is valid JSON.
	 * @param  {String} value — Value to be validated.
	 * @return {Boolean} Whether or not the provided value is valid JSON.
	 */
	static isJSON(value) {
	    try {
	        JSON.parse(value);
	    } catch (e) {
	        return false;
	    }
	    return true;
	}

	/**
	 * Determines if the provided value is a valid username consisting of
	 *   alphanumeric characters, underscores, and hyphans no longer than
	 *   64 characters.
	 * @param {String} value - Value to be validated.
	 * @return {Boolean} Whether or not the provided value is valid.
	 */
	static username(value) {
		value = value.trim();
		const REGEX = /^[a-zA-Z0-9-_]{1,64}$/;
		return REGEX.test(value);
	}

	/**
	 * Determines if the provided value is a valid string consisting of
	 *   alphanumeric and space characters.
	 * @param  {String} value — Value to be validated.
	 * @return {Boolean} Whether or not the provided value is valid.
	 */
	static alphaNumericSpace(value) {
		value = value.trim();
		const REGEX = /^[\w ]+$/;
		return REGEX.test(value);
	}

	/**
	 * Determines if the provided value is a valid name. Only alphabetic
	 *   characters are permitted along with hyphens and periods.
	 * @param  {String} value — Value to be validated.
	 * @return {Boolean} Whether or not the provided value is a valid name.
	 */
	static name(value) {
		value = value.trim();
		const REGEX = /^[\w\-.' ]+$/;
		return REGEX.test(value);
	}

	/**
	 * Determines if the provided value is a valid number.
	 * @param  {String} value — Value to be validated.
	 * @return {Boolean} Whether or not the provided value is a valid number.
	 */
	static numeric(value) {
		if (typeof value === "string") {
			value = value.trim();
		}
		const REGEX = /(^-?\d\d*\.\d*$)|(^-?\d\d*$)|(^-?\.\d\d*$)/;
		return REGEX.test(value);
	}

	/**
	 * Determines if the provided value is a valid integer.
	 * @param  {String} value — Value to be validated.
	 * @return {Boolean} Whether or not the provided value is a valid integer.
	 */
	static numbers(value) {
		if (typeof value === "string") {
			value = value.trim();
		}
		return !isNaN(Number(value));
	}

	/**
	 * Determines if the provided value is a valid string consisting of
	 *   alphanumeric, space, and typical special characters.
	 * @param  {String} value — Value to be validated.
	 * @return {Boolean} Whether or not the provided value is a valid integer.
	 */
	static alphabeticNumericPunct(value) {
		value = value.trim();
		const REGEX = /^[A-Za-z0-9 ()\/_\-–—.,!?@\"'`~#$%^&*]+$/;
		return REGEX.test(value);
	}

	/**
	 * Determines if the provided value is a valid email address.
	 * @param  {String} value — Value to be validated.
	 * @return {Boolean} Whether or not the provided value is a valid
	 *   email address.
	 */
	static email(value) {
		value = value.trim();
		const REGEX = /^[\w.<>+\-]{1,}@[\w-]{1,}([\.][\w-]{1,}){1,2}$/;
		return REGEX.test(value);
	}

	/**
	 * Determines if the provided value is a valid 24-hour time in the
	 *   format 00:00.
	 * @param  {String} value — Value to be validated.
	 * @return {Boolean} Whether or not the provided value is a valid time.
	 */
	static time(value) {
		value = value.trim();
		const REGEX = /^[0-2][0-9]:[0-5][0-9]$/;
		return REGEX.test(value);
	}

	/**
	 * Determines if the provided value is a valid date.
	 * @param  {String} value — Value to be validated.
	 * @return {Boolean} Whether or not the provided value is a valid date.
	 */
	static date(value) {
		if (typeof value === "string") {
			value = value.trim();
		}
		let date = new Date(value);
		return Boolean(date.valueOf());
	}

	/**
	 * Determines if the provided value is a valid file signature for one of
	 *   the approved image file types as defined in the constanst file.
	 * @param  {String} value - Value to be validated.
	 * @return {Boolean} Whether or not the provided value is a valid and
	 *   aceeptable image file signature.
	 */
	static imageFileSignature(value) {
		for (let signature in constants.FILE_SIGNATURES) {
			if (value == constants.FILE_SIGNATURES[signature]) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Determines if the provided value is a valid shape type supported by this
	 *   application as defined in the constants file.
	 * @param  {String} value - Value to be validated.
	 * @return {Boolean} Whether or not the provided value is a valid and
	 *   aceeptable shape type.
	 */
	static shapeType(value) {
		for (let type of constants.SUPPORTED_SHAPE_TYPES) {
			if (value.toUpperCase() == type) {
				return true;
			}
		}
		return false;
	}

	static colorHexCode(value) {
		value = value.trim();
		const REGEX = /^#(?:[A-Fa-f0-9]{3}){1,2}$/;
		return REGEX.test(value);
	}
}

module.exports = Validate;
