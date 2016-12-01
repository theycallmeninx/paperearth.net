/*jslint node: true */
"use strict";


var map;
var autocomplete;
var zonepolys = [];

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


document.getElementById('datefield').valueAsDate = new Date();



var mapstyle = [
  {
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#f5f5f5"
      }
    ]
  },
  {
    "elementType": "labels.icon",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#f5f5f5"
      }
    ]
  },
  {
    "featureType": "administrative.land_parcel",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#bdbdbd"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#eeeeee"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#e5e5e5"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#9e9e9e"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#ffffff"
      }
    ]
  },
  {
    "featureType": "road.arterial",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#dadada"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#9e9e9e"
      }
    ]
  },
  {
    "featureType": "transit.line",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#e5e5e5"
      }
    ]
  },
  {
    "featureType": "transit.station",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#eeeeee"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#c9c9c9"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#9e9e9e"
      }
    ]
  }
];

function makeNewPoly(coords, stroke, fill) {
  var blockcoords = [];
  for (var order in coords) {
    blockcoords.push({  
      lat: parseFloat(coords[order]['lat']),
      lng: parseFloat(coords[order]['lng'])
    });   
  }

  return new google.maps.Polygon({
    paths: blockcoords,
    strokeColor: "rgb("+stroke+")",
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: "rgb("+fill+")",
    fillOpacity: 0.85
  });
}

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 34.089557, lng: -118.358198},
    zoom: 19,
    clickableIcons: false,
    zoomControl: false,
    streetViewControl: false,
    mapTypeControl: false,
    styles: mapstyle,
    scaleControl: true,
  });

  autocomplete = new google.maps.places.Autocomplete(
      /** @type {!HTMLInputElement} */(document.getElementById('autoaddress')),
      {types: ['geocode']});
  
  var iconBase = 'http://maps.google.com/mapfiles/kml/pal4/';
  var signsicons = {
    caution: {
      icon: iconBase + 'icon62.png'
    },
    good: {
      icon: iconBase + 'icon31.png'
    },
    bad: {
      icon: iconBase + 'icon15.png'
    }
  };

  function addMarker(feature) {
    var marker = new google.maps.Marker({
      position: feature.position,
      icon: signsicons[feature.type].icon,
      map: map,
      title: feature.title
    });
    var infowindow = new google.maps.InfoWindow({
      content: '<img style="height:250px;" src="'+feature.img+'">'
    });
      marker.addListener('click', function() {
      infowindow.open(map, marker);
    });
  }

  google.maps.event.addListenerOnce(map, 'idle', function(){
    var postdata = map.getBounds().toJSON();
    postdata['date'] = Date.now();
    $.ajax({
      type:"POST",
      url:"./start/",
      data: postdata,
      success: function(response){

        for (var zoneid in response) {
          var blockid = response[zoneid];
          var data = response[zoneid]['d'];
          var coords = response[zoneid]['c'];
          var signs = response[zoneid]['s'];
          for (var sign in signs) {
            //todo: find a way to stack the images?
            var c = signs[sign]['c']
            var f = {
              position: new google.maps.LatLng(c['lat'],c['lng']),
              type: 'caution',
              img: signs[sign]['i'],
              title: signs[sign]['r']
            }; 
            addMarker(f);
          }
          for (var set in coords) {
            var poly = makeNewPoly(coords[set], data['s'], data['f']);
            zonepolys.push(poly);
            poly.setMap(map);  
          }
        }
      }
    });
  });

  map.controls[google.maps.ControlPosition.TOP_LEFT].push(document.getElementById('AddressBar'));
  map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(document.getElementById('MapControls'));

};