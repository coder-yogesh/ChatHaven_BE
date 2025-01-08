const express = require('express');
const passport = require('passport');
const session = require('express-session');
// const { OpenAI } = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const bodyParse = require('body-parser');
const dotenv = require('dotenv');
const authRoutes = require("./auth");


const app = express();
const cors = require('cors');
const { default: axios } = require('axios');
app.use(
    cors({
      origin: "http://localhost:3000", // your frontend URL (React app)
      credentials: true,
    })
);
app.use(bodyParse.json());
dotenv.config();
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true
    })
);
app.use(passport.initialize());
app.use(passport.session());


// async function callChatGPT(prompt) {
//     const url = "https://api.openai.com/v1/chat/completions";

//     const headers = {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${apikey}`,
//     };

//     const data = {
//         model: "gpt-3.5-turbo",
//         messages: [
//             { role: "system", content: "You are a helpful assistant." },
//             { role: "user", content: prompt },
//         ],
//     };

//     try {
//         const response = await axios.post(url, data, { headers });
//         const result = response.data.choices[0].message.content;
//         return result;
//     } catch (error) {
//         console.error(
//             "Error calling ChatGPT API:",
//             error.response ? error.response.data : error.message
//         );
//         throw error;
//     }
// }

// const baseURL = 'https://api.aimlapi.com/v1';
// const apiKey = 'b1d8a1de9f09411095eb63edfec36317';
// const systemPrompt = "You are a travel agent. Be descriptive and helpful";


//openai api's

// const api = new OpenAI({
//     apiKey,
//     baseURL
// })
// async function callChatGPT(userPrompt) {
//     const completions = await api.chat.completions.create({
//         model: "chatgpt-4o-latest",
//         messages: [
//             {
//                 role: 'system',
//                 content: systemPrompt
//             },
//             {
//                 role: 'user',
//                 content: userPrompt
//             }
//         ]
//     })
    
//     const response = completions.choices[0].message.content;
//     return response;
// }

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
        return res.status(500).json({ error: 'Internal server error' });
    }
});
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
        res.status(500).send('Error fetching image');
      }
})
app.use("/api/auth", authRoutes);

const port = 4000;
app.listen(port, () => {
    console.log('server running');
})