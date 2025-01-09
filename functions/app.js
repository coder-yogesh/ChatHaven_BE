const express = require("express");
const serverless = require("serverless-http");
const { GoogleGenerativeAI } = require('@google/generative-ai');// Ensure the correct package
require("dotenv").config();  // For handling environment variables

const app = express();
app.use(express.json());  // To parse JSON request body

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
        console.error(error);  // Log error for debugging
        return res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports.handler = serverless(app);
