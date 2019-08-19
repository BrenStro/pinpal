var board = (function() {
	this.currentShape = null;
	this.isDrawing = false;

	// Process adding a new shape to the board.
	//   First, initialize the specific kind of shape, then process it
	//   as a generic Shape.
	function newLineDrawing() {
		var newLine = new Line();
		newDrawing(newLine);
	}
	function newRectDrawing() {
		var newRect = new Rect();
		newDrawing(newRect);
	}
	function newCircleDrawing() {
		var newCircle = new Circle();
		newDrawing(newCircle);
	}
	function newDrawing(shape) {
		board.currentShape = shape;

		// Remove any eventListeners that were attached by other shape
		//   initializations but then never used.
		if (board.svgDocument.hasEventListeners) {
			board.svgDocument.removeEventListener("mousedown", drawMouseDown);
		}

		// Prepare the board to track the mouse as the shape gets drawn on the document
		board.svgDocument.addEventListener("mousedown", drawMouseDown);
		board.svgDocument.hasEventListeners = true;
	}
	function drawMouseDown(evt) {
		board.isDrawing = true;

		// Begin preparing data to send to server for new shape creation.
		var data = {
			strokeWidth : document.getElementById("strokeWidth").value,
			strokeColor : document.getElementById("strokeColor").value,
			fillColor : document.getElementById("fillColor").value,
			shapeType : board.currentShape.constructor.name.toUpperCase()
		};
		board.currentShape.style = `fill:${document.getElementById("fillColor").value};stroke:${document.getElementById("strokeColor").value};stroke-width:${document.getElementById("strokeWidth").value};`;

		// Calculate where the client clicked relative to the board (rather than the Window)
		var x = evt.clientX - board.svgDocument.getBoundingClientRect().left;
		var y = evt.clientY - board.svgDocument.getBoundingClientRect().top;
		switch (board.currentShape.constructor.name) {
			case "Line":
				board.currentShape.x1 = data.x1 = data.x2 = x;
				board.currentShape.y1 = data.y1 = data.y2 = y;
				break;
			case "Rect":
				board.currentShape.x = data.x = x;
				board.currentShape.y = data.y = y;
				data.width = 0;
				data.height = 0;
				break;
			case "Circle":
				board.currentShape.cx = data.cx = x;
				board.currentShape.cy = data.cy = y;
				data.r = 0;
				break;
		}

		// Attempt to establish edit locking from the server
		lib.ajax({
			url : `/board/${board.boardId}/shape/beginDraw`,
			type : "POST",
			requestDataType : "application/json",
			responseDataType : "application/json",
			success : function(response, status) {
				// Once this new shape is initialized on the server,
				//   update the client-side data.
				board.currentShape.id = `shapeId_${response.id}`;

				board.currentShape.createElement();
				board.svgDocument.appendChild(board.currentShape.element);

				board.svgDocument.addEventListener("mousemove", drawMouseMove);
				board.svgDocument.addEventListener("mouseup", drawMouseMove);
			},
			failure : function(response, status) {
				board.svgDocument.removeEventListener("mousedown", drawMouseDown);
				board.isDrawing = false;
				if (response.hasOwnProperty("message")) {
					alert(response.message);
				} else {
					alert("Internal server error: Cannot draw on this board.");
				}
			},
			data : data
		});
	}
	function drawMouseMove(evt) {

		// Begin preparing data to send to server for final update for this shape.
		var data = {
			strokeWidth : document.getElementById("strokeWidth").value,
			strokeColor : document.getElementById("strokeColor").value,
			fillColor : document.getElementById("fillColor").value,
			shapeType : board.currentShape.constructor.name.toUpperCase(),
			id : board.currentShape.id.substring(8)
		};

		// Calculate where the client clicked relative to the board (rather than the Window)
		var x = evt.clientX - board.svgDocument.getBoundingClientRect().left;
		var y = evt.clientY - board.svgDocument.getBoundingClientRect().top;
		switch (board.currentShape.constructor.name) {
			case "Line":
				data.x1 = board.currentShape.x1;
				data.y1 = board.currentShape.y1;
				board.currentShape.x2 = data.x2 = x;
				board.currentShape.y2 = data.y2 = y;
				break;
			case "Rect":
				data.x = board.currentShape.x;
				data.y = board.currentShape.y;
				board.currentShape.width = data.width = Math.abs(x - board.currentShape.x);
				board.currentShape.height = data.height = Math.abs(y - board.currentShape.y);
				break;
			case "Circle":
				data.cx = board.currentShape.cx;
				data.cy = board.currentShape.cy;
				board.currentShape.r = data.r =
					Math.sqrt(
						Math.pow(
							Math.abs(board.currentShape.cx - (x)), 2
						) +
						Math.pow(
							Math.abs(board.currentShape.cy - (y)), 2
						)
					);
				break;
		}
		board.currentShape.reDrawElement();

		// If this method was called on mouseup, send the final updated version
		//   of this Shape to the server.
		if (evt.type === "mouseup") {
			lib.ajax({
				url : `/board/${board.boardId}/shape/${board.currentShape.id.substring(8)}/endDraw`,
				type : "POST",
				requestDataType : "application/json",
				responseDataType : "application/json",
				before : function() {
					board.svgDocument.removeEventListener("mousedown", drawMouseDown);
					board.svgDocument.removeEventListener("mousemove", drawMouseMove);
					board.svgDocument.removeEventListener("mouseup", drawMouseMove);
					board.isDrawing = false;
				},
				failure : function(response, status) {
					// Remove the attempted shape addition from the DOM.
					board.svgDocument.removeChild(board.currentShape.element);
					if (response.hasOwnProperty("message")) {
						alert(response.message);
					} else {
						alert("Internal server error: Cannot draw on this board.");
					}
				},
				after : function() {
					board.currentShape = null;
				},
				data : data
			});
		}
	}

	// Process removing a new shape from the board.
	//   First, get the shape to be erased, then update the server with said deletion.
	function erase() {
		board.currentShape = null; // There should be no current shape being drawn when in erase mode.
		board.svgDocument.addEventListener("mousedown", eraseMouseDown);
	}
	function eraseMouseDown(evt) {
		// Only process erases for the drawn SVG elements
		if (evt.target.nodeName == "line" ||
			evt.target.nodeName == "rect" ||
			evt.target.nodeName == "circle") {
				lib.ajax({
					url : `/board/${board.boardId}/shape/${evt.target.id.substring(8)}/erase`,
					type : "POST",
					responseDataType : "application/json",
					before : function() {
						board.svgDocument.removeEventListener("mousedown", eraseMouseDown);
					},
					success : function(response, status) {
						board.svgDocument.removeChild(evt.target);
					},
					failure : function(response, status) {
						if (response.hasOwnProperty("message")) {
							alert(response.message);
						} else {
							alert("Internal server error: Unable to erase shape.");
						}
					}
				});
		}
	}

	function refreshBoard() {
		// Only refresh this board when it is NOT being actively drawn on.
		if (!board.isDrawing) {
			lib.ajax({
				url : `/board/${board.boardId}`,
				type : "GET",
				responseDataType : "application/json",
				success : render,
				failure : function(response, status) {
					clearInterval(board.boardRefreshInterval);
					if (response.hasOwnProperty("message")) {
						alert(response.message);
					} else {
						alert("Internal server error: Unable to refresh board.");
					}
				}
			});
		}
	}
	function render(boardObj) {
		lib.clearChildren(board.svgDocument);

		for (let shapeIndex = boardObj.shapes.length-1; shapeIndex >= 0; shapeIndex--) {
			let shape = boardObj.shapes[shapeIndex];
			switch (shape.shapeType.toUpperCase()) {
				case "LINE":
					var newShape = new Line(shape.x1, shape.y1, shape.x2, shape.y2);
					break;
				case "RECT":
					var newShape = new Rect(shape.x, shape.y, shape.width, shape.height);
					break;
				case "CIRCLE":
					var newShape = new Circle(shape.r, shape.cx, shape.cy);
			}
			newShape.style = `fill:${shape.fillColor};stroke:${shape.strokeColor};stroke-width:${shape.strokeWidth};`;
			newShape.id = `shapeId_${shape.id}`;
			newShape.createElement();
			board.svgDocument.appendChild(newShape.element);
		}
	}

	var refreshChat = function() {
		var chatId = document.getElementById("sendMessage").dataset.url.substr(14,1);

		lib.ajax({
			url : `/conversation/${chatId}`,
			type : "GET",
			responseDataType : "application/json",
			success : function(response, status) {
				var listElmt = document.getElementById("chatLog").children[0];
				lib.clearChildren(listElmt);

				var messages = response.data.messages;

				for (var msgIndex = 0, msgLength = messages.length; msgIndex < msgLength; msgIndex++) {
					var messageElmt = document.createElement("li");

					var authorElmt = document.createElement("a");
					authorElmt.href = `/user/${messages[msgIndex].author.username}`;
					authorElmt.id = "chatDisplayName";
					authorElmt.appendChild(document.createTextNode(messages[msgIndex].author.displayName));
					messageElmt.appendChild(authorElmt);

					var textElmt = document.createElement("p");
					textElmt.id = "chatMessage";
					textElmt.appendChild(document.createTextNode(messages[msgIndex].text));
					messageElmt.appendChild(textElmt);

					var timestampElmt = document.createElement("p");
					timestampElmt.id = "chatTimestamp";
					var timestamp = new Date(messages[msgIndex].timestamp)
					timestamp = lib.adjustTimeZone(timestamp);
					timestamp = timestamp.toLocaleString();
					timestampElmt.appendChild(document.createTextNode(timestamp));
					messageElmt.appendChild(timestampElmt);

					listElmt.appendChild(messageElmt);

					listElmt.scrollTop = listElmt.scrollHeight;
				}
			},
			failure : function(response, status) {
				if (response.hasOwnProperty("message")) {
					alert(response.message);
				} else {
					alert(response);
				}
				clearInterval(board.chatRefreshInterval);
			}
		});
	}

	var sendMessage = function() {
		var data = {
			message : document.getElementById("message").value
		};

		lib.ajax({
			url : document.getElementById("sendMessage").dataset.url,
			type : "POST",
			requestDataType : "application/json",
			responseDataType : "application/json",
			success : function(response, status) {
				document.getElementById("message").value = "";
				// refreshChat the chat to retrieve the latest sent message
				clearInterval(board.chatRefreshInterval);
				refreshChat();
				board.chatRefreshInterval = setInterval(board.refreshChat, 5000);
			},
			failure : function(response, status) {
				if (response.hasOwnProperty("message")) {
					alert(response.message);
				} else {
					alert(response);
				}
			},
			data : data
		});
	}

	function toggleEditBoard(btn) {
		if (btn.value == "Edit") {
			document.getElementById("boardName").style.display = "none";
			document.getElementById("inp_boardName").style.display = "block";
			document.getElementById("boardEditButtons").style.display = "block";
			btn.value = "Save";
		} else {
			document.getElementById("boardName").style.display = "block";
			var boardNameElmt = document.getElementById("inp_boardName");
			boardNameElmt.style.display = "none";

			document.getElementById("boardEditButtons").style.display = "none";
			var boardPrivateElmt = document.getElementById("cbx_boardPrivate");

			var data = {
				name : boardNameElmt.value,
				private : boardPrivateElmt.checked
			};

			lib.ajax({
				url : `/board/${board.boardId}/update`,
				type : "POST",
				requestDataType : "application/json",
				responseDataType : "application/json",
				success : function(response, status) {
					window.location = window.location;
				},
				failure : function(response, status) {
					if (response.hasOwnProperty("message")) {
						alert(response.message);
					} else {
						alert("Internal Server Error: Unable to save changes.");
					}
				},
				data : data
			});

			btn.value = "Edit";
		}
	}

	function addEditor() {
		var username = prompt("Username of user to add as an Editor to this board.");
		lib.ajax({
			url : `/board/${board.boardId}/addEditor`,
			type : "POST",
			requestDataType : "application/json",
			responseDataType : "application/json",
			success : function(response, status) {
				alert(response.message);
			},
			failure : function(response, status) {
				if (response.hasOwnProperty("message")) {
					alert(response.message);
				} else {
					alert(`Internal Server Error: Unable to add user ${username}.`);
				}
			},
			data : {username : username}
		});
	}

	function removeEditor() {
		var username = prompt("Username of user to remove as an Editor from this board.");
		lib.ajax({
			url : `/board/${board.boardId}/removeEditor`,
			type : "POST",
			requestDataType : "application/json",
			responseDataType : "application/json",
			success : function(response, status) {
				alert(response.message);
			},
			failure : function(response, status) {
				if (response.hasOwnProperty("message")) {
					alert(response.message);
				} else {
					alert(`Internal Server Error: Unable to remove user ${username}.`);
				}
			},
			data : {username : username}
		});
	}

	function deleteBoard() {
		// Pause board updating while being prompted about board deletion.
		clearInterval(board.chatRefreshInterval);
		clearInterval(board.boardRefreshInterval);

		var confirmed = confirm("Are you sure you want to delete your board? This cannot be undone.");
		if (!confirmed) {
			// Resume updating if no deletion
			board.chatRefreshInterval = setInterval(board.refreshChat, 5000);
			board.boardRefreshInterval = setInterval(board.refreshBoard, 500);
			return;
		}
		lib.ajax({
			url : `/board/${board.boardId}/delete`,
			type : "POST",
			responseDataType : "application/json",
			success : function(response, status) {
				alert(response.message);
				window.location = "/user/";
			},
			failure : function(response, status) {
				if (response.hasOwnProperty("message")) {
					alert(response.message);
				} else {
					alert("Internal Server Error: Unable to delete board.");
				}
			}
		});
	}

	// Expose methods for public use.
	return {
		refreshChat : refreshChat,
		sendMessage : sendMessage,
		newLineDrawing : newLineDrawing,
		newRectDrawing : newRectDrawing,
		newCircleDrawing : newCircleDrawing,
		erase : erase,
		refreshBoard : refreshBoard,
		currentShape : currentShape,
		isDrawing : isDrawing,
		toggleEditBoard : toggleEditBoard,
		addEditor : addEditor,
		removeEditor : removeEditor,
		deleteBoard : deleteBoard
	};
})();

function init() {
	board.boardId = document.getElementById("boardId").value;
	board.refreshChat();
	board.chatRefreshInterval = setInterval(board.refreshChat, 5000);
	board.svgDocument = document.getElementById("boardSvg");
	board.boardRefreshInterval = setInterval(board.refreshBoard, 500);

	for (let colorInputElmt of document.querySelectorAll("input[type='color']")) {
		colorInputElmt.style.borderColor = colorInputElmt.value;
		colorInputElmt.addEventListener("blur", function() {
			colorInputElmt.style.borderColor = colorInputElmt.value;
		});
	}
}
