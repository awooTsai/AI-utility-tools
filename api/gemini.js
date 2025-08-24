// api/gemini.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "方法不支援" });
  }
  try {
    const { prompt } = req.body;

    // 使用環境變數中的 GEMINI_API_KEY
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );
    const data = await response.json();
    return res.status(200).json({ result: data.candidates[0].content.parts[0].text });
  } catch (error) {
    return res.status(500).json({ error: "伺服器發生錯誤" });
  }
}
