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
  const stationsCollection = db.collection("Stations");

  const pipeline = [
    {
        $lookup: {
            from: "StationStatus",
            localField: "id",
            foreignField: "stationId",
            as: "status"
        }
    },
    {
        $match: { "status.network.name": "Bern" }
    },
    {
        $unwind: "$status"
    },
    {
        $sort: { "status.timestamp": -1 }  // Sort by timestamp in descending order
    },
    {
        $group: {
            _id: "$id",
            latitude: { $first: "$latitude" },
            longitude: { $first: "$longitude" },
            vehicleCounts: {
                $push: { 
                    $size: { $ifNull: ["$status.vehicles", []] }
                }
            },
            timestamps: {
                $push: "$status.timestamp"
            },
            stationName: { $first: "$status.name" }
        }
    },
    {
        $project: {
            _id: 0,
            stationId: "$_id",
            latitude: 1,
            longitude: 1,
            stationName: 1,
            last10VehicleCounts: { $slice: ["$vehicleCounts", 10] },
            last10Timestamps: { $slice: ["$timestamps", 10] }
        }
    }
];






// Execute the aggregation
const stations = await stationsCollection.aggregate(pipeline);

console.log(stations);
}

fetchStations();

console.log("Hello World");