export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "方法不支援" });
  }
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "缺少 prompt" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY 未設定");
      return res.status(500).json({ error: "API Key 未設定" });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API response error:", data);
      return res.status(500).json({ error: data.error?.message || "API 請求失敗" });
    }

    return res.status(200).json({ result: data.candidates[0].content.parts[0].text });
  } catch (error) {
    console.error("API 呼叫錯誤: ", error);
    return res.status(500).json({ error: error.message || "伺服器發生錯誤" });
  }
}
