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
    //Customize controls to display
    displayControlsDefault: false,
    controls: {
      polygon: true,
      trash: true,
      combine_features: true,
      uncombine_features: true
    }
  });
  //TODO: Look up add control method-- also used with directions api
  map.addControl(draw);

  var $editButton = $('#edit');
  $editButton.on('click', function(){
    draw.modes.DIRECT_SELECT === 'direct_select';
  });

  var $calcButton = $('#calculate');
  $calcButton.on('click', function() {
    //Get all vertices from draw object TODO: check
    var data = draw.getAll();
    //If user has drawn a feature...
    if (data.features.length > 0) {
      //Use Turf to calculate feature area
      var area = turf.area(data);
      // restrict to area to 2 decimal points
      var roundedArea = Math.round(area * 100) / 100;
      var $answer = $('#calculated-area');
      $answer.html('<p><strong>' + roundedArea + '</strong></p><p>square meters</p>');

    //Else, ask user to draw a feature
    } else {
      alert('Use the draw tools to draw a polygon!');
    }
  });
});
