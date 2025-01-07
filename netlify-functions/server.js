// netlify-functions/server.js

const express = require('express');
const serverless = require('serverless-http');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello from Node.js server on Netlify!');
});

// Export the handler for Netlify to use
module.exports.handler = serverless(app);