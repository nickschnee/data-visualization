exports = async function() {
    const serviceName = "mongodb-atlas";
    const dbName = "PublibikeDB";
    const stationStatusColl = context.services.get(serviceName).db(dbName).collection("BikesPerStation");

    try {
        // Fetch the data from the new endpoint
        const apiResponse = await context.http.get({ url: "https://api.publibike.ch/v1/public/partner/stations" });
        const data = JSON.parse(apiResponse.body.text());

        if (!data.stations) {
            console.warn("The fetched data does not contain 'stations'. Aborting.");
            return { status: "Aborted. No 'stations' in the fetched data." };
        }

        // Filter and enrich the stations array based on the 'Bern' network and add 'timestamp' and 'bikes' fields
        const enrichedStations = data.stations
            .filter(station => station.network && station.network.name === "Bern")
            .map(station => {
                const totalBikes = station.vehicles ? station.vehicles.length : 0;
                return {
                    ...station,
                    timestamp: new Date(),
                    bikes: totalBikes
                };
            });

        // Insert the enriched stations data into the BikesPerStation collection
        await stationStatusColl.insertMany(enrichedStations);

        return { status: `Successfully inserted ${enrichedStations.length} stations from Bern into the BikesPerStation collection.` };

    } catch (error) {
        console.error("Error occurred:", error);
        return { status: "Error occurred while fetching or inserting data." };
    }
};
