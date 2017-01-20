/*jslint node: true */
"use strict";
$("#myCarousel").carousel();

$(".item").click(function () {
  $("#myCarousel").carousel(1);
});

$(".left").click(function () {
  $("#myCarousel").carousel("prev");
});

var mailform = document.getElementById("MailForm");

var mailformcontainer = document.getElementById("MailContainer");

mailform.onclick = function () {
  var e = window.event;
  e.cancelBubble = true;
  if (e.stopPropagation) {
    e.stopPropagation();
  }
};

mailformcontainer.onclick = function () {
  if (this.style.display === "block") {
    this.style.display = "none";
  }
};

