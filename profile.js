document.addEventListener("DOMContentLoaded", () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
        window.location.href = "auth.html"; // Redirect if not logged in
        return;
    }
    console.log(user)
    document.getElementById("username").textContent = user.username;

    // Fetch bookmarks
    fetch(`https://evchargerlocator.onrender.com/api/bookmarks/${user.userId}`)
        .then(response => response.json())
        .then(data => {
            displayBookmarks(data);
        })
        .catch(error => console.error("Error fetching bookmarks:", error));

        function displayBookmarks(bookmarks) {
            const chargersList = document.getElementById("chargers-list");
            const activitiesList = document.getElementById("activities-list");
        
            if (!chargersList || !activitiesList) {
                console.error("Error: Chargers or Activities list element not found!");
                return;
            }
        
            chargersList.innerHTML = "";
            activitiesList.innerHTML = "";
        
            if (bookmarks.length === 0) {
                chargersList.innerHTML = "<p>No bookmarks found.</p>";
                activitiesList.innerHTML = "<p>No bookmarks found.</p>";
                return;
            }
        
            bookmarks.forEach(bookmark => {
                const div = document.createElement("div");
                div.classList.add("bookmark-item");
        
                if (bookmark.type === "charger") {
                    div.innerHTML = `
                        <span>🔌 ${bookmark.stationName} (${bookmark.location})</span>
                        <button class="remove-btn" onclick="removeBookmark('${bookmark.userId}')">Remove</button>
                    `;
                    chargersList.appendChild(div);
                } else if (bookmark.type === "activity") {
                    div.innerHTML = `
                        <span>🎉 ${bookmark.activityName}: ${bookmark.activityDescription} 
                        (📍 at ${bookmark.chargerName})</span>
                        <button class="remove-btn" onclick="removeBookmark('${bookmark.userId}')">Remove</button>
                    `;
                    activitiesList.appendChild(div);
                }
            });
        }        
});

// Remove a bookmark
function removeBookmark(bookmarkId) {
    fetch(`https://evchargerlocator.onrender.com/api/bookmarks/${bookmarkId}`, { method: "DELETE" })
        .then(response => response.json())
        .then(data => {
            alert("Bookmark removed!");
            window.location.reload();
        })
        .catch(error => console.error("Error removing bookmark:", error));
}

// Logout
function logout() {
    localStorage.removeItem("user");
    window.location.href = "auth.html";
}
