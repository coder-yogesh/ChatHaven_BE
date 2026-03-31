const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });

console.log("🤖 Your Gemini AI Agent is ready! Type 'exit' to quit.\n");

// Helper: read image and convert to base64
function readImageAsBase64(filePath) {
  const absolutePath = path.resolve(filePath);
  const imageBuffer = fs.readFileSync(absolutePath);
  return imageBuffer.toString("base64");
}

// Main function
async function callChatGPT({ prompt }) {
  try {
    console.log("prompt:", prompt);

    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        // model: "llama3:8b",
        model: "phi",
        prompt,
        stream: false
      })
    });

    const data = await response.json();

    console.log("AI:", data.response);

    return data.response; // ✅ correct
  } catch (err) {
    console.error("❌ Error:", err.message || err);
    throw new Error(err.message || "Unknown error");
  }
}

// Export for CommonJS
module.exports = { callChatGPT };
