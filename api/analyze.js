export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }
  if (req.method !== 'POST') return res.status(405).end();
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { asset } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  const prompt = `You are a professional financial analyst. Analyze the current fundamental bias for ${asset} based on the latest news, economic data, central bank policy, geopolitical events, and market sentiment.

Return ONLY a valid JSON object in this exact format (no markdown, no extra text):
{
  "score": <number between -5 and 5, where -5 is extremely bearish and 5 is extremely bullish>,
  "bias": "<STRONG BULLISH | BULLISH | NEUTRAL | BEARISH | STRONG BEARISH>",
  "summary": "<2-3 sentence summary of current fundamental outlook>",
  "keyFactors": ["<factor 1>", "<factor 2>", "<factor 3>"]
}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ googleSearch: {} }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 1024 }
        })
      }
    );

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data });

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return res.status(500).json({ error: { message: 'No response from Gemini' } });

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ error: { message: 'Could not parse response' } });

    res.status(200).json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
}
