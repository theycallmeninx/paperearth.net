/*jslint node: true */
"use strict";

var map;

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: -34.397, lng: 150.644},
    zoom: 8
  });
}


var mailform = document.getElementById("mailform");

var mailformcontainer = document.getElementById("mailcontainer");

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
