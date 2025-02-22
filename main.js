import.meta.env; // Load environment variables
import { OlaMaps } from 'olamaps-web-sdk';
  
document.addEventListener('DOMContentLoaded', () => {
  // ✅ Check user authentication after DOM is fully loaded
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    window.location.href = "auth.html"; // Redirect if not logged in
    return; // Prevent further execution
  }

    // ✅ Display username
  const welcomeText = document.getElementById("welcome-text");
  welcomeText.textContent = `Hello, ${user.username || 'Guest'}`;

  // ✅ Logout functionality
  const logoutBtn = document.querySelector(".logout-btn");
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("user");
    window.location.href = "auth.html";
  });

  // ✅ Sidebar toggle logic
  const sidebar = document.getElementById("sidebar");
  const toggleButton = document.getElementById("toggleButton");

  const profileLink = document.getElementById("profile-link");
  const settingsLink = document.getElementById("settings-link");
  const logoutSection = document.querySelector(".logout-section");

  toggleButton.addEventListener("click", () => {
    const isCollapsed = sidebar.style.width === "60px";

    if (isCollapsed) {
      // 🔓 Expand sidebar
      sidebar.style.width = "220px";
      profileLink.style.display = "block";
      settingsLink.style.display = "block";
      logoutSection.style.display = "flex";
      welcomeText.style.display = "block";
    } else {
      // 🔒 Collapse sidebar
      sidebar.style.width = "60px";
      profileLink.style.display = "none";
      settingsLink.style.display = "none";
      logoutSection.style.display = "none";
      welcomeText.style.display = "none";
    }
  });

  // ✅ Initialize Ola Maps
  const apiKey = import.meta.env.VITE_OLA_API_KEY;
  if (!apiKey) {
    alert("API Key not found. Please check your environment variables.");
    return;
  }

  const olaMaps = new OlaMaps({ apiKey:apiKey });

  const myMap = olaMaps.init({
    style: "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json",
    container: 'map',
    center: [77.61648476788898, 12.931423492103944], // Default center: Bangalore
    zoom: 12,
  });



  // ✅ Load and display EV charging stations
  fetch("stations.json")
    .then((response) => response.json())
    .then((stations) => {
      stations.forEach((station) => {
        const marker = new olaMaps.Marker({
          position: [station.longitude, station.latitude],
          map: myMap,
          title: station.name,
        });

        marker.addListener("click", () => {
          new olaMaps.InfoWindow({
            content: `
              <b>${station.name}</b><br>
              ${station.address}<br>
              ${station.city}, ${station.state}
            `,
            position: marker.getPosition(),
          }).open(myMap);
        });
      });
    })
    .catch((err) => console.error("Error loading stations:", err));

  // ✅ Search functionality
  const searchInput = document.querySelector(".search-container input");
  const searchButton = document.querySelector(".search-container button");

  searchButton.addEventListener("click", () => {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) {
      alert("Please enter a city or station name.");
      return;
    }

    fetch("stations.json")
      .then((response) => response.json())
      .then((stations) => {
        const matched = stations.find(
          (s) =>
            s.name.toLowerCase().includes(query) ||
            s.city.toLowerCase().includes(query)
        );

        if (matched) {
          myMap.setCenter([matched.longitude, matched.latitude]);
          myMap.setZoom(13);
        } else {
          alert("No matching charging stations found.");
        }
      });
  });
});
