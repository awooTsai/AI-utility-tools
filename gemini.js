// /api/gemini.js - 適用於純 HTML 專案的 Vercel Serverless Function
module.exports = async (req, res) => {
  // CORS 設定
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "僅支援 POST 請求" });
  }

  try {
    // 手動解析 request body（重要！）
    let rawBody = "";
    await new Promise((resolve, reject) => {
      req.on("data", (chunk) => (rawBody += chunk));
      req.on("end", resolve);
      req.on("error", reject);
    });

    let requestData = {};
    if (rawBody) {
      try {
        requestData = JSON.parse(rawBody);
      } catch (e) {
        return res.status(400).json({ 
          error: "JSON 格式錯誤", 
          details: e.message 
        });
      }
    }

    const { prompt } = requestData;
    if (!prompt) {
      return res.status(400).json({ error: "缺少 prompt 參數" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: "API Key 未設定",
        details: "請檢查 Vercel 環境變數 GEMINI_API_KEY" 
      });
    }

    // 使用 Vercel 內建的 fetch（Node.js 18+）
    const endpoint = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Gemini API 請求失敗",
        status: response.status,
        details: data,
      });
    }

    const resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    return res.status(200).json({ result: resultText });

  } catch (error) {
    return res.status(500).json({
      error: "伺服器內部錯誤",
      details: error.message,
      stack: error.stack,
    });
  }
};
