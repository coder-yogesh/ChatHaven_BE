const express = require('express');
const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const dotenv = require('dotenv');
const authRoutes = require("../auth");
const { callChatGPT } = require('../helper');
const axios = require('axios');

dotenv.config();

const app = express();
const router = express.Router();

app.use(cors());
app.use(bodyParser.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
  })
);
app.use(passport.initialize());
app.use(passport.session());

router.use("/api/auth", authRoutes);

router.get('/', (req, res) => {
  res.send('App is running..');
});

router.post('/add', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const response = await callChatGPT(prompt);
    res.status(200).json({ message: response });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/proxy-image', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL parameter is missing' });

    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 5000 });
    res.set('Content-Type', response.headers['content-type']);
    res.send(response.data);
  } catch (err) {
    console.error('Error fetching image:', err.message);
    res.status(500).json({ error: 'Error fetching image' });
  }
});

router.get('/demo', (req, res) => {
  res.json([
    { id: '001', name: 'Aayush' },
    { id: '002', name: 'Rohit' },
    { id: '003', name: 'Mohit' },
  ]);
});

router.post('/chatgpt', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const response = await callChatGPT(prompt);
    res.status(200).json({ message: response });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Attach router to app
app.use(`${process.env.BACK_END_URL}`, router);

// Export for Netlify
module.exports.handler = serverless(app);
