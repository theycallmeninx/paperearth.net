/*jslint node: true */
"use strict";

var map;

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: -34.397, lng: 150.644},
    zoom: 8
  });
}

var mailform = document.getElementById("mailformcontainer");

mailform.onclick = function () {
  if (mailform.style.display == "block") {
    mailform.style.display = "none";
  }
};
