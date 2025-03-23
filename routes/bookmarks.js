const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// Define the Bookmark schema
const BookmarkSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["charger", "activity"], required: true },
    stationName: String,  // ✅ Used for chargers
    location: String,  
    latitude: Number,  
    longitude: Number,  
    chargerName: String,  // ✅ NEW: Stores the charger name for activities
    activityName: String,  
    activityDescription: String,
});

const Bookmark = mongoose.models.Bookmark || mongoose.model("Bookmark", BookmarkSchema);

// 🔹 Add Bookmark (EV Charger)
router.post("/bookmarks/charger", async (req, res) => {
    try {
        console.log("Received request body:", req.body);

        let { userId, stationName, location, latitude, longitude } = req.body;

        // ✅ Convert userId to a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: "Invalid userId format" });
        }
        userId = new mongoose.Types.ObjectId(userId);

        if (!userId || !stationName || !location || latitude === undefined || longitude === undefined) {
            return res.status(400).json({ success: false, message: "Missing required fields", receivedData: req.body });
        }

        const newBookmark = new Bookmark({
            userId,
            type: "charger",
            stationName,
            location,
            latitude,
            longitude,
        });

        await newBookmark.save();
        res.json({ success: true, message: "Charger bookmarked!" });
    } catch (error) {
        console.error("Error saving bookmark:", error);
        res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
});


// 🔹 Add Bookmark (Activity)
router.post("/bookmarks/activity", async (req, res) => {
    try {
        console.log("Received activity data:", req.body);

        let { userId, chargerName, activityName, activityDescription } = req.body;

        // ✅ Convert userId to MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: "Invalid userId format" });
        }
        userId = new mongoose.Types.ObjectId(userId);

        if (!userId || !chargerName || !activityName || !activityDescription) {
            return res.status(400).json({ success: false, message: "Missing required fields", receivedData: req.body });
        }

        const newBookmark = new Bookmark({
            userId,
            type: "activity",
            chargerName,  // ✅ Now storing the charger name
            activityName,
            activityDescription,
        });

        await newBookmark.save();
        res.json({ success: true, message: `Activity '${activityName}' bookmarked under '${chargerName}'!` });
    } catch (error) {
        console.error("Error saving activity bookmark:", error);
        res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
});




// 🔹 Get User's Bookmarks
router.get("/bookmarks/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;

        // ✅ Convert userId to ObjectId before querying MongoDB
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: "Invalid userId format" });
        }

        const bookmarks = await Bookmark.find({ userId: new mongoose.Types.ObjectId(userId) });

        res.json(bookmarks);
    } catch (error) {
        console.error("Error fetching bookmarks:", error);
        res.status(500).json({ message: "Server error." });
    }
});



// 🔹 Delete a Bookmark
router.delete("/bookmarks/:bookmarkId", async (req, res) => {
    try {
        await Bookmark.findByIdAndDelete(req.params.bookmarkId);
        res.json({ success: true, message: "Bookmark removed!" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error." });
    }
});

module.exports = router;