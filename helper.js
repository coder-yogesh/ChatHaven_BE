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
async function callChatGPT({ prompt, imagePath }) {
  try {
    console.log("Obj", { prompt, imagePath });
    let result;

    if (imagePath) {
      console.log("📷 Processing image at:", imagePath);

      const imageBase64 = readImageAsBase64(imagePath);

      result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt || "Describe this image." },
              {
                inline_data: {
                  mime_type: "image/png",
                  data: imageBase64,
                },
              },
            ],
          },
        ],
      });
    } else {
      // Regular text input
      result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      });
    }

    // Extract text response
    const response = result.response; // result.response is already a promise resolved by generateContent
    const text = response.text();     // Get the text from response
    console.log("AI:", text, "\n");

    return text;
  } catch (err) {
    console.error("❌ Error:", err.message || err);
    throw new Error(err.message || "Unknown error");
  }
}

// Export for CommonJS
module.exports = { callChatGPT };
