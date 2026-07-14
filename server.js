// server.js

const express = require('express');
const passport = require('passport');
const session = require('express-session');
// const { GoogleGenerativeAI } = require('@google/generative-ai');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const authRoutes = require('./auth');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { callChatGPT } = require('./helper');
const chatHistoryRoutes = require('./chathistory');

// Load env
dotenv.config();

const app = express();

// ===== Middleware =====

// CORS (update frontend URL after deployment)
app.use(
  cors({
    origin: [
      'https://chat-haven-jet.vercel.app',
      'http://localhost:3000'
    ],
    credentials: true,
  })
);

app.use(bodyParser.json());

// Session (OK for Render, NOT for serverless)
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'fallback_secret',
    resave: false,
    saveUninitialized: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());

app.use("/", chatHistoryRoutes);

// ===== File Upload (Multer) =====

// Ensure uploads folder exists
// const uploadDir = path.join(__dirname, 'uploads');
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir);
// }

// Multer config
// const upload = multer({ dest: "uploads/" });
const upload = multer({
  storage: multer.memoryStorage(),
});

// ===== AI Setup =====

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// async function callChatGPT(prompt) {
//   try {
//     const model = genAI.getGenerativeModel({
//       model: 'gemini-1.5-flash',
//     });

//     const result = await model.generateContent(prompt);
//     return result.response.text();
//   } catch (error) {
//     console.error('AI Error:', error);
//     throw new Error('AI request failed');
//   }
// }

// ===== Routes =====

// Chat endpoint
app.post("/chatgpt", upload.single("image"), async (req, res) => {
  try {
    const { prompt } = req.body;
 
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // Each user brings their own Groq key so everyone's requests count
    // against *their* free-tier limits instead of one shared key. The
    // frontend stores it in localStorage and sends it on every request via
    // this header — it is never written to disk, a database, or the logs
    // below; it only exists in memory for the duration of this request.
    const userGroqKey = req.headers["x-groq-api-key"];
 
    const imageBuffer = req.file ? req.file.buffer : undefined;
    const response = await callChatGPT(prompt, imageBuffer, userGroqKey);
 
    // if (req.file) {
    //   fs.unlink(req.file.path, () => {});
    // }
 
    return res.status(200).json({
      success: true,
      message: response,
    });
  } catch (error) {
    console.error("Chat Route Error:", error.message);

    // Distinct status codes so the frontend can tell "you need to add a
    // key" apart from "the key you added doesn't work" apart from a
    // generic failure, and react accordingly (e.g. open Settings).
    if (error.code === "NO_GROQ_KEY") {
      return res.status(401).json({
        success: false,
        code: "NO_GROQ_KEY",
        error: "Add your Groq API key in Settings to start chatting.",
      });
    }
    if (error.code === "INVALID_GROQ_KEY") {
      return res.status(401).json({
        success: false,
        code: "INVALID_GROQ_KEY",
        error: "That Groq API key was rejected. Check it in Settings.",
      });
    }

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Validate a Groq API key without spending a chat completion on it — the
// Settings modal calls this right after the user pastes a key in, so they
// get instant "yes this works" / "no it doesn't" feedback. The key is read
// from the header and used for exactly one lightweight request; nothing
// about it is stored or logged here.
app.post("/validate-groq-key", async (req, res) => {
  try {
    const key = req.headers["x-groq-api-key"];
    if (!key) {
      return res.status(400).json({ success: false, error: "No API key provided" });
    }

    await axios.get("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${key}` },
    });

    return res.status(200).json({ success: true, valid: true });
  } catch (error) {
    if (error.response?.status === 401) {
      return res.status(200).json({ success: true, valid: false });
    }
    console.error("Validate Groq Key Error:", error.message);
    return res.status(500).json({ success: false, error: "Could not validate key" });
  }
});


// In-memory feedback store — swap for a real DB table in production.
// Shape: { [messageId]: 'up' | 'down' }
const feedbackStore = {};
 
app.post("/feedback", (req, res) => {
  try {
    const { messageId, type } = req.body;
 
    if (!messageId) {
      return res.status(400).json({ success: false, error: "messageId is required" });
    }
    if (type !== "up" && type !== "down" && type !== null) {
      return res.status(400).json({ success: false, error: "type must be 'up', 'down', or null" });
    }
 
    if (type === null) {
      delete feedbackStore[messageId];
    } else {
      feedbackStore[messageId] = type;
    }
 
    console.log(`Feedback recorded: ${messageId} -> ${type}`);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Feedback Route Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});


// Image proxy (fix CORS issues)
app.get('/proxy-image', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).send('URL parameter is missing');
    }

    const response = await axios.get(url, {
      responseType: 'arraybuffer',
    });

    res.set('Content-Type', response.headers['content-type']);
    res.send(response.data);
  } catch (error) {
    console.error('Proxy Image Error:', error);
    res.status(500).send('Error fetching image');
  }
});

// Auth routes
app.use('/api/auth', authRoutes);

// Health check (IMPORTANT for deployment)
app.get('/', (req, res) => {
  res.send('Backend is running 🚀');
});

// ===== Start Server =====

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

// module.exports = app;