// Sandbox for Areal-Weighted-Reaggregation
$(document).ready(function() {
  mapboxgl.accessToken = 'pk.eyJ1IjoibGl6emllZ29vZGluZyIsImEiOiJjaW92cmc1NHYwMWJsdW9tOHowdTA2cnFsIn0.lFq-Wju99kZ_dR_2TMBYCQ';

  // Create a new Mapbox GL Map object
  var map = new mapboxgl.Map({
    container: 'map', // container id
    style: 'mapbox://styles/mapbox/satellite-v9', //hosted style, satellite
    center: [-91.874, 42.760], // starting position
    zoom: 12 // starting zoom
  });

  // Create a new Mapbox GL draw object
  var draw = mapboxgl.Draw({
    drawing: true,
    displayControlsDefault: false,
    controls: {
      polygon: true,
      trash: true
    }
  });
  map.addControl(draw);

  var calcButton = document.getElementById('calculate');
  calcButton.onclick = function() {
    var data = draw.getAll();
    if (data.features.length > 0) {
      var area = turf.area(data);
      // restrict to area to 2 decimal points
      var rounded_area = Math.round(area * 100) / 100;
      var answer = document.getElementById('calculated-area');
      answer.innerHTML = '<p><strong>' + rounded_area + '</strong></p><p>square meters</p>';
    } else {
      alert('Use the draw tools to draw a polygon!');
    }
  };
});
