const express = require("express");
const router = express.Router();

router.post("/message", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ reply: "Message missing" });

    const key = process.env.GEMINI_API_KEY;
    console.log("Chatbot called, key:", key ? "exists" : "MISSING");

    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + key;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: "You are NagarSeva AI assistant for Indian municipal complaints. Answer in Hindi/Hinglish/English based on user language. Be helpful and friendly. User message: " + message
          }]
        }]
      })
    });

    const data = await response.json();
    console.log("Gemini status:", response.status);

    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const reply = data.candidates[0].content.parts[0].text;
      return res.json({ reply });
    }

    console.log("Gemini full response:", JSON.stringify(data));
    res.json({ reply: "AI is busy, Try again later! 🙏" });

  } catch (err) {
    console.error("Chatbot error:", err.message);
    res.json({ reply: "Error: " + err.message });
  }
});

module.exports = router;