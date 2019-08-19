const SVGNS = "http://www.w3.org/2000/svg";

class SVG {
	constructor() {
		this.element = "";
	}

	createElement(elementName, nameSpace=null) {
		let newElement = document.createElementNS(SVGNS, elementName);

		for (let property in this) {
			if ((typeof this[property] == "string" &&  this[property] !== "" ) || typeof this[property] == "number") {
				newElement.setAttributeNS(nameSpace, property, this[property]);
			}
		}

		this.element = newElement;
		return this.element;
	}

	reDrawElement(nameSpace=null) {
		for (let property in this) {
			if ((typeof this[property] == "string" &&  this[property] !== "" ) || typeof this[property] == "number") {
				this.element.setAttributeNS(nameSpace, property, this[property]);
			}
		}
	}
}

class Group extends SVG {
	constructor(id) {
		super();
		this.id = id;
		this.childElements = [];
	}

	createElement() {
		let groupElmt = super.createElement("g");

		for (let childElmt of this.childElements) {
			groupElmt.appendChild(childElmt.createElement());
		}

		return groupElmt;
	}
}

class Shape extends SVG {
	constructor() {
		super();
		this.style = "";
	}

	createElement(shapeName) {
		return super.createElement(shapeName);
	}
}

class Text extends Shape {
	constructor(text) {
		super();
		this.text = [text];
	}

	createElement() {
		let textElmt = super.createElement("text");
		textElmt.appendChild(document.createTextNode(this.text[0]));
		return textElmt;
	}
}

class Circle extends Shape {
	constructor(r=5, cx=0, cy=0) {
		super();
		this.r = r;
		this.cx = cx;
		this.cy = cy;
	}

	createElement() {
		return super.createElement("circle");
	}
}

class Rect extends Shape {
	constructor(x=0, y=0, width=10, height=10) {
		super();
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
	}

	createElement() {
		return super.createElement("rect");
	}
}
class Line extends Shape {
	constructor(x1=5, y1=5, x2=10, y2=10) {
		super();
		this.x1 = x1;
		this.y1 = y1;
		this.x2 = x2;
		this.y2 = y2;
	}

	createElement() {
		return super.createElement("line");
	}
}
