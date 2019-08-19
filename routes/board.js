const express			 = require("express");
const router			 = express.Router();
const isLoggedIn		 = require("../middleware/isLoggedIn");
const boardController	 = require("../controllers/boardController");

/**
 * Handle all requests to the /board route.
 * All requests to this route must go through the isLoggedIn middleware, first.
*/
router.all("/*", isLoggedIn, function(request, response, next) {
	next("route");
});

router.post("/create", boardController.board_create_post);

router.get("/:boardId", boardController.board_get);

router.post("/:boardId/update", boardController.board_update_post);

router.post("/:boardId/delete", boardController.board_delete_post);

router.post("/:boardId/addEditor", boardController.board_addEditor_post);

router.post("/:boardId/removeEditor", boardController.board_removeEditor_post);

router.post("/:boardId/shape/beginDraw", boardController.board_shapeBeginDraw_post);

router.post("/:boardId/shape/:shapeId/endDraw", boardController.boad_shapeEndDraw_post);

router.post("/:boardId/shape/:shapeId/erase", boardController.board_shapeErase_post);

module.exports = router;
