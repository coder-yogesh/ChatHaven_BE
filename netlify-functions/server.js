// const express = require('express');
// const passport = require('passport');
// const session = require('express-session');
// // const { OpenAI } = require('openai');
// const { GoogleGenerativeAI } = require('@google/generative-ai');
// const bodyParse = require('body-parser');
// const dotenv = require('dotenv');
// const authRoutes = require("./auth");
// const serverless = require('serverless-http');

// const app = express();
// const cors = require('cors');
// const { default: axios } = require('axios');
// app.use(
//     cors({
//       origin: "https://tangerine-travesseiro-be1b08.netlify.app/", // your frontend URL (React app)
//       credentials: true,
//     })
// );
// app.use(bodyParse.json());
// dotenv.config();
// app.use(
//     session({
//         secret: process.env.SESSION_SECRET,
//         resave: false,
//         saveUninitialized: true
//     })
// );
// app.use(passport.initialize());
// app.use(passport.session());


// // async function callChatGPT(prompt) {
// //     const url = "https://api.openai.com/v1/chat/completions";

// //     const headers = {
// //         "Content-Type": "application/json",
// //         Authorization: `Bearer ${apikey}`,
// //     };

// //     const data = {
// //         model: "gpt-3.5-turbo",
// //         messages: [
// //             { role: "system", content: "You are a helpful assistant." },
// //             { role: "user", content: prompt },
// //         ],
// //     };

// //     try {
// //         const response = await axios.post(url, data, { headers });
// //         const result = response.data.choices[0].message.content;
// //         return result;
// //     } catch (error) {
// //         console.error(
// //             "Error calling ChatGPT API:",
// //             error.response ? error.response.data : error.message
// //         );
// //         throw error;
// //     }
// // }

// // const baseURL = 'https://api.aimlapi.com/v1';
// // const apiKey = 'b1d8a1de9f09411095eb63edfec36317';
// // const systemPrompt = "You are a travel agent. Be descriptive and helpful";


// //openai api's

// // const api = new OpenAI({
// //     apiKey,
// //     baseURL
// // })
// // async function callChatGPT(userPrompt) {
// //     const completions = await api.chat.completions.create({
// //         model: "chatgpt-4o-latest",
// //         messages: [
// //             {
// //                 role: 'system',
// //                 content: systemPrompt
// //             },
// //             {
// //                 role: 'user',
// //                 content: userPrompt
// //             }
// //         ]
// //     })
    
// //     const response = completions.choices[0].message.content;
// //     return response;
// // }

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// async function callChatGPT(prompt) {
//     const response = await model.generateContent(prompt);
//     return response.response.text();
// }
// app.post('/chatgpt', async (req, res) => {
//     try {
//         const { prompt } = req.body;

//         if (!prompt) {
//             return res.status(400).json({ error: 'Prompt is required' });
//         }
//         const response = await callChatGPT(prompt);
//         return res.status(200).json({ message: response });
//     } catch (error) {
//         return res.status(500).json({ error: 'Internal server error' });
//     }
// });
// app.get('/proxy-image', async (req, res) => {
//     try {
//         const { url } = req.query;
//         if (!url) {
//           return res.status(400).send('URL parameter is missing');
//         }
//         const response = await axios.get(url, { responseType: 'arraybuffer' });
//         res.set('Content-Type', response.headers['content-type']);
//         res.send(response.data);
//       } catch (error) {
//         res.status(500).send('Error fetching image');
//       }
// })
// // app.use("/api/auth", authRoutes);
// app.use('/.netlify/functions/server', router);
// const port = 4000;
// app.listen(port, () => {
//     console.log('server running');
// })
// module.exports.handler = serverless(app);

const express = require('express');
const passport = require('passport');
const session = require('express-session');
const bodyParse = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const axios = require('axios');
const serverless = require('serverless-http');

// Load environment variables
dotenv.config();

// Initialize app
const app = express();

// Enable CORS for your frontend
app.use(
  cors({
    origin: "https://tangerine-travesseiro-be1b08.netlify.app", // Replace with your frontend URL
    credentials: true,
  })
);

// Middleware
app.use(bodyParse.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Google Generative AI setup
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// ChatGPT endpoint
async function callChatGPT(prompt) {
  const response = await model.generateContent(prompt);
  return response.response.text();
}

app.post('/chatgpt', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    const response = await callChatGPT(prompt);
    return res.status(200).json({ message: response });
  } catch (error) {
    console.error('Error calling ChatGPT:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Proxy image endpoint
app.get('/proxy-image', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).send('URL parameter is missing');
    }
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    res.set('Content-Type', response.headers['content-type']);
    res.send(response.data);
  } catch (error) {
    console.error('Error fetching image:', error.message);
    res.status(500).send('Error fetching image');
  }
});

// All routes should be prefixed with `/.netlify/functions/server`
const router = express.Router();
router.use('/chatgpt', app._router.stack.find((layer) => layer.route?.path === '/chatgpt'));
router.use('/proxy-image', app._router.stack.find((layer) => layer.route?.path === '/proxy-image'));

app.use('/.netlify/functions/server', router);

// Export the serverless handler
module.exports.handler = serverless(app);
