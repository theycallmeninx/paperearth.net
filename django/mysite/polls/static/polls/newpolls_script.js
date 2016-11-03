/*jslint node: true */
"use strict";

/* New Poll Page */

var NewPoll = document.getElementById("NewPoll");
var AddNewChoice = document.getElementById("AddNewChoice");

NewPoll.onfocus = function () {
  if (this.value === "Question") {
    this.value = "";
  }
};

NewPoll.onblur = function () {
  if (this.value === "") {
    this.value = "Question";
  }
};

AddNewChoice.onclick = function () {
  var choices = document.getElementsByName("Choices").length,
    NewInput = document.createElement("INPUT"),
    NewLabel = document.createElement("Label"),
    NewChoices = document.getElementById("NewChoices");
  
  NewLabel.innerHTML = "Choice " + (choices + 1);
  
  NewInput.id = "Choice" + (choices + 1);
  NewInput.name = "Choices";
  NewInput.type = "text";

  NewLabel.appendChild(NewInput);
  NewChoices.appendChild(NewLabel);
};