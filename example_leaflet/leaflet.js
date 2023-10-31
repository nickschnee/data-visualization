const APP_ID = "publibikeapp-qkuoe"; // Replace with your Realm App ID
const app = new Realm.App(APP_ID);

let map;
let markersLayer;

window.onload = function () {
    map = L.map("vehicleMap").setView([46.948, 7.4474], 13); 
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
    markersLayer = L.layerGroup().addTo(map);

    fetchStationsAndDisplayMarkers();
};

async function fetchStationsAndDisplayMarkers() {
    const user = await app.logIn(Realm.Credentials.anonymous());
    if (!app.currentUser) {
        console.error("User not authenticated");
        return;
    }

    const mongodb = app.currentUser.mongoClient("mongodb-atlas");
    const db = mongodb.db("PublibikeDB");
    const stationsCollection = db.collection("BikesPerStation");

    const pipeline = [
        {
            $group: {
                _id: "$name",
                latitude: { $first: "$latitude" },
                longitude: { $first: "$longitude" },
                stationName: { $first: "$name" },
            },
        },
        {
            $project: {
                _id: 0,
                stationName: 1,
                latitude: 1,
                longitude: 1,
            },
        },
    ];

    const stations = await stationsCollection.aggregate(pipeline);
    displayMarkers(stations);
}

function displayMarkers(stations) {
    markersLayer.clearLayers();

    stations.forEach((station) => {
        const marker = L.marker([station.latitude, station.longitude], {
            title: station.stationName,
        });
        marker.bindPopup(`<strong>${station.stationName}</strong>`);
        marker.addTo(markersLayer);
    });
}
