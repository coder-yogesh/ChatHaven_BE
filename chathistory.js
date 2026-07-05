// chatHistory.js
// In-memory chat history store — swap the Map for a real DB (MongoDB,
// Postgres, etc.) when ready. Keyed by chatId.
const express = require("express");

const router = express.Router();

// chatId -> { id, title, messages: [{type, message, id, createdAt}], updatedAt }
const chats = new Map();

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// Derives a short title from the first user message, ChatGPT-style.
function deriveTitle(messages) {
  const firstUserMsg = messages.find((m) => m.type === "user");
  if (!firstUserMsg) return "New chat";
  const text = firstUserMsg.message.trim();
  return text.length > 40 ? text.slice(0, 40) + "…" : text || "New chat";
}

// GET /chats — list all chats, newest first (sidebar list)
router.get("/chats", (req, res) => {
  const list = [...chats.values()]
    .map(({ id, title, updatedAt }) => ({ id, title, updatedAt }))
    .sort((a, b) => b.updatedAt - a.updatedAt);
  res.json({ success: true, chats: list });
});

// POST /chats — create a new empty chat, returns its id
router.post("/chats", (req, res) => {
  const id = makeId();
  const chat = { id, title: "New chat", messages: [], updatedAt: Date.now() };
  chats.set(id, chat);
  res.status(201).json({ success: true, chat });
});

// GET /chats/:id — full message history for one chat
router.get("/chats/:id", (req, res) => {
  const chat = chats.get(req.params.id);
  if (!chat) return res.status(404).json({ success: false, error: "Chat not found" });
  res.json({ success: true, chat });
});

// PUT /chats/:id — replace a chat's messages (called after each send/edit/regenerate)
router.put("/chats/:id", (req, res) => {
  const { messages } = req.body;
  const chat = chats.get(req.params.id);
  if (!chat) return res.status(404).json({ success: false, error: "Chat not found" });

  chat.messages = messages || [];
  chat.title = deriveTitle(chat.messages);
  chat.updatedAt = Date.now();
  res.json({ success: true, chat });
});

// DELETE /chats/:id
router.delete("/chats/:id", (req, res) => {
  const existed = chats.delete(req.params.id);
  if (!existed) return res.status(404).json({ success: false, error: "Chat not found" });
  res.json({ success: true });
});

module.exports = router;