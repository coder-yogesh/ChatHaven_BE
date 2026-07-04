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

// Load env
dotenv.config();

const app = express();

// ===== Middleware =====

// CORS (update frontend URL after deployment)
app.use(
  cors({
    origin: [
      'https://chat-haven-jet.vercel.app/' // CHANGE THIS
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

app.use(passport.initialize());
app.use(passport.session());

// ===== File Upload (Multer) =====

// Ensure uploads folder exists
// const uploadDir = path.join(__dirname, 'uploads');
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir);
// }

// // Multer config
// const upload = multer({ dest: uploadDir });

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
// app.post('/chatgpt', upload.single('image'), async (req, res) => {
//   try {
//     const { prompt } = req.body;

//     if (!prompt) {
//       return res.status(400).json({ error: 'Prompt is required' });
//     }

//     const response = await callChatGPT(prompt);

//     // Cleanup uploaded file (optional)
//     if (req.file) {
//       fs.unlink(req.file.path, () => {});
//     }

//     return res.status(200).json({
//       success: true,
//       message: response,
//     });
//   } catch (error) {
//     console.error('Chat Route Error:', error);
//     return res.status(500).json({
//       success: false,
//       error: error.message,
//     });
//   }
// });

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