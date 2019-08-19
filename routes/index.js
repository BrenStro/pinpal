const express			 = require("express");
const router			 = express.Router();
const isLoggedIn		 = require("../middleware/isLoggedIn");
const isNotLoggedIn		 = require("../middleware/isNotLoggedIn");
const indexController	 = require("../controllers/indexController");

router.get("/", indexController.index_get);

router.get("/logout", indexController.logout_get);

router.get("/login", isNotLoggedIn, indexController.login_get);

router.post("/login", isNotLoggedIn, indexController.login_post);

router.get("/register", isNotLoggedIn, indexController.register_get);

router.post("/register", isNotLoggedIn, indexController.register_post);

router.get("/lobby", isLoggedIn, indexController.lobby_get);

module.exports = router;
