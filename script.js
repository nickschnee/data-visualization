const APP_ID = "publibikeapp-qkuoe"; // Replace with your Realm App ID

const app = new Realm.App(APP_ID);

async function fetchHeatmap() {
  // Get a MongoDB service client
  const mongodb = app.currentUser.mongoClient("mongodb-atlas");

  // Get the database and collection
  const db = mongodb.db("PublibikeDB");
  const stationsCollection = db.collection("BikesPerStation");

  const pipeline = [
    {
      $match: { "network.name": "Bern" },
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

  // After fetching the stations data, initialize the map
  const map = L.map("vehicleMap").setView([46.948, 7.4474], 13); // Set view to Bern's coordinates and zoom level 13

  // Add a map layer
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

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

  const heatmapLayer = new HeatmapOverlay(cfg);
  heatmapLayer.setData({
    max: 30,
    data: heatmapData,
  });

  // Add the heatmap layer to the map
  map.addLayer(heatmapLayer);

  // Create an array to hold the markers
  let markers = [];

  // Loop through the stations data and create a marker for each station
  stations.forEach((station) => {
    const marker = L.marker([station.latitude, station.longitude], {
      title: station.stationName, // Optional: add a title that will be displayed on hover
    });
    const popupContent = `
      <strong>${station.stationName}</strong> <br>
      ${station.lastVehicleCount} Bikes <br>
       ${new Date(
        station.lastTimeStamp
      ).toLocaleString()} 
  `;
    marker.bindPopup(popupContent);
    markers.push(marker);
  });

  // Create a layer group from the markers array and add it to the map
  const markersLayer = L.layerGroup(markers);
  map.addLayer(markersLayer);
}

fetchHeatmap();

console.log("Hello World");
