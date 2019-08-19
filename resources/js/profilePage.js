var profile = (function() {

	function showAddBoard() {
		document.getElementById("btn_addBoard").style.display = "none";
		document.getElementById("newBoardForm").style.display = "block";
	}

	function addBoard() {
		var data = {
			name : document.getElementById("boardName").value,
			private : document.getElementById("boardPrivate").checked
		};

		lib.ajax({
			url : `/board/create`,
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
					alert("Internal server error: Cannot create new board.");
				}
			},
			after : function() {
				cancelAddBoard();
			},
			data : data
		});
	}

	function cancelAddBoard() {
		document.getElementById("newBoardForm").style.display = "none";
		document.getElementById("btn_addBoard").style.display = "block";
	}

	function toggleEditProfile(btn) {
		if (btn.value == "Edit") {
			document.getElementById("displayName").style.display = "none";
			document.getElementById("inp_displayName").style.display = "block";
			document.getElementById("inp_username").style.display = "block";
			document.getElementById("profileEditButtons").style.display = "block";
			btn.value = "Save";
		} else {
			document.getElementById("displayName").style.display = "block";
			var displayNameElmt = document.getElementById("inp_displayName");
			displayNameElmt.style.display = "none";
			var usernameElmt = document.getElementById("inp_username");
			usernameElmt.style.display = "none";

			document.getElementById("profileEditButtons").style.display = "none";

			var data = {
				displayName : displayNameElmt.value,
				username : usernameElmt.value
			};

			lib.ajax({
				url : `/user/${profile.username}/update`,
				type : "POST",
				requestDataType : "application/json",
				responseDataType : "application/json",
				success : function(response, status) {
					window.location = "/user";
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

	function deleteProfile() {
		var confirmed = confirm("Are you sure you want to delete your account? This cannot be undone.");
		if (!confirmed) {
			return;
		}
		lib.ajax({
			url : `/user/${profile.username}/delete`,
			type : "POST",
			responseDataType : "application/json",
			success : function(response, status) {
				alert(response.message);
				window.location = "/logout";
			},
			failure : function(response, status) {
				if (response.hasOwnProperty("message")) {
					alert(response.message);
				} else {
					alert("Internal Server Error: Unable to delete account.");
				}
			}
		});
	}

	// Expose methods for public use.
	return {
		showAddBoard : showAddBoard,
		addBoard : addBoard,
		cancelAddBoard : cancelAddBoard,
		toggleEditProfile : toggleEditProfile,
		deleteProfile : deleteProfile
	};
})();

function init() {
	profile.username = document.getElementById("username").value;
}
