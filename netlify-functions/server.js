const express = require('express');
const serverless = require('serverless-http');
const app = express();
const router = express.Router();

// Define routes
router.get('/', (req, res) => {
  res.send('Hello from Node.js running on Netlify!');
});

router.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from the API!' });
});

// Use the router
app.use('/.netlify/functions/server', router);

module.exports.handler = serverless(app);