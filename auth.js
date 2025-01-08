const express = require("express");
const passport = require("passport");
const jwt = require('jsonwebtoken');
const GoogleStrategy = require("passport-google-oauth20").Strategy;
require('dotenv').config();
const router = express.Router();
// Configure Passport Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    (accessToken, refreshToken, profile, done) => {
      // Process user profile (save to DB or return user object)
      return done(null, profile);
    }
  )
);

// Serialize & Deserialize User
passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((user, done) => {
  done(null, user);
});

// Google Login Route
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google Callback Route
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    const user = req.user; // Assuming user details are stored in req.user by Passport

    // Generate a JWT
    const crypto = require("crypto");
    const secretKey = crypto.randomBytes(32).toString("hex");
    const token = jwt.sign({ user: user._json }, secretKey, { expiresIn: "1h" });

    // Redirect with the token
    res.redirect(`http://localhost:3000/dashboard?token=${token}`);
  }
);

// Logout Route
router.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect('http://localhost:3000/');
  });
});

// Get User Info
router.get("/user", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ user: req.user });
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
});

module.exports = router;
