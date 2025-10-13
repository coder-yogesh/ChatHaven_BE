const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });

console.log("🤖 Your Gemini AI Agent is ready! Type 'exit' to quit.\n");

function readImageAsBase64(filePath) {
  const absolutePath = path.resolve(filePath);
  const imageBuffer = fs.readFileSync(absolutePath);
  return imageBuffer.toString("base64");
}

export async function callChatGPT({ prompt, imagePath }) {
    try {
      let result;
      console.log("Obj", { prompt, imagePath });
      // --- If the input is an image ---
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
        // --- Regular text input ---
        result = await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
        });
      }

      const response = await result.response;
      console.log("AI:", response.text(), "\n");
      return response.text();
    } catch (err) {
      console.error("❌ Error:", err.message);
        throw err.message;
    }
}
