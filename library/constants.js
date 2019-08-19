module.exports = Object.freeze({
	MAX_UNSIGNED_INT : 4294967295, // Maximum unsigned int size supported by MySQL
	MAX_SIGNED_INT : 2147483647, // Maximum signed int size supported by MySQL
	MAX_STRING_LENGTH : 64,		 // An arbitrary max string length for database fields.
	MAX_PARAGRAPH_LENGTH : 1024, // An arbitrary max paragraph length for database fields.
	MAX_PASSWORD_LENGTH : 2048,	 // An arbitrary max password length for database fields.
	MAX_IMAGE_FILE_SIZE : 512000,	// An arbitrary max filezie for images (0.5MB).
	FILE_SIGNATURES : {			 // File signatures for various file types
		jpg : "ffd8ffe0",
		jpg1 : "ffd8ffe1",
		png : "89504e47",
		gif : "47494638"
	},
	SUPPORTED_SHAPE_TYPES : [
		"LINE",
		"RECT",
		"CIRCLE"
	],
	LOCKOUT_TIME : 1000*5 // Number of milliseconds in 1 second * number of seconds.
});
