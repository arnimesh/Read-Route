
    mapboxgl.accessToken = 'pk.eyJ1IjoiYXJuaW1lc2giLCJhIjoiY2tsMGdzbTBrMDUzeDMwdDdhYWh3cmpiYiJ9.grLkLsC9GCG5vcQaNgFZ1Q';
  
    navigator.geolocation.getCurrentPosition(successLocation, errorLocation, {
      enableHighAccuracy: true
    })
 
    var center=[77.2300, 28.660];
    function successLocation(position) {
      center[0]=position.coords.longitude,
      center[1]=position.coords.latitude
    }
   
    function errorLocation() {
    center=center;
    }
    
    
    var map = new mapboxgl.Map({
      container: 'map', // container id
      style: 'mapbox://styles/mapbox/light-v10',
      center: center, // starting position
      zoom: 10 // starting zoom
    });
    const nav = new mapboxgl.NavigationControl()
    map.addControl(nav)

    console.log(campgrounds);


    var directions = new MapboxDirections({
      accessToken: mapboxgl.accessToken,
      unit: 'metric',
      profile: 'mapbox/driving',
      alternatives: 'true',
      geometries: 'geojson'
    });
    map.addControl(
  new mapboxgl.GeolocateControl({
  positionOptions: {
  enableHighAccuracy: true
  },
  trackUserLocation: true
  })
  );
    map.scrollZoom.enable();
    map.addControl(directions, 'top-left');
 
    var gj = {
    "name":"MyFeatureType",
    "type":"FeatureCollection",
    "features":[]
};
 var n=campgrounds.features.length;
   for(var i=0;i<n;i++)
   {
    var cnt=campgrounds.features[i].likes.length;
     //if(cnt>15)continue;
    gj.features.push({ "type": "Feature","geometry": {"type": "Point","coordinates": []},"properties": campgrounds.features[i].properties });

    var lon=campgrounds.features[i].geometry.coordinates[0];
    var lat=campgrounds.features[i].geometry.coordinates[1];
gj.features[i].geometry.coordinates.push(lon,lat);
        }
   

console.log("hii");
console.log(gj);


    var obstacle = turf.buffer(gj, 0.25, { units: 'kilometers' });

    map.on('load', function (e) {
      map.addSource('gj', {
type: 'geojson',
// Point to GeoJSON data. This example visualizes all M1.0+ gj
// from 12/22/15 to 1/21/16 as logged by USGS' Earthquake hazards program.
data:gj,
cluster: true,
clusterMaxZoom: 14, // Max zoom to cluster points on
clusterRadius: 50 // Radius of each cluster when clustering points (defaults to 50)
});

map.addLayer({
id: 'clusters',
type: 'circle',
source: 'gj',
filter: ['has', 'point_count'],
paint: {
// Use step expressions (https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-step)
// with three steps to implement three types of circles:
//   * Blue, 20px circles when point count is less than 100
//   * Yellow, 30px circles when point count is between 100 and 750
//   * Pink, 40px circles when point count is greater than or equal to 750
'circle-color': [
'step',
['get', 'point_count'],
'#c91e3e',
20,
'#f1f075',
50,
'#f28cb1'
],
'circle-radius': [
'step',
['get', 'point_count'],
20,
20,
30,
50,
40
]
}
});

map.addLayer({
id: 'cluster-count',
type: 'symbol',
source: 'gj',
filter: ['has', 'point_count'],
layout: {
'text-field': '{point_count_abbreviated}',
'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
'text-size': 12
}
});

map.addLayer({
id: 'unclustered-point',
type: 'circle',
source: 'gj',
filter: ['!', ['has', 'point_count']],
paint: {
'circle-color': '#11b4da',
'circle-radius': 4,
'circle-stroke-width': 1,
'circle-stroke-color': '#fff'
}
});

      //Create sources and layers for the returned routes.
      //There will be a maximum of 3 results from the Directions API.
      //We use a loop to create the sources and layers.
     
 map.on('click', 'clusters', function (e) {
var features = map.queryRenderedFeatures(e.point, {
layers: ['clusters']
});
var clusterId = features[0].properties.cluster_id;
map.getSource('gj').getClusterExpansionZoom(
clusterId,
function (err, zoom) {
if (err) return;

map.easeTo({
center: features[0].geometry.coordinates,
zoom: zoom
});
}
);
});

// When a click event occurs on a feature in
// the unclustered-point layer, open a popup at
// the location of the feature, with
// description HTML from its properties.
map.on('click', 'unclustered-point', function (e) {
  const text = e.features[0].properties.popUpMarkup;
const coordinates = e.features[0].geometry.coordinates.slice();


// Ensure that if the map is zoomed out such that
// multiple copies of the feature are visible, the
// popup appears over the copy being pointed to.
while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
}

new mapboxgl.Popup()
.setLngLat(coordinates)
.setHTML(
 text
)
.addTo(map);
});

map.on('mouseenter', 'clusters', function () {
map.getCanvas().style.cursor = 'pointer';
});
map.on('mouseleave', 'clusters', function () {
map.getCanvas().style.cursor = '';
});
for (i = 0; i <= 2; i++) {
        map.addSource('route' + i, {
          type: 'geojson',
          data: {
            'type': 'Feature',
          }
        });

        map.addLayer({
          id: 'route' + i,
          type: 'line',
          source: 'route' + i,
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#cccccc',
            'line-opacity': 0.5,
            'line-width': 13,
            'line-blur': 0.5
          }
        });
      }
    });
    directions.on('route', (e) => {
      var reports = document.getElementById('reports');
      reports.innerHTML = '';
      var report = reports.appendChild(document.createElement('div'));
      let routes = e.route;

      //Hide all routes by setting the opacity to zero.
      for (i = 0; i < 3; i++) {
        map.setLayoutProperty('route' + i, 'visibility', 'none');
      }

      routes.forEach(function (route, i) {
        route.id = i;
      });

      routes.forEach((e) => {
        //Make each route visible, by setting the opacity to 50%.
        map.setLayoutProperty('route' + e.id, 'visibility', 'visible');

        //Get GeoJson LineString feature of route
        var routeLine = polyline.toGeoJSON(e.geometry);

        //Update the data for the route, updating the visual.
        map.getSource('route' + e.id).setData(routeLine);

        var collision = '';
        var emoji = '';
        var clear = turf.booleanDisjoint(obstacle, routeLine);

        if (clear == true) {
          collision = 'is good!';
          detail = 'does not go';
          emoji = '✔️';
          report.className = 'item';
          map.setPaintProperty('route' + e.id, 'line-color', '#74c476');
        } else {
          collision = 'is bad.';
          detail = 'goes';
          emoji = '⚠️';
          report.className = 'item warning';
          map.setPaintProperty('route' + e.id, 'line-color', '#de2d26');
        }

        //Add a new report section to the sidebar.
        // Assign a unique `id` to the report.
        report.id = 'report-' + e.id;

        // Add the response to the individual report created above.
        var heading = report.appendChild(document.createElement('h3'));

        // Set the class type based on clear value.
        if (clear == true) {
          heading.className = 'title';
        } else {
          heading.className = 'warning';
        }

        heading.innerHTML = emoji + ' Route ' + (e.id + 1) + ' ' + collision;

        // Add details to the individual report.
        var details = report.appendChild(document.createElement('div'));
        details.innerHTML =
          'This route ' + detail + ' through an avoidance area.';
        report.appendChild(document.createElement('hr'));
      });
    });
  