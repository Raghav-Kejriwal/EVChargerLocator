import.meta.env; // Load environment variables
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

    const apiKey = import.meta.env.VITE_OLA_API_KEY;
    if (!apiKey) {
        alert("API Key not found. Please check your environment variables.");
        return;
    }

    const olaMaps = new OlaMaps({ apiKey: apiKey });

    const myMap = olaMaps.init({
        style: "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json",
        container: 'map',
        center: [77.61648476788898, 12.931423492103944],
        zoom: 12,
    });

    // ✅ Get User Location (Geolocation Integration)
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;
                console.log(`User Location - Latitude: ${userLat}, Longitude: ${userLng}`);

                myMap.setCenter([userLng, userLat]); // Center map on user's location

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

    // ✅ Find Nearest Chargers Logic
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
                            return distance <= 1000; // Radius in km
                        });

                        if (nearbyStations.length === 0) {
                            alert("No nearby charging stations found within 10 km.");
                            return;
                        }

                        nearbyStations.forEach(station => {
                            const distance = haversineDistance(userLat, userLng, station.latitude, station.longitude).toFixed(2);

                            const marker = olaMaps.addMarker({
                                offset: [0, -10],
                                anchor: 'center',
                                color: 'green'
                            })
                            .setLngLat([station.longitude, station.latitude])
                            .addTo(myMap);

                            const popup = olaMaps
                                .addPopup({ offset: [0, -30], anchor: 'bottom' })
                                .setText(`${station.name} - ${distance} km away`);

                            marker.setPopup(popup);
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