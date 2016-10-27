/*jslint node: true */
"use strict";

var newchoicetext = document.getElementById("newchoicetext");
var newchoiceradio = document.getElementById("newchoice");

newchoicetext.onfocus = function () {
	if (this.value === "New Choice...") {
		this.value = "";
	}
};

newchoicetext.onblur = function () {
	if (this.value === "") {
		this.value = "New Choice...";
	}
};

newchoiceradio.onfocus = function () {
	if (newchoicetext.value === "New Choice...") {
		newchoicetext.value = "";
	}
};

newchoiceradio.onblur = function () {
	if (newchoicetext.value === "") {
		newchoicetext.value = "New Choice...";
	}
};