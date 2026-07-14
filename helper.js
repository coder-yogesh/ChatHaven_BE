// chatgpt.js
// Drop-in replacement for an OpenAI "callChatGPT" helper, backed by Groq's
// free API (OpenAI-compatible). Supports plain text prompts and, optionally,
// an image file (uses a vision-capable model automatically when an image
// is provided).

const fetch = require("node-fetch");
// const fs = require("fs");

const API_URL = "https://api.groq.com/openai/v1/chat/completions";
const TEXT_MODEL = "openai/gpt-oss-120b";
const VISION_MODEL = "qwen/qwen3.6-27b";

/**
 * Call the AI with a text prompt, optionally including an image.
 * @param {string} prompt - The user's text prompt.
 * @param {Buffer} [imageBuffer] - Buffer containing the image data (optional).
 * @param {string} [userApiKey] - The requesting user's own Groq API key, sent
 *   per-request from the client (their browser's localStorage). Never stored
 *   server-side — it only exists for the lifetime of this one call. Falls
 *   back to the shared GROQ_API_KEY env var if the user hasn't set one.
 * @returns {Promise<string>} - The AI's reply text.
 */
async function callChatGPT(prompt, imageBuffer, userApiKey) {
  const apiKey = userApiKey || process.env.GROQ_API_KEY;
  if (!apiKey) {
    const err = new Error("No Groq API key available for this request.");
    err.code = "NO_GROQ_KEY";
    throw err;
  }

  let model = TEXT_MODEL;
  let userContent = prompt;

  // If an image was uploaded, switch to the vision model and send it
  // as a base64 data URL alongside the text prompt.
  if (imageBuffer) {
    // const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString("base64");
    // const ext = imagePath.split(".").pop().toLowerCase();
    // const mimeType = ext === "png" ? "image/png" : "image/jpeg";

    model = VISION_MODEL;
    userContent = [
      { type: "text", text: prompt },
      {
        type: "image_url",
        // image_url: { url: `data:${mimeType};base64,${base64Image}` },
        image_url: {
          url: `data:image/jpeg;base64,${base64Image}`,
        }
      },
    ];
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: userContent },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    const err = new Error(`Groq API error ${response.status}: ${errText}`);
    if (response.status === 401) err.code = "INVALID_GROQ_KEY";
    throw err;
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

module.exports = {
  callChatGPT,
};