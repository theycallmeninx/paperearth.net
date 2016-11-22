/*jslint node: true */
"use strict";

var coordsDiv = document.getElementById('MapControls');
var map;

var csrftoken = Cookies.get('csrftoken');

function csrfSafeMethod(method) {
    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}

$.ajaxSetup({
    beforeSend: function(xhr, settings) {
        if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
            xhr.setRequestHeader("X-CSRFToken", csrftoken);
        }
    }
});

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 34.089557, lng: -118.358198},
    zoom: 17,
    clickableIcons: false,
    zoomControl: false,
    streetViewControl: false,
    mapTypeControl: false
  });
  
  map.addListener('dragend', function() {
    $.ajax({
      type:"POST",
      url:"./test/",
      data: map.getBounds().toJSON(),
      success: function(response){
        for (var block in response) {
          var blockcoords = [];
          var street = response[block];
          for (var coords in street) {
            blockcoords.push({ 
              lat: parseFloat(street[coords]['lat']),
              lng: parseFloat(street[coords]['lng'])
            }); 
          }
          var zone = new google.maps.Polygon({
            paths: blockcoords,
            strokeColor: '#FF0000',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#FF0000',
            fillOpacity: 0.25
          });
          zone.setMap(map);
        }
      }
    });
  });

  map.controls[google.maps.ControlPosition.TOP_CENTER].push(coordsDiv);

};

