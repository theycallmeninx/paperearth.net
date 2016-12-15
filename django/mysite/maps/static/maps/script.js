/*jslint node: true */
"use strict";


var DATE = new Date();
var DIRECTIONS;
var GOOGLEMAP;
var NEWSIGNMAP;
var NEWSIGNCENTERPIN;
var NEWSIGNBLOCKPOLY;
var GEOCODER;
var CENTERPIN;
var AUTOCOMPLETE;

var zonepolys = {active: { visible:[], hidden:[] }, todelete:[]};
var HOURMIN = parseInt(DATE.getHours().toString() + DATE.getMinutes().toString());

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


function isSignVisible(hour, start, end) {
  //console.log(hour+":"+start+":"+end);
  if (start < end) {
    if (hour >= start && hour <= end){
      return true;
    }
  } else if (end < start) {
    if (hour >= start || hour <= end){
      return true;
    }
  }
  return false;
}

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

function makeNewPoly(coords, stroke, fill, vis) {
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
    fillOpacity: 0.85, 
    visible: vis
  });
}

function createSignBlockPoly(coordinates) {
  return new google.maps.Polygon({
    paths: coordinates,
    strokeColor: "red",
    strokeOpacity: 1,
    strokeWeight: 2,
    fillColor: "url('https://upload.wikimedia.org/wikipedia/en/f/f4/Xp_sspipes_candycane_tile.png')",
    fillOpacity: 0.5,
    editable: true,
    map: NEWSIGNMAP
  });
}

function calculateNormal(c1, c2, side) {

  var dx = parseFloat(c2.lng) - parseFloat(c1.lng);
  var dy = parseFloat(c2.lat) - parseFloat(c1.lat);
  var magnitude = Math.sqrt((dx*dx) + (dy*dy));
  var scalar = magnitude / 0.000150;
  if (side == "R") {
    return {'lat': parseFloat(c1.lat)+(dx/scalar), 'lng': parseFloat(c1.lng)-(dy/scalar)};
  } else {
    return {'lat': parseFloat(c1.lat)-(dx/scalar), 'lng': parseFloat(c1.lng)+(dy/scalar)};
  }
}

function layerBlockZone(input) {
  //get address, get address block coordinates - CENSUS

  //with the ends defined, create a travel route with origin and destination
  //if L - origin/dest, R - dest/origin
  
  if (!(NEWSIGNBLOCKPOLY == null)) {
    NEWSIGNBLOCKPOLY.setMap(null);
    NEWSIGNBLOCKPOLY = null;
  }

  GEOCODER.geocode({location: NEWSIGNMAP.getCenter().toJSON()}, function(results) {
    var res = results[0];
    var data = {
      state: res.address_components[5].short_name,
      city: res.address_components[3].short_name,
      name: res.address_components[1].long_name,
      number: res.address_components[0].long_name
      };
    $.post("./findblock/", data, function(response) {
      var coordinates = [];
      var base = res.address_components[1].short_name + " " +
        res.address_components[3].long_name + " " +
        res.address_components[5].long_name + " " +
        res.address_components[6].long_name;

      if ('address' in response) {
        var orig = response['address']['to'] + " " + base;
        var dest = response['address']['from'] + " " + base;
  
        DIRECTIONS.route({travelMode: google.maps.TravelMode.DRIVING, destination:dest, origin: orig}, function(results, status) {
          var coords = results.routes[0].overview_path;
          var c;
          var tempcoords;
          for (var point in coords) {
            var index = parseInt(point);
            c = coords[point].toJSON();
            if (point == coords.length-1) {
              tempcoords = {
                'lat': parseFloat(c.lat)+(parseFloat(c.lat)-parseFloat(coords[index-1].lat())),
                'lng': parseFloat(c.lng)+(parseFloat(c.lng)-parseFloat(coords[index-1].lng()))
              };
            }
            else {
              tempcoords = coords[index+1].toJSON();
            }
            coordinates.push(c);
            coordinates.unshift(calculateNormal(c, tempcoords, response['address']['side']));
          }
          NEWSIGNBLOCKPOLY = createSignBlockPoly(coordinates);
        });
      } else if ('coordinates' in response) {
        coordinates = response['coordinates'];
        NEWSIGNBLOCKPOLY = createSignBlockPoly(coordinates);
      }      
    });
  }); 
}


function toggleAddSign() {

  $('#AddSignContainer').slideToggle("slow", function initialize() {
    if (NEWSIGNMAP == null) {
      NEWSIGNMAP = new google.maps.Map(document.getElementById('NewSignMapBox'), {
        center: {lat: 34.089557, lng: -118.358198},
        zoom: 17,
        clickableIcons: false,
        zoomControl: false,
        streetViewControl: false,
        mapTypeControl: false,
        styles: mapstyle,
        scaleControl: true,
      });

      NEWSIGNMAP.controls[google.maps.ControlPosition.TOP_CENTER].push(document.getElementById('NewSignAddressBar'));
      NEWSIGNMAP.controls[google.maps.ControlPosition.LEFT_CENTER].push(document.getElementById('NewSignBlockButtons'));

      NEWSIGNCENTERPIN = new google.maps.Marker({
        position: NEWSIGNMAP.getCenter(),
        map: NEWSIGNMAP,
        animation: google.maps.Animation.DROP,
      });

      google.maps.event.addListener(NEWSIGNMAP, 'dragend', function(){
        GEOCODER.geocode({location: NEWSIGNMAP.getCenter().toJSON()}, function(results) {
          $('#NewSignAutoaddress').val(results[0].formatted_address);
          });
        NEWSIGNCENTERPIN.setPosition(NEWSIGNMAP.getCenter().toJSON());
      });

      google.maps.event.addListenerOnce(NEWSIGNMAP, 'idle', function() {
        GEOCODER.geocode({location: NEWSIGNMAP.getCenter().toJSON()}, function(results) {
          $('#NewSignAutoaddress').val(results[0].formatted_address);
        });
      });
    }
  });



  $('#MapContainer').slideToggle("slow");

};


window.onload = function() {

  var timeslider = document.getElementById("timeslider");
  timeslider.oninput = function() {
    var hourtime = HOURMIN + (this.value*100);
    hourtime = hourtime > 2400 ? hourtime-2400 : hourtime;
    
    var toshow = [];
    var tohide = [];
    // console.log(hourtime);
    var poly;

    for (var index in zonepolys.active.visible) {
      poly = zonepolys.active.visible[index];
      for (var slot in poly.sign.json.t) {
        // console.log(slot);
        for (var times in poly.sign.json.t[slot]['t']) {
          var time = poly.sign.json.t[slot]['t'][times];
          if (!isSignVisible(hourtime, time.s, time.e)) {
        // if (!isSignVisible(hourtime, poly.sign.json.t.t[slot].s, poly.sign.json.t.t[slot].e)) {
            tohide.push(poly);
            poly.sign.marker.setVisible(false);
            for (var zone in poly.zones) {
              poly.zones[zone].setVisible(false);
              // console.log(zone);
            }
            break;
          }
        }
      }
    }

    for (var index in zonepolys.active.hidden) {
      poly = zonepolys.active.hidden[index];
      for (var slot in poly.sign.json.t) {
        // console.log(slot);
        for (var times in poly.sign.json.t[slot]['t']) {
          var time = poly.sign.json.t[slot]['t'][times];
          if (isSignVisible(hourtime, time.s, time.e)) {
            toshow.push(poly);      
            poly.sign.marker.setVisible(true);
            for (var zone in poly.zones) {
              poly.zones[zone].setVisible(true);
              // console.log(zone);
            }
            break;
          }
        }
      }
    }

    var keepvisible = [];
    if (zonepolys.active.visible.length > 0) {
      keepvisible = zonepolys.active.visible.filter( function (sign)
      {
        for (var slot in sign.sign.json.t) {
          for (var times in sign.sign.json.t[slot]['t']) {
            var time = sign.sign.json.t[slot]['t'][times];
            if (isSignVisible(hourtime, parseInt(time.s), parseInt(time.e))) {
              return true;
            }
          }
        }
        return false;
      });
    }

    var keephidden = [];
    if (zonepolys.active.hidden.length > 0) {
      keephidden = zonepolys.active.hidden.filter( function (sign)
      {
        for (var slot in sign.sign.json.t) {
          for (var times in sign.sign.json.t[slot]['t']) {
            var time = sign.sign.json.t[slot]['t'][times];
            if (isSignVisible(hourtime, parseInt(time.s), parseInt(time.e))) {
              return false;
            }
          }
        }
        return true;
      });
    }

    // console.log(zonepolys.active);
    zonepolys.active = {visible: keepvisible.concat(toshow), hidden: keephidden.concat(tohide)};
  }

  document.getElementById('datefield').valueAsDate = DATE;

  $('.clockpicker').clockpicker({
    placement: 'bottom',
    align: 'right'
  });

  $("#permit_b").click(function(){   
      $("#permitname").attr('disabled', !this.checked)
  });

  $('#NewSignForm').submit(function(e) {
    e.preventDefault();
    var center = NEWSIGNMAP.getCenter();
    var formdata = $(this).serialize();
    GEOCODER.geocode({location: center.toJSON()}, function(results) {
      var data = {'location': results[0], 'form': formdata};
      console.log(data);
      $.post("./new/", data, function(response) {
        alert(response.message);
      });
    });
    toggleAddSign();
  });

  $("#autoaddress").keyup( function(event){
    if(event.keyCode == 13) {
      GEOCODER.geocode({address: this.value}, function(results) {
        CENTERPIN.setPosition(results[0].geometry.location.toJSON());
        GOOGLEMAP.setCenter(results[0].geometry.location.toJSON());
      });
    }
  });
};




function initMap() {
  GOOGLEMAP = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 34.089557, lng: -118.358198},
    zoom: 19,
    clickableIcons: false,
    zoomControl: false,
    streetViewControl: false,
    mapTypeControl: false,
    styles: mapstyle,
    scaleControl: true,
  });


  DIRECTIONS = new google.maps.DirectionsService;
  GEOCODER = new google.maps.Geocoder;

  AUTOCOMPLETE = new google.maps.places.Autocomplete(
      (document.getElementById('autoaddress')),
      {types: ['geocode']}
  );
  
  var iconBase = 'http://maps.google.com/mapfiles/kml/pal4/';
  var signsicons = {
    caution: {
      icon: iconBase + 'icon31.png'
    },
    good: {
      icon: iconBase + 'icon62.png'
    },
    bad: {
      icon: iconBase + 'icon15.png'
    }
  };

  CENTERPIN = new google.maps.Marker({
      position: GOOGLEMAP.getCenter(),
      map: GOOGLEMAP,
      animation: google.maps.Animation.DROP,
    });



  function addSignMarker(origin, imgurl, title, visible) {
    var feature = {
      position: new google.maps.LatLng(origin['lat'],origin['lng']),
      type: 'caution',
      img: imgurl,
      title: title,
      vis: visible
    }; 

    var marker = new google.maps.Marker({
      position: feature.position,
      icon: signsicons[feature.type].icon,
      map: GOOGLEMAP,
      title: feature.title,
      visible: feature.vis
    });
    var infowindow = new google.maps.InfoWindow({
      content: '<img style="height:250px;" src="'+feature.img+'">'
    });
      marker.addListener('click', function() {
      infowindow.open(GOOGLEMAP, marker);
    });
    return marker;
  }

  

  google.maps.event.addListenerOnce(GOOGLEMAP, 'idle', function(){
    var postdata = GOOGLEMAP.getBounds().toJSON();
    postdata['date'] = Date.now();
    $.ajax({
      type:"POST",
      url:"./start/",
      data: postdata,
      success: function(response){

        for (var signid in response) {
          var sign = response[signid];
          var zones = sign['z'];
          var times = sign['t']['t'];
          var visible = false;

          for (var t in times) {
            if (isSignVisible(HOURMIN, parseInt(times[t].s), parseInt(times[t].e))) {
              visible = true;
              break;
            }
          }
          
          var signMarker = addSignMarker(sign['c'], sign['i'], sign['r'], visible);

          var tempzones = [];
          for (var zone in zones) {
            var d = zones[zone]['d'];
            var poly = makeNewPoly(zones[zone]['c'], d['s'], d['f'], visible);
            tempzones.push(poly);
            poly.setMap(GOOGLEMAP); 
          }
          var tempsign = {'sign': {'marker': signMarker, 'json':sign}, 'zones': tempzones};
          if (visible) {
            zonepolys.active.visible.push(tempsign);
          }
          else {
            zonepolys.active.hidden.push(tempsign);
          }
        }
      }
    });

    google.maps.event.addListener(AUTOCOMPLETE, 'place_changed', function () {
      GEOCODER.geocode({address: AUTOCOMPLETE.getPlace().formatted_address}, function(results) {        
        CENTERPIN.setPosition(AUTOCOMPLETE.getPlace().geometry.location.toJSON());
        GOOGLEMAP.setCenter(AUTOCOMPLETE.getPlace().geometry.location.toJSON());      
      });
    });

  });

  
  GOOGLEMAP.controls[google.maps.ControlPosition.TOP_LEFT].push(document.getElementById('AddressBar'));
  GOOGLEMAP.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(document.getElementById('DateTimeBar'));
  GOOGLEMAP.controls[google.maps.ControlPosition.TOP_RIGHT].push(document.getElementById('AddSign'));

};