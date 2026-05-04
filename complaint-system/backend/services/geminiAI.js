const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const classifyComplaint = async (title, description, category) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `You are a municipal complaint classifier for India. 
Analyze this complaint and classify its priority STRICTLY based on these rules:

CRITICAL: Immediate health/life danger (sewage overflow on road, live wire, major flood, contaminated water)
HIGH: Urgent but not life threatening (no water for 2+ days, large road damage, electricity outage)
MEDIUM: Needs attention soon (garbage not collected 3-5 days, minor drainage issue, broken street light)
LOW: Minor inconvenience (small pothole, single day garbage miss, minor road issue)

Complaint Title: "${title}"
Category: "${category}"  
Description: "${description}"

Respond ONLY in this exact JSON format, nothing else:
{
  "priority": "critical" or "high" or "medium" or "low",
  "urgencyScore": number between 1-10,
  "reason": "one sentence explanation"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Extract JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid AI response');

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate priority
    const validPriorities = ['critical', 'high', 'medium', 'low'];
    if (!validPriorities.includes(parsed.priority)) {
      parsed.priority = 'medium';
    }

    return {
      priority: parsed.priority,
      urgencyScore: Math.min(10, Math.max(1, parseInt(parsed.urgencyScore) || 5)),
      reason: parsed.reason || 'AI classification completed'
    };

  } catch (err) {
    console.error('Gemini AI Error:', err.message);

    // Smart fallback based on keywords
    const text = (title + ' ' + description + ' ' + category).toLowerCase();

    let priority = 'medium';
    let urgencyScore = 5;

    if (text.includes('sewage') || text.includes('flood') || text.includes('live wire') ||
        text.includes('electric shock') || text.includes('contaminated') || text.includes('health')) {
      priority = 'critical'; urgencyScore = 9;
    } else if (text.includes('no water') || text.includes('water supply') || text.includes('electricity') ||
               text.includes('large pothole') || text.includes('accident')) {
      priority = 'high'; urgencyScore = 7;
    } else if (text.includes('garbage') || text.includes('drainage') || text.includes('street light') ||
               text.includes('road damage')) {
      priority = 'medium'; urgencyScore = 5;
    } else if (text.includes('minor') || text.includes('small') || text.includes('little')) {
      priority = 'low'; urgencyScore = 3;
    }

    return { priority, urgencyScore, reason: 'Classified based on complaint keywords' };
  }
};

module.exports = { classifyComplaint };