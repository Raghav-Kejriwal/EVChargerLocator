import.meta.env; // Load environment variable

import { OlaMaps } from 'olamaps-web-sdk';
const apiKey = import.meta.env.VITE_OLA_API_KEY;
const olaMaps = new OlaMaps({
  apiKey: apiKey
});

const myMap = olaMaps.init({
    style: "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json",
    container: 'map', // Should match the ID in your HTML
    center: [77.61648476788898, 12.931423492103944],
    zoom: 12,
  });
fetch("stations.json")
  .then((response) => response.json())
  .then((stations) => {
    stations.forEach((station) => {
      const marker = new olaMaps.Marker({
        position: [station.longitude, station.latitude],
        map,
        title: station.name,
      });

      marker.addListener("click", () => {
        new olaMaps.InfoWindow({
          content: `<b>${station.name}</b><br>${station.address}<br>${station.city}, ${station.state}`,
          position: marker.getPosition(),
        }).open(map);
      });
    });
  });

const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");

searchButton.addEventListener("click", () => {
  const query = searchInput.value.trim().toLowerCase();
  if (!query) return alert("Please enter a city or station name.");

  fetch("stations.json")
    .then((response) => response.json())
    .then((stations) => {
      const matched = stations.find(
        (s) => s.name.toLowerCase().includes(query) || s.city.toLowerCase().includes(query)
      );

      matched
        ? (map.setCenter([matched.longitude, matched.latitude]), map.setZoom(13))
        : alert("No matching charging stations found.");
    });
});