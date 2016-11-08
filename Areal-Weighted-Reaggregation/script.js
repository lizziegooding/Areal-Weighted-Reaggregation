// Sandbox for Areal-Weighted-Reaggregation
// $(document).ready(function() {
  mapboxgl.accessToken = 'pk.eyJ1IjoibGl6emllZ29vZGluZyIsImEiOiJjaW92cmc1NHYwMWJsdW9tOHowdTA2cnFsIn0.lFq-Wju99kZ_dR_2TMBYCQ';

  // Create a new Mapbox GL Map object
  var map = new mapboxgl.Map({
    container: 'map', // container id
    style: 'mapbox://styles/mapbox/satellite-v9', //hosted style, satellite
    center: [-91.874, 42.760], // starting position
    zoom: 8 // starting zoom
  });

  map.on('load', function() {

    map.addSource('counties', {
      type: 'vector',
      url: 'mapbox://lizziegooding.7ysestm0'
    });

    map.addLayer({
      'id': 'counties',
      'type': 'fill',
      //Name of vector tiles from .addSource method above
      'source': 'counties',
      //Name of vector tiles uploaded to Mapbox Tileset
      'source-layer': 'County_2010Census_DP1-d3qmd4',
      'paint': {
        'fill-outline-color': 'white',
        'fill-color': 'rgba(0,0,0,0.1)'
      }
    });

    map.addLayer({
      'id': 'counties-highlighted',
      'type': 'fill',
      //Name of vector tiles from .addSource method above
      'source': 'counties',
      //Name of vector tiles uploaded to Mapbox Tileset
      'source-layer': 'County_2010Census_DP1-d3qmd4',
      'paint': {
        'fill-outline-color': 'white',
        'fill-color': '#6e599f',
        'fill-opacity': 0.75
      },
      //Use a filter to hide all features in this layer on load
      'filter': ['in', 'COUNTY', '']
    });

  }); // End map.on(load)

//Get coordinates of mouse pointer
  map.on('mousemove', function (e) {
    document.getElementById('info').innerHTML =
      // e.point is the x, y coordinates of the mousemove event relative
      // to the top-left corner of the map
      JSON.stringify(e.point) + '<br/>' +
      // e.lngLat is the longitude, latitude geographical position of the event
      JSON.stringify(e.lngLat);
  });
  // Create a new Mapbox GL draw object-- needs to be outside map.on(load) function to work
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

  //Allow user to toggle editing mode
  var $editButtons = $('.edit');
  $editButtons.on('click', function(){
    $editButtons.toggle();
    if ($editButtons.first().is(':visible')){
      console.log('Change mode, static');
      draw.changeMode('static', createOptions());
    } else {
      console.log('Change mode, simple select');
      draw.changeMode('simple_select', createOptions());
    }
  });

  //Calculate area of selected features
  var $calcButton = $('#calculate');
  $calcButton.on('click', function() {
    //Get all vertices from draw object TODO: check
    var data = draw.getSelected();
    //If user has drawn a feature...
    if (data.features.length > 0 && draw.getMode() != 'static') {
      //Use Turf to calculate feature area
      var area = turf.area(data);
      // restrict to area to 2 decimal points
      var roundedArea = Math.round(area * 100) / 100;
      var $answer = $('#calculated-area');
      $answer.html('<p><strong>' + roundedArea + '</strong></p><p>square meters</p>');

    //Else, ask user to draw a feature
    } else {
      alert('Use the draw tools to draw a polygon or toggle editing mode to select a feature.');
    }
  });

  //Create an options object to pass to the .changeMode method as an argument
  function createOptions() {
    var features = draw.getAll().features;
    var options = {};
    if (features.length === 1) {
      options.featureId = features[0].id;
    }
    else if (features.length > 1){
      var arr = [];
      for (var ii = 0; ii < features.length; ii++){
        arr.push(features[ii].id);
      }
      options.featureIds = arr;
    }
    else {
      alert('Use the draw tools to draw a polygon!');
    }
    return options;
  }

//Calculate intersect of two draw polygons
  //NOTE: right now this will only work once; have to create unique layer ids to calculate intersects multiple times
  // $('#intersect').on('click', function() {
  //   //Calculate intersect
  //   var intersect = turf.intersect(draw.getAll().features[0], draw.getAll().features[1]);
  //   console.log('Calculated intersect');
  //   // console.log(intersect);
  //
  //   //Add returned polygon intersect to map as a draw feature
  //   // var intersectId = draw.add(intersect);
  //
  //   //Add returned polygon intersect to map as a layer
  //   map.addSource('intersect', {
  //     'type': 'geojson',
  //     'data': intersect
  //   });
  //   map.addLayer({
  //     'id': 'intersect',
  //     'type': 'fill',
  //     'source': 'intersect',
  //     'layout': {},
  //     'paint': {
  //       'fill-color': '#088',
  //       'fill-opacity': 0.8
  //     }
  //   });
  // });

  //NOTE: Turf.intersect only works with two polygon features, not a feauture collection unlike ArcGIS or QGIS
  $('#intersectLayers').on('click', function() {
    //Query counties layer for all features within viewport; returns an array of those features
    //TODO: filter to only features which overlap draw geometry
    //Retrieve first polygon user draws
    var drawnPoly = draw.getAll().features[0];
    //Draw a rectangle envelope around verticies of drawn polygon
    var envelope = turf.envelope(drawnPoly);
    //Add the envelope to the map as a drawn feature
    draw.add(envelope);
    //Convert envelope vertices to pixel space
    var sw = map.project(envelope.geometry.coordinates[0][0]);
    var ne = map.project(envelope.geometry.coordinates[0][2]);
    console.log('sw in pixels: ', sw);
    console.log('ne in pixels: ', ne);

    // var envelopeLatLong = [envelope.geometry.coordinates[0][0], envelope.geometry.coordinates[0][2]];
    // console.log(envelope);
    // console.log('Envelope coordinates: ', envelopeLatLong);

    //Query rendered features by location in the counties la yer which intersect the user-drawn polygon-- NOTE: need to use canvas x y rather than lat long coordinates
    var overlapCounties = map.queryRenderedFeatures([sw, ne], {layers: ['counties']});

    console.log('overlapCounties: ', overlapCounties);

    //Add the type property 'feature' to all queries counties
    for (var jj = 0; jj < overlapCounties.length; jj++){
      overlapCounties[jj].type = 'Feature';
      draw.add(overlapCounties[jj]);
    }

    // Find unique counties which intersect drawn polygon envelope
    if (overlapCounties){
      var uniqueCounties = getUniqueFeatures(overlapCounties, 'GEOID10');
    }

    //Filter county highlighted layer to show counties which intersect envelope NOTE: will need to change this to only counties which intersect drawn polygon
    var filter = uniqueCounties.reduce(function(memo, feature) {
      memo.push(feature.properties.GEOID10);
      return memo;
    }, ['in', 'GEOID10']);
    console.log('filter: ', filter);

    map.setFilter('counties-highlighted', filter);

    //Loop through array of queried features and perform an intersect on each-- equivalent to a pairwise intersect
    // NOTE From Mapbox: Because features come from tiled vector data, feature geometries may be split or duplicated across tile boundaries and, as a result, features may appear multiple times in query results.
    var countyArr = [];
    var countyArrIntersect = [];

    for (var ii = 0; ii < uniqueCounties.length; ii++){
      countyArr.push(uniqueCounties[ii].properties.GEOID10);
      var intersect = turf.intersect(drawnPoly, uniqueCounties[ii]);
      if (intersect) {
        draw.add(intersect);
        countyArrIntersect.push(uniqueCounties[ii].properties.GEOID10);
      }
    }
    console.log('Calculated layer intersect');
    console.log('Counties in view: ', countyArr);
    console.log('Intersected counties', countyArrIntersect);
    console.log('Unique counties', uniqueCounties);

  });

  function getUniqueFeatures(array, comparatorProperty) {
    var existingFeatureKeys = {};
    // Because features come from tiled vector data, feature geometries may be split
    // or duplicated across tile boundaries and, as a result, features may appear
    // multiple times in query results.
    var uniqueFeatures = array.filter(function(el) {
      if (existingFeatureKeys[el.properties[comparatorProperty]]) {
        return false;
      } else {
        existingFeatureKeys[el.properties[comparatorProperty]] = true;
        return true;
      }
    });

    return uniqueFeatures;
  }
