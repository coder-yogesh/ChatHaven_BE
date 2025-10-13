const express = require("express");
const serverless = require("serverless-http");
const bodyParser = require("body-parser");
const passport = require("passport");
const session = require("express-session");
const cors = require("cors");
const dotenv = require("dotenv");
const { default: axios } = require("axios");
const { callChatGPT } = require("../helper.js");
const authRoutes = require("../auth");

dotenv.config();

const app = express();
const router = express.Router();

// ✅ Middleware
app.use(
  cors({
    origin: process.env.FRONT_END_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(bodyParser.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// ✅ Routes
router.use("/api/auth", authRoutes);

router.get("/", (req, res) => {
  console.log("App running...");
  res.send("App is running..");
});

router.post("/add", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  const response = await callChatGPT(prompt);
  res.status(200).json({ message: response });
});

router.get("/proxy-image", async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: "URL parameter is missing" });
    }

    const response = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 5000,
    });

    res.set("Content-Type", response.headers["content-type"]);
    res.send(response.data);
  } catch (error) {
    console.error("Error fetching image:", error.message);
    res.status(500).json({ error: "Error fetching image" });
  }
});

router.get("/demo", (req, res) => {
  res.json([
    { id: "001", name: "Aayush" },
    { id: "002", name: "Rohit" },
    { id: "003", name: "Mohit" },
  ]);
});

router.post("/chatgpt", async (req, res) => {
  try {
    const { prompt, imagePath } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const response = await callChatGPT({ prompt, imagePath });
    return res.status(200).json({ message: response });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Mount router for Netlify functions
app.use("/", router);
module.exports.handler = serverless(app);
console.log(process.env.NETLIFY_DEV, process.env.NODE_ENV);
// ✅ Only run Express locally if NOT using Netlify Dev
if (require.main === module) {
  const port = 4000;
  app.listen(port, () => console.log(`✅ Server running on http://localhost:${port}`));
}

