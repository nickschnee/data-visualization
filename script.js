const APP_ID = "publibikeapp-qkuoe"; // Replace with your Realm App ID

const app = new Realm.App(APP_ID);

// Global variable to hold the map instance
let map;
// Global variable to hold the heatmap layer instance
let heatmapLayer;
// Global variable to hold the markers layer instance
let markersLayer;

// Initialize the map when the page loads
window.onload = function () {
  map = L.map("vehicleMap").setView([46.948, 7.4474], 13); // Set view to Bern's coordinates and zoom level 13
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

  // Initialize empty layers for heatmap and markers
  heatmapLayer = new HeatmapOverlay({
    radius: 0.005,
    maxOpacity: 0.8,
    scaleRadius: true,
    useLocalExtrema: false,
    latField: "lat",
    lngField: "lng",
    valueField: "value",
  });
  markersLayer = L.layerGroup().addTo(map);

  // Call fetchHeatmap with the default value
  fetchHeatmap(0);

  document.getElementById("timeSlider").addEventListener("input", (event) => {
    const stepsBackInTime = 143 - event.target.value;
    fetchHeatmap(stepsBackInTime);
    console.log("stepsBack", stepsBackInTime);
  });

  document.getElementById('toggleMarkersButton').addEventListener('click', toggleMarkers);

};

function toggleMarkers() {
  if (map.hasLayer(markersLayer)) {
    map.removeLayer(markersLayer);
  } else {
    map.addLayer(markersLayer);
  }
}

function roundToNearestTenMinutes(date) {
  let minutes = date.getMinutes();
  let remainder = minutes % 10;
  date.setMinutes(minutes - remainder);
  date.setSeconds(0);
  date.setMilliseconds(0);
  return date;
}

function formatDateTime(targetTime){

  const dateOptions = { year: "numeric", month: "long", day: "numeric" };
  const timeOptions = { hour: "2-digit", minute: "2-digit" };

  const formattedDate = targetTime.toLocaleDateString(undefined, dateOptions);
  const formattedTime = targetTime.toLocaleTimeString(undefined, timeOptions);

  return `${formattedDate}, ${formattedTime}`;

}

async function fetchHeatmap(stepsBackInTime) {
  const interval = stepsBackInTime * 10 * 60 * 1000; // Convert steps to milliseconds
  const currentTime = Date.now();
  let targetTime = new Date(currentTime - interval);
  targetTime = roundToNearestTenMinutes(targetTime);

  const stepTimeElement = document.querySelector(".stepTime");
  stepTimeElement.textContent = formatDateTime(targetTime);

  console.log(targetTime);

  // Get a MongoDB service client
  const mongodb = app.currentUser.mongoClient("mongodb-atlas");

  // Get the database and collection
  const db = mongodb.db("PublibikeDB");
  const stationsCollection = db.collection("BikesPerStation");

  const pipeline = [
    {
      $match: {
        "network.name": "Bern",
        timestamp: {
          $gte: new Date(targetTime),
          $lt: new Date(targetTime.getTime() + 10 * 60 * 1000),
        },
      },
    },
    {
      $sort: { name: 1, timestamp: -1 },
    },
    {
      $group: {
        _id: "$name",
        latitude: { $first: "$latitude" },
        longitude: { $first: "$longitude" },
        lastVehicleCount: { $first: "$bikes" },
        lastTimeStamp: { $first: "$timestamp" },
        stationName: { $first: "$name" },
      },
    },
    {
      $project: {
        _id: 0,
        stationName: 1,
        latitude: 1,
        longitude: 1,
        lastVehicleCount: 1,
        lastTimeStamp: 1,
      },
    },
  ];

  // Execute the aggregation
  const stations = await stationsCollection.aggregate(pipeline);
  console.log(stations);

  // Prepare data for heatmap
  let heatmapData = stations.map((station) => {
    return {
      lat: station.latitude,
      lng: station.longitude,
      value: station.lastVehicleCount,
    };
  });

  // Initialize and configure the heatmap
  const cfg = {
    radius: 0.005,
    maxOpacity: 0.8,
    scaleRadius: true,
    useLocalExtrema: false,
    latField: "lat",
    lngField: "lng",
    valueField: "value",
  };

  // Update heatmap data
  heatmapLayer.setData({
    max: 30,
    data: heatmapData,
  });

  // Ensure heatmap layer is added to the map
  heatmapLayer.addTo(map);

  if (map.hasLayer(markersLayer)) {
    updateMarkers(stations);
  }
  
}

function updateMarkers(stations) {
  // Clear existing markers
  markersLayer.clearLayers();
  
  // Create new markers
  let markers = [];
  stations.forEach((station) => {
    const marker = L.marker([station.latitude, station.longitude], {
      title: station.stationName,
    });
    const popupContent = `
      <strong>${station.stationName}</strong> <br>
      ${station.lastVehicleCount} Bikes <br>
       ${new Date(station.lastTimeStamp).toLocaleString()}
    `;
    marker.bindPopup(popupContent);
    markers.push(marker);
  });

  // Update markersLayer and add it to the map
  markersLayer = L.layerGroup(markers).addTo(map);

}