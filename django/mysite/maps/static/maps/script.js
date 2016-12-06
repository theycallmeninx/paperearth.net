/*jslint node: true */
"use strict";


var DATE = new Date();
var GOOGLEMAP;
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
    if (!isSignVisible(hourtime, poly.sign.json.s, poly.sign.json.e)) {
      tohide.push(poly);
      poly.sign.marker.setVisible(false);
      for (var zone in poly.zones) {
        poly.zones[zone].setVisible(false);
        // console.log(zone);
      }
    }
  }

  for (var index in zonepolys.active.hidden) {
    poly = zonepolys.active.hidden[index];
    if (isSignVisible(hourtime, poly.sign.json.s, poly.sign.json.e)) {
      toshow.push(poly);      
      poly.sign.marker.setVisible(true);
      for (var zone in poly.zones) {
        poly.zones[zone].setVisible(true);
        // console.log(zone);
      }
    }
  }

/*  console.log("Show: "+toshow);
  console.log("Hide: "+tohide);*/

  //  console.log("Visible: "+zonepolys.active.visible);
  // console.log("Hidden: "+zonepolys.active.hidden);

  var keepvisible = [];
  if (zonepolys.active.visible.length > 0) {
    keepvisible = zonepolys.active.visible.filter( function (sign)
    {
      return (isSignVisible(hourtime, sign.sign.json.s, sign.sign.json.e));
    });
  }

  var keephidden = [];
  if (zonepolys.active.hidden.length > 0) {
    keephidden = zonepolys.active.hidden.filter( function (sign)
    {
      return !(isSignVisible(hourtime, sign.sign.json.s, sign.sign.json.e));
    });
  }

  zonepolys.active = {visible: keepvisible.concat(toshow), hidden: keephidden.concat(tohide)};
  // console.log(zonepolys);
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





function toggleAddSign() {
  $('#MapContainer').slideToggle("slow");
  $('#AddSignContainer').slideToggle("slow");
};



window.onload = function() {

  document.getElementById('datefield').valueAsDate = DATE;

  $('#NewSignForm').submit(function(e) {
    $.post("./new/", $(this).serialize(), function(response) {
      alert(response.message);
    });
    e.preventDefault();
    toggleAddSign();
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

  function addMarker(origin, imgurl, title, visible) {
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

          var visible = isSignVisible(HOURMIN, parseInt(sign['s']), parseInt(sign['e']));
          var signMarker = addMarker(sign['c'], sign['i'], sign['r'], visible);

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
  });

  GOOGLEMAP.controls[google.maps.ControlPosition.TOP_LEFT].push(document.getElementById('AddressBar'));
  GOOGLEMAP.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(document.getElementById('MapControls'));
  GOOGLEMAP.controls[google.maps.ControlPosition.TOP_RIGHT].push(document.getElementById('AddSign'));

};