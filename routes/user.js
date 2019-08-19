const express		 = require("express");
const router		 = express.Router();
const isLoggedIn	 = require("../middleware/isLoggedIn");
const userController = require("../controllers/userController");

/**
 * Handle all requests to the /user route.
 * All requests to this route must go through the isLoggedIn middleware, first.
*/
router.all("/*", isLoggedIn, function(request, response, next) {
	next("route");
});

router.get("/", userController.index);

router.get("/:username", userController.user_get);

router.post("/:username/update", userController.user_update_post);

router.post("/:username/delete", userController.user_delete_post);

module.exports = router;
