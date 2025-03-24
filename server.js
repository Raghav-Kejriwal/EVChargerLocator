require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  next();
});
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));
app.use(bodyParser.json());
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173","https://evchargerlocator.vercel.app","https://evchargerlocator.onrender.com/","https://evchargerlocator.vercel.app"],
  credentials: true
}));
app.use(passport.initialize());
app.use(passport.session());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// User Schema
const UserSchema = new mongoose.Schema({
  googleId: String,
  username: String,
  email: String,
  password: String,
});

const User = mongoose.model('User', UserSchema);

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "https://evchargerlocator.onrender.com/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ googleId: profile.id });
    if (!user) {
      user = new User({
        googleId: profile.id,
        username: profile.displayName,
        email: profile.emails[0].value
      });
      await user.save();
    }
    done(null, user);
  } catch (err) {
    done(err, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

// Email/Password Registration
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Email/Password Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    if (!user.password) return res.status(400).json({ message: "Use Google Login" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    req.session.user = user;
    res.json({ message: "Login successful" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Google Auth Routes
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('https://evchargerlocator.vercel.app');
  }
);

// Logout Route
app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ message: "Logged out successfully" });
  });
});

const fs = require("fs");
const path = require("path");

// API Route: Serve activities.json
app.get("/api/activities", (req, res) => {
    const filePath = path.join(__dirname, "activities.json");  // 🔹 Ensure correct path

    fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
            console.error("Error reading activities.json:", err);
            return res.status(500).json({ message: "Server error" });
        }

        try {
            const activities = JSON.parse(data);  // ✅ Convert JSON string to object
            res.json(activities);  // ✅ Send JSON response
        } catch (parseError) {
            console.error("Error parsing JSON:", parseError);
            res.status(500).json({ message: "Invalid JSON format" });
        }
    });
});

app.get("/api/stations", (req, res) => {
  const filePath = path.join(__dirname, "stations_cleaned.json");  // ✅ Ensure correct path

  fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
          console.error("Error reading stations_cleaned.json:", err);
          return res.status(500).json({ message: "Server error" });
      }

      try {
          const stations = JSON.parse(data);  // ✅ Convert JSON string to object
          res.json(stations);  // ✅ Send JSON response
      } catch (parseError) {
          console.error("Error parsing JSON:", parseError);
          res.status(500).json({ message: "Invalid JSON format" });
      }
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

app.post("/auth/google", async (req, res) => {
  const { token } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    
    let user = await User.findOne({ email: payload.email });
    if (!user) {
      user = new User({
        googleId: payload.sub,
        username: payload.name,
        email: payload.email
      });
      await user.save();
    }
    
    res.json({ success: true, user });
  } catch (err) {
    res.status(401).json({ success: false, message: "Invalid Google token" });
  }
});

const bookmarksRoutes = require("./routes/bookmarks");
app.use("/api", bookmarksRoutes);