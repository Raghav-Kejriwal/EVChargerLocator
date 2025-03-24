import.meta.env; // Load environment variables
import { OlaMaps } from 'olamaps-web-sdk';

 // ✅ Sidebar toggle logic
const sidebar = document.getElementById("sidebar");
const toggleButton = document.getElementById("toggleButton");

const profileLink = document.getElementById("profile-link");
const settingsLink = document.getElementById("settings-link");
const logoutSection = document.querySelector(".logout-section");
const welcomeText = document.getElementById("welcome-text"); // ✅ Fixed missing reference

toggleButton.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");

    const isCollapsed = sidebar.classList.contains("collapsed");

    if (isCollapsed) {
        profileLink.style.display = "none";
        settingsLink.style.display = "none";
        logoutSection.style.display = "none";
        welcomeText.style.display = "none";
    } else {
        profileLink.style.display = "block";
        settingsLink.style.display = "block";
        logoutSection.style.display = "flex";
        welcomeText.style.display = "block";
    }
});
const apiKey = import.meta.env.VITE_OLA_API_KEY;

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
                                console.log("Routing API Response:", data);

                                if (!data.routes || data.routes.length === 0) {
                                    console.error("No routes found:", data);
                                    return;
                                }

                                const route = data.routes[0];
                                const travelDistance = route.legs[0].readable_distance;
                                const travelTime = route.legs[0].readable_duration;
                                const steps = route.legs[0].steps;

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

                                // ✅ Display Step-by-Step Directions Below the Map
                                marker.getElement().addEventListener("click", () => {
                                    const stepsContainer = document.getElementById("steps-container");
                                    stepsContainer.innerHTML = `
                                        <h3>Step-by-Step Directions</h3>
                                        <ul id="directions-list">
                                            ${steps.map(step => `<li>${step.instructions} (${step.readable_distance}, ${step.readable_duration})</li>`).join("")}
                                        </ul>
                                    `;
                                
                                    // ✅ Ensure the bookmark button stays
                                    const bookmarkButton = document.createElement("button");
                                    bookmarkButton.id = "bookmark-charger-btn";
                                    bookmarkButton.textContent = "⭐ Bookmark Charger";
                                    stepsContainer.appendChild(bookmarkButton);
                                
                                    // ✅ Reattach event listener for bookmarking
                                    bookmarkButton.addEventListener("click", () => {
                                        bookmarkCharger(station);
                                    });
                                
                                    showActivityBoxes(station.station_id,station.name);
                                });
                            })
                            .catch(err => console.error("Error calling Routing API:", err));
                        });
                    })
                    .catch(err => console.error("Error loading stations:", err));
            });
        } else {
            alert("Geolocation is not supported by this browser.");
        }

    let activitiesData = [];

    // 🚀 Fetch activities from activities.json
    fetch("activities.json")
        .then(response => response.json())
        .then(data => {
            activitiesData = data;
        })
        .catch(error => console.error("Error loading activities:", error));
        function showActivityBoxes(stationId, stationName) {
            const activityContainer = document.getElementById("activity-container");
            activityContainer.innerHTML = ""; // Clear previous activities
        
            console.log("Received stationId:", stationId);
            console.log("Station Name:", stationName);
            console.log("Available Activities Data:", activitiesData);
        
            if (!stationId) {
                console.error("❌ Station ID is missing.");
                activityContainer.innerHTML = "<p>Error: No station ID provided.</p>";
                return;
            }
        
            // 🔍 Keep your original filtering logic
            const stationActivities = activitiesData.filter(activity => activity.StationId === stationId);
        
            if (stationActivities.length === 0) {
                activityContainer.innerHTML = "<p>No activities found for this station.</p>";
                return;
            }
        
            // 🎲 Keep the original random selection logic
            const selectedActivities = stationActivities.length > 3
                ? stationActivities.sort(() => 0.5 - Math.random()).slice(0, 3)
                : stationActivities;
        
            // 📦 Create activity boxes with bookmark buttons
            selectedActivities.forEach(activity => {
                const activityBox = document.createElement("div");
                activityBox.classList.add("activity-box");
                activityBox.innerHTML = `
                    <h3>${activity.Name}</h3>
                    <p>${activity.Description}</p>
                    <button class="bookmark-activity-btn">⭐ Bookmark</button>
                `;
        
                // ⭐ Add event listener to bookmark activity
                activityBox.querySelector(".bookmark-activity-btn").addEventListener("click", () => {
                    bookmarkActivity(activity, stationName);
                });
        
                activityContainer.appendChild(activityBox);
            });
        }
        
        function bookmarkActivity(activity, chargerName) {
            const user = JSON.parse(localStorage.getItem("user"));
            if (!user || !user._id) {
                alert("Please log in to bookmark activities.");
                return;
            }
        
            // 🔹 Prepare activity details for bookmarking
            const activityDetails = {
                userId: user._id,  // ✅ Ensure the correct user ID is sent
                chargerName: chargerName,  // ✅ Linking activity to the charger
                activityName: activity.Name,
                activityDescription: activity.Description
            };
        
            console.log("Sending bookmark request:", activityDetails);
        
            fetch("https://evchargerlocator.onrender.com/api/bookmarks/activity", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(activityDetails),
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(`✅ Activity '${activity.Name}' bookmarked under '${chargerName}'!`);
                } else {
                    alert("❌ Failed to bookmark: " + data.message);
                }
            })
            .catch(error => console.error("Error:", error));
        }
        
    function performSearch(query) {
        fetch("stations_cleaned.json")
            .then(response => response.json())
            .then(stations => {
                const results = stations.filter(station => 
                    station.name.toLowerCase().includes(query) ||
                    station.city.toLowerCase().includes(query) ||
                    station.state.toLowerCase().includes(query)
                ).slice(0, 10);
                console.log(results);
                results.forEach(station => {
                    if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(userPosition => {
                            const userLat = userPosition.coords.latitude;
                            const userLng = userPosition.coords.longitude;
                            const origin = `${userLat},${userLng}`;
                            const destination = `${station.latitude},${station.longitude}`;
        
                            const routingURL = `https://api.olamaps.io/routing/v1/directions?origin=${origin}&destination=${destination}&mode=driving&alternatives=false&steps=true&overview=full&language=en&traffic_metadata=false&api_key=${apiKey}`;
                            fetch(routingURL, { method: "POST" })
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(`serach Routing API Error: ${response.statusText}`);
                            }
                            return response.json();
                        })
                        .then(data => {
                            console.log("Routing API Response:", data);

                            if (!data.routes || data.routes.length === 0) {
                                console.error("No routes found:", data);
                                return;
                            }

                            const route = data.routes[0];
                            const travelDistance = route.legs[0].readable_distance;
                            const travelTime = route.legs[0].readable_duration;
                            const steps = route.legs[0].steps;

                            const marker = olaMaps.addMarker({
                                offset: [0, -10],
                                anchor: 'center',
                                color: 'red'
                            })
                            .setLngLat([station.longitude, station.latitude])
                            .addTo(myMap);

                            const popup = olaMaps
                                .addPopup({ offset: [0, -30], anchor: 'bottom' })
                                .setText(`${station.name} - ${travelDistance} km away, approx ${travelTime} mins`);

                            marker.setPopup(popup);

                            // ✅ Display Step-by-Step Directions Below the Map
                            marker.getElement().addEventListener("click", () => {
                                const stepsContainer = document.getElementById("steps-container");
                                stepsContainer.innerHTML = `
                                    <h3>Step-by-Step Directions</h3>
                                    <ul id="directions-list">
                                        ${steps.map(step => `<li>${step.instructions} (${step.readable_distance}, ${step.readable_duration})</li>`).join("")}
                                    </ul>
                                `;
                            
                                // ✅ Ensure the bookmark button stays
                                const bookmarkButton = document.createElement("button");
                                bookmarkButton.id = "bookmark-charger-btn";
                                bookmarkButton.textContent = "⭐ Bookmark Charger";
                                stepsContainer.appendChild(bookmarkButton);
                            
                                // ✅ Reattach event listener for bookmarking
                                bookmarkButton.addEventListener("click", () => {
                                    bookmarkCharger(station);
                                });
                            
                                showActivityBoxes(station.station_id,station.name);
                            });
                        })
                        .catch(err => console.error("Error calling Routing API:", err));
                            })
                        }
                });
            })
            .catch(err => console.error("Error loading stations:", err));
    }

    document.querySelector(".search-container button").addEventListener("click", () => {
        const query = document.querySelector(".search-container input").value.trim().toLowerCase();
        if (query) performSearch(query);
    })
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

function bookmarkCharger(station) {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
        alert("Please log in to bookmark chargers.");
        return;
    }

    const chargerDetails = {
        userId: user._id,  // ✅ Ensure userId exists
        stationName: station.name || "Unknown Charger",
        location: station.city || "Unknown Location",
        latitude: station.latitude || 0,
        longitude: station.longitude || 0
    };
    console.log("Sending bookmark request:", chargerDetails);  // ✅ Log data being sent
    fetch("https://evchargerlocator.onrender.com/api/bookmarks/charger", {  // ✅ Corrected API URL
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(chargerDetails),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert("✅ Charger bookmarked successfully!");
        } else {
            alert("❌ Failed to bookmark.");
        }
    })
    .catch(error => console.error("Error:", error));
}
