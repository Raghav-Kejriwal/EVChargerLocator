import { OlaMaps } from 'olamaps-web-sdk';

document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
        window.location.href = "auth.html";
        return;
    }

    const welcomeText = document.getElementById("welcome-text");
    welcomeText.textContent = `Hello, ${user.username || 'Guest'}`;

    const logoutBtn = document.querySelector(".logout-btn");
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("user");
        window.location.href = "auth.html";
    });

    // ✅ Replace with your actual API key
    const apiKey = ""

    const olaMaps = new OlaMaps({ apiKey });

    const myMap = olaMaps.init({
        style: "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json",
        container: 'map',
        center: [77.61648476788898, 12.931423492103944],
        zoom: 12,
    });

    myMap.on('styleimagemissing', (e) => {
        if (e.id === 'pedestrian_polygon') {
            myMap.loadImage('/pedestrian_polygon.png', (error, image) => {
                if (error) {
                    console.error('Error loading image:', error);
                    return;
                }
                if (!myMap.hasImage('pedestrian_polygon')) {
                    myMap.addImage('pedestrian_polygon', image);
                }
            });
        }
    });

    // ✅ Get User Location (Geolocation Integration)
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;
                console.log(`User Location - Latitude: ${userLat}, Longitude: ${userLng}`);

                myMap.setCenter([userLng, userLat]);

                olaMaps.addMarker({
                    offset: [0, -10],
                    anchor: 'center',
                    color: 'blue'
                })
                .setLngLat([userLng, userLat])
                .addTo(myMap);
            },
            error => {
                console.error(`Geolocation Error: ${error.message}`);
                alert("Unable to retrieve your location. Please enable location services.");
            }
        );
    } else {
        alert("Geolocation is not supported by this browser.");
    }

    // ✅ Find Nearest Chargers Using Ola Maps API Directly
    const findNearestBtn = document.createElement('button');
    findNearestBtn.textContent = "Find Nearest Chargers";
    findNearestBtn.className = "search-container button";
    document.querySelector(".search-container").appendChild(findNearestBtn);

    findNearestBtn.addEventListener("click", () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;

                fetch("stations_cleaned.json")
                    .then(response => response.json())
                    .then(stations => {
                        const nearbyStations = stations.filter(station => {
                            const distance = haversineDistance(userLat, userLng, station.latitude, station.longitude);
                            return distance <= 10;
                        });

                        if (nearbyStations.length === 0) {
                            alert("No nearby charging stations found within 10 km.");
                            return;
                        }

                        // 🔍 Step 2: Call Ola Maps Routing API for Filtered Stations
                        nearbyStations.forEach(station => {
                            const origin = `${userLat},${userLng}`;
                            const destination = `${station.latitude},${station.longitude}`;

                            const routingURL = `https://api.olamaps.io/routing/v1/directions?origin=${origin}&destination=${destination}&mode=driving&alternatives=false&steps=true&overview=full&language=en&traffic_metadata=false&api_key=${apiKey}`;

                            fetch(routingURL, { method: "POST" })
                            .then(response => {
                                if (!response.ok) {
                                    throw new Error(`Routing API Error: ${response.statusText}`);
                                }
                                return response.json();
                            })
                            .then(data => {
                                console.log("Routing API Response:", data); // ✅ Verify the API response structure
                            
                                if (!data.routes || data.routes.length === 0) {
                                    console.error("No routes found:", data);
                                    return;
                                }
                            
                                const route = data.routes[0];
                            
                                // ✅ Correctly access distance and duration
                                const travelDistance = data.routes[0].legs[0].readable_distance; 
                                const travelTime = data.routes[0].legs[0].readable_duration;                                
                            
                                const marker = olaMaps.addMarker({
                                    offset: [0, -10],
                                    anchor: 'center',
                                    color: 'green'
                                })
                                .setLngLat([station.longitude, station.latitude])
                                .addTo(myMap);
                            
                                const popup = olaMaps
                                    .addPopup({ offset: [0, -30], anchor: 'bottom' })
                                    .setText(`${station.name} - ${travelDistance} km away, approx ${travelTime} mins`);
                            
                                marker.setPopup(popup);
                            })
                          
                            .catch(err => console.error("Error calling Routing API:", err));
                        });
                    })
                    .catch(err => console.error("Error loading stations:", err));
            });
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    });

    // ✅ Haversine Distance Function (Calculates distance in km)
    function haversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of Earth in km
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
});
