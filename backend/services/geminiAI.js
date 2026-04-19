const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const classifyComplaint = async (title, description, category) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const prompt = `
You are a strict AI classifier for a Municipal Complaint Management System in India.

Complaint Title: ${title}
Description: ${description}
Category: ${category}

STRICTLY classify priority using these rules:

CRITICAL (urgencyScore 9-10) - ANY of these conditions:
- Sewage or drain overflow on road or residential area
- Flooding or waterlogging blocking roads
- Broken electric pole or live wire on ground
- Dead animal on road or public place
- Epidemic or disease risk due to garbage/water
- Fire hazard or gas leak
- Major road collapse or sinkhole
- Open manhole on road

HIGH (urgencyScore 7-8) - ANY of these conditions:
- Garbage not collected for 3 or more days
- Large pothole causing accidents or damage
- Water supply completely stopped for 2+ days
- Streetlight out on main road or dark area
- Blocked drain causing bad smell or overflow risk
- Sewage smell spreading in residential area
- Broken water pipe causing water wastage
- Road damage affecting traffic

MEDIUM (urgencyScore 5-6) - ANY of these conditions:
- Garbage missed for 1-2 days only
- Minor pothole not causing accidents
- Low water pressure but supply available
- Broken footpath or pavement
- Streetlight out in low traffic area
- Minor drainage issue

LOW (urgencyScore 1-4) - Only these:
- Cosmetic issues only
- Very minor complaints
- Non-urgent maintenance requests
- Issues not affecting daily life

IMPORTANT RULES:
1. Be STRICT and AGGRESSIVE in classification
2. When in doubt, go HIGHER priority not lower
3. Anything health or safety related = CRITICAL or HIGH
4. Most real municipal complaints = HIGH priority
5. MEDIUM and LOW should be rare

Respond ONLY with valid JSON, no extra text:
{"priority":"high","reason":"Garbage not collected for 3 days poses health risk and disease spreading.","suggestedCategory":"garbage","urgencyScore":8}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');

    const classification = JSON.parse(jsonMatch[0]);

    // Validate and enforce strict priority
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    let priority = classification.priority?.toLowerCase();
    if (!validPriorities.includes(priority)) priority = 'high';

    // Force upgrade if urgency score is high but priority is low
    const score = classification.urgencyScore || 5;
    if (score >= 9 && priority !== 'critical') priority = 'critical';
    if (score >= 7 && priority === 'medium') priority = 'high';
    if (score >= 7 && priority === 'low') priority = 'high';

    return {
      priority,
      reason: classification.reason || 'AI classified based on complaint details.',
      suggestedCategory: classification.suggestedCategory || category,
      urgencyScore: score
    };

  } catch (err) {
    console.error('Gemini AI Error:', err.message);

    // Smart fallback — don't always return medium
    const text = `${title} ${description}`.toLowerCase();

    let priority = 'medium';
    let urgencyScore = 5;

    // Critical keywords
    const criticalWords = ['overflow', 'flood', 'flooding', 'live wire', 'electric shock', 'dead animal', 'epidemic', 'disease', 'fire', 'collapse', 'sinkhole', 'open manhole', 'sewage overflow'];
    // High keywords
    const highWords = ['3 days', 'accident', 'pothole', 'no water', 'water stopped', 'dark road', 'blocked drain', 'smell', 'broken pipe', 'not collected'];

    if (criticalWords.some(w => text.includes(w))) {
      priority = 'critical';
      urgencyScore = 9;
    } else if (highWords.some(w => text.includes(w))) {
      priority = 'high';
      urgencyScore = 7;
    } else if (category === 'drainage' || category === 'sewage') {
      priority = 'high';
      urgencyScore = 7;
    } else if (category === 'garbage' || category === 'road') {
      priority = 'high';
      urgencyScore = 6;
    }

    return {
      priority,
      reason: 'AI service temporarily unavailable — classified based on keywords.',
      suggestedCategory: category,
      urgencyScore
    };
  }
};

module.exports = { classifyComplaint };