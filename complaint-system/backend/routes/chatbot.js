const express = require('express');
const router = express.Router();

router.post('/message', async (req, res) => {
  res.json({ reply: 'Chatbot coming soon! 🤖' });
});

module.exports = router;