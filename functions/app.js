const express = require("express");
const serverless = require("serverless-http");
const app = express();
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const bodyParse = require('body-parser');
const dotenv = require('dotenv');
app.use(bodyParse.json());
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
async function callChatGPT(prompt) {
    const response = await model.generateContent(prompt);
    return response.response.text();
}


router.get("/", (req, res) => {
    res.send("App is running..");
});
router.post('/chatgpt', async (req, res) => {
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

app.use("/.netlify/functions/app", router);
module.exports.handler = serverless(app);