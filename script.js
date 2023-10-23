const APP_ID = 'publibikeapp-qkuoe';  // Replace with your Realm App ID

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
  const mongodb = app.currentUser.mongoClient('mongodb-atlas');  // Use app.currentUser.mongoClient
  
  // Get the database and collection
  const db = mongodb.db('PublibikeDB');
  const stationsCollection = db.collection('Stations');

  // Query the collection
  const stations = await stationsCollection.find({});
  
  console.log(stations);
}

fetchStations();

