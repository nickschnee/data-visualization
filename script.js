const APP_ID = "publibikeapp-qkuoe"; // Replace with your Realm App ID

const app = new Realm.App(APP_ID);

async function fetchStations() {
  // Log in using anonymous authentication
  const user = await app.logIn(Realm.Credentials.anonymous());

  // Ensure the user has logged in
  if (!app.currentUser) {
    console.error("User not authenticated");
    return;
  }

  // Get a MongoDB service client
  const mongodb = app.currentUser.mongoClient("mongodb-atlas"); // Use app.currentUser.mongoClient

  // Get the database and collection
  const db = mongodb.db("PublibikeDB");
  const stationsCollection = db.collection("BikesPerStation"); // Use the BikesPerStation collection

  const pipeline = [
    {
      $match: { "network.name": "Bern" }, // Filter where network name is Bern
    },
    {
      $sort: { name: 1, timestamp: -1 }, // Sort by name in ascending order and timestamp in descending order
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

  // After fetching the stations data, initialize the map and plot the stations
  const map = L.map("vehicleMap").setView([46.948, 7.4474], 13); // Set view to Bern's coordinates and zoom level 13

  // Add a map layer
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

  // Loop through the stations and plot them on the map
  for (const station of stations) {
    L.marker([station.latitude, station.longitude])
      .addTo(map)
      .bindPopup(
        station.stationName + "<br>Vehicles: " + station.lastVehicleCount
      ); // Displaying the most recent vehicle count in the popup
  }
}

fetchStations();
console.log("Hello World");
