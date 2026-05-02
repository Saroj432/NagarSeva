const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Complaint = require('../models/Complaint');
const fs = require('fs');
const path = require('path');

const GEMINI_KEY = process.env.GEMINI_API_KEY;

async function geminiCall(prompt, imageBase64 = null) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_KEY}`;
  const parts = [{ text: prompt }];
  if (imageBase64) {
    parts.push({ inline_data: { mime_type: 'image/jpeg', data: imageBase64 } });
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts }] })
  });
  const data = await res.json();
  if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
    return data.candidates[0].content.parts[0].text.trim();
  }
  throw new Error(data.error?.message || 'Gemini API error');
}

// General Gemini call
router.post('/gemini', auth, async (req, res) => {
  try {
    const { prompt } = req.body;
    const text = await geminiCall(prompt);
    res.json({ text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/improve-text', auth, async (req, res) => {
  try {
    const { text } = req.body;
    const prompt = `Improve this municipal complaint description to be more clear and professional. Keep it in same language (Hindi/Hinglish/English). Original: "${text}". Return only the improved text, nothing else.`;
    const improved = await geminiCall(prompt);
    res.json({ improved });
  } catch (err) {
    res.status(500).json({ error: err.message, improved: req.body.text });
  }
});

router.post('/analyze-image', auth, async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'Image required' });

    const prompt = `Analyze this municipal complaint image from India. Respond ONLY in JSON:
{"detected_problem":"brief description","category":"garbage/drainage/road/water/electricity/sewage/other","severity":"critical/high/medium/low","confidence":85,"description":"2 sentence description","suggested_title":"complaint title in English","immediate_action":true}`;

    const text = await geminiCall(prompt, imageBase64);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      return res.json({ success: true, analysis });
    }
    res.json({ success: false });
  } catch (err) {
    console.error('Image analysis error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/predictions', auth, async (req, res) => {
  try {
    const complaints = await Complaint.find({}).select('category priority location createdAt status').lean();
    if (complaints.length < 3) return res.json({ predictions: [], message: 'More data needed' });

    const categoryCount = {};
    const monthlyTrend = {};
    const areaProblems = {};

    complaints.forEach(c => {
      categoryCount[c.category] = (categoryCount[c.category] || 0) + 1;
      const month = new Date(c.createdAt).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      monthlyTrend[month] = (monthlyTrend[month] || 0) + 1;
      const area = c.location?.ward || c.location?.address?.split(',')[0] || 'Unknown';
      if (!areaProblems[area]) areaProblems[area] = {};
      areaProblems[area][c.category] = (areaProblems[area][c.category] || 0) + 1;
    });

    const hotspots = Object.entries(areaProblems)
      .map(([area, cats]) => ({ area, totalComplaints: Object.values(cats).reduce((a,b)=>a+b,0), topCategory: Object.entries(cats).sort((a,b)=>b[1]-a[1])[0][0] }))
      .sort((a,b) => b.totalComplaints - a.totalComplaints).slice(0, 5);

    const topCategories = Object.entries(categoryCount)
      .sort((a,b) => b[1]-a[1])
      .map(([cat, count]) => ({ category: cat, count, percentage: Math.round(count/complaints.length*100) }));

    const resolved = complaints.filter(c => c.status === 'resolved').length;
    const resolutionRate = Math.round(resolved / complaints.length * 100);

    let aiPredictions = [];
    try {
      const prompt = `Municipal complaint data: ${JSON.stringify({ topCategories: topCategories.slice(0,3), hotspots: hotspots.slice(0,3), resolutionRate, total: complaints.length })}. Give 3 actionable predictions in JSON array: [{"title":"","prediction":"","action":"","priority":"high/medium/low"}]. Respond ONLY with JSON array.`;
      const text = await geminiCall(prompt);
      const match = text.match(/\[[\s\S]*\]/);
      if (match) aiPredictions = JSON.parse(match[0]);
    } catch(e) { console.error('Prediction AI error:', e.message); }

    res.json({
      success: true,
      stats: { totalComplaints: complaints.length, resolutionRate, peakDay: 'Monday' },
      topCategories, hotspots, monthlyTrend, aiPredictions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;