// chatgpt.js
// Drop-in replacement for an OpenAI "callChatGPT" helper, backed by Groq's
// free API (OpenAI-compatible) for text/vision, and Pollinations.ai (free,
// no API key required) for image generation.
//
// NOTE: uses the native global `fetch` (built into Node 18+, which is what
// Vercel's Node runtime provides) instead of the `node-fetch` package —
// node-fetch v3+ is ESM-only and would throw ERR_REQUIRE_ESM under
// require(), and it wasn't even listed in package.json's dependencies.

const API_URL = "https://api.groq.com/openai/v1/chat/completions";
const TEXT_MODEL = "openai/gpt-oss-120b";
const VISION_MODEL = "qwen/qwen3.6-27b";

// Some verbs are unambiguous for image intent on their own ("draw a dragon"
// needs no further qualifier). Others are too generic alone ("create a
// file", "make a function") and only count when paired with an image-ish
// noun nearby ("create a picture of...").
const STRONG_IMAGE_VERB_REGEXP = /\b(draw|paint|sketch|illustrate)\b/i;
const WEAK_IMAGE_VERB_WITH_NOUN_REGEXP =
  /\b(generate|create|make|design|produce)\b[^.?!]{0,40}\b(image|picture|photo|illustration|artwork|drawing|art|logo|icon|wallpaper)\b/i;

function isImageRequest(prompt) {
  return STRONG_IMAGE_VERB_REGEXP.test(prompt) || WEAK_IMAGE_VERB_WITH_NOUN_REGEXP.test(prompt);
}

/**
 * Generates an image from a text prompt using Pollinations.ai (free, no API
 * key). Returns a direct image URL — Pollinations renders the image lazily
 * the first time that URL is requested (by the <img> tag in the frontend),
 * so this function doesn't need to download/proxy the image itself.
 * @param {string} prompt
 * @returns {Promise<string>} image URL
 */
async function generateImage(prompt) {
  const seed = Math.floor(Math.random() * 1_000_000); // avoids getting a cached image for a repeated prompt
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(
    prompt
  )}?width=1024&height=1024&seed=${seed}&nologo=true`;
  return url;
}

/**
 * Call the AI with a text prompt, optionally including an image. If the
 * prompt looks like an image-generation request (and no image was
 * uploaded — that path is for vision/analysis, not generation), this skips
 * the LLM entirely and returns a generated image instead, as a markdown
 * image string (`![prompt](url)`) so the existing markdown renderer in the
 * frontend displays it — no frontend changes needed.
 *
 * @param {string} prompt - The user's text prompt.
 * @param {Buffer} [imageBuffer] - Buffer containing an uploaded image (optional).
 * @param {string} [userApiKey] - The requesting user's own Groq API key, sent
 *   per-request from the client (their browser's localStorage). Never stored
 *   server-side — it only exists for the lifetime of this one call. Falls
 *   back to the shared GROQ_API_KEY env var if the user hasn't set one.
 * @returns {Promise<string>} - The AI's reply text (or a markdown image).
 */
async function callChatGPT(prompt, imageBuffer, userApiKey) {
  // Image generation short-circuits before touching Groq at all.
  if (!imageBuffer && isImageRequest(prompt)) {
    try {
      const imageUrl = await generateImage(prompt);
      return `![${prompt}](${imageUrl})`;
    } catch (err) {
      throw new Error(`Image generation failed: ${err.message}`);
    }
  }

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
    const base64Image = imageBuffer.toString("base64");

    model = VISION_MODEL;
    userContent = [
      { type: "text", text: prompt },
      {
        type: "image_url",
        image_url: {
          url: `data:image/jpeg;base64,${base64Image}`,
        },
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
  generateImage,
  isImageRequest,
};