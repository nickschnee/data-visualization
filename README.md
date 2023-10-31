# Data Visualization

## Folder Example Connector

Example for an anonymous connector to MongoDB Atlas to read from the Database.

To make this work with your own App, replace the following values in `mongo_connector.js`:

```javascript
const APP_ID = "<your Realm app ID here>"; // e.g. myapp-abcde
const db = "<your Atlas database name here>"; // e.g. publibike
const stationsCollection = "<your Atlas collection name here>"; // e.g. bikes
```

## Folder Example Leaflet

A Leaflet map with datapoints (Bike Stations) from our database.

## Folder Project Heatmap

The final project showing the heatmap with current bike usage data and the pipeline to go back in time.

## Folder Server

Server Side Code which is run as a Realm Function inside MongoDB Atlas.

