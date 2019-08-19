var lib = (function() {

	/**
	 * Clears out the children from a given element.
	 * @param  {Element} parentElmt - Parent element to be cleared of children.
	 */
	var clearChildren = function(parentElmt) {
		while (parentElmt.firstChild) {
			parentElmt.removeChild(parentElmt.firstChild);
		}
	}

	/**
	 * Creates and appends an option element to a given Select element.
	 * @param  {Element} selectElmt - Select element to be appended to.
	 * @param  {String} value - Value to be held by the option.
	 * @param  {boolean} [selected=false] - Whether or not the new option should be auto-selected.
	 * @param  {String} text - Display text for the option.
	 */
	var appendOption = function(selectElmt, value, selected=false, text) {
		if (!text) {
			text = value;
		}
		let optionElmt = document.createElement("option");
		optionElmt.value = value;
		optionElmt.selected = selected;
		optionElmt.appendChild(document.createTextNode(text));
		selectElmt.appendChild(optionElmt);
	}

	/**
	 * Adjusts a given UTC time to the local browser time.
	 * @param  {Date} time — Date object that holds the UTC time to be adjusted.
	 * @return {Date} Adjusted Date.
	 */
	var adjustTimeZone = function(time) {
		var offset = time.getTimezoneOffset();
		return new Date(time - (offset * 60 * 1000));
	}


	/**
	 * Based off of the jQuery AJAX function, allows for asynchronous calls
	 *   to the server from webpages.
	 * @param  {Object} options - an object containing overriding values for
	 *   the default operation of the AJAX call.
	 */
	var ajax = function(options) {
		// Varify the argument being passed in is an object.
		if (!options || (typeof options !== "object")) {
			options = {};
		}

		var defaults = {
			url : ".",
			type : "GET",
			async : true,
			timeout : 0,
			before : function() {},
			success : function(result, status, xhr) {},
			failure : function(result, status, xhr) {},
			after : function(result, status, xhr) {},
			requestDataType : "application/json",
			data : {},
			responseDataType : "text/plain",
			username : null,
			password : null
		}

		var params = Object.assign({}, defaults, options);
		params.type = params.type.toUpperCase();

		// Prepare the XHR object based on the user-provided parameters.
		var xhr = new XMLHttpRequest();

		params.before();

		xhr.onreadystatechange = function() {
			if (this.readyState == 4) {
				if (params.responseDataType == "application/json" || params.responseDataType == "text/javascript") {
					// Attempt to parse a response JSON string if told to do so.
					//   If unable to, pass back the raw text response instead.
					try {
						var result = JSON.parse(this.response);
					} catch(error) {
						result = this.responseText;
					}
				} else {
					var result = this.responseText;
				}

				// Check for success
				if (this.status == 200) {
					params.success(result, this.status, this);
				} else {
					params.failure(result, this.status, this);
				}

				params.after(result, this.status, this);
			}
		}

		xhr.open(params.type, params.url, params.async, params.username, params.password);

		// Don't specify the Content-Type headers if provided with
		//   multipart/form-data as the browser does this automatically.
		if (params.requestDataType != "multipart/form-data") {
			xhr.setRequestHeader("Content-Type", params.requestDataType);
		}

		if (params.type == "POST") {
			if (params.requestDataType == "application/json") {
				params.data = JSON.stringify(params.data);
			}

			xhr.send(params.data);
		} else {
			// GET requests
			xhr.send();
		}
	}

	// Expose parts of the library for public use.
	return {
		clearChildren : clearChildren,
		appendOption : appendOption,
		adjustTimeZone : adjustTimeZone,
		ajax : ajax
	};
})();
