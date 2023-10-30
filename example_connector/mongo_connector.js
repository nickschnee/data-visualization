const APP_ID = "publibikeapp-qkuoe"; // Replace with your Realm App ID

const app = new Realm.App(APP_ID);

async function getData() {
  
    // Log in using anonymous authentication
    const user = await app.logIn(Realm.Credentials.anonymous());
  
    // // Ensure the user has logged in
    // if (!app.currentUser) {
    //   console.error("User not authenticated");
    //   return;
    // }
  
    // Get a MongoDB service client
    const mongodb = app.currentUser.mongoClient("mongodb-atlas");
  
    // Get the database and collection
    const db = mongodb.db("PublibikeDB");
    const stationsCollection = db.collection("BikesPerStation");
  
    const pipeline = [
      {
        $match: {
          "name": "Bärenpark",
        },
      },
      {
        $sort: { timestamp: -1 },
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

  }

  getData();