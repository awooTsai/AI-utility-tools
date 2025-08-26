// api/analyze.js

export default async function handler(req, res) {
  // 1. 只接受 POST 請求
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // 2. 從 Vercel 的安全環境中讀取 API Key
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("API Key is not configured.");
    return res.status(500).json({ error: { message: "伺服器設定錯誤：缺少 API Key。" } });
  }

  try {
    // 3. 將前端傳來的 prompt 送到 OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      // 將前端傳來的 body 直接轉發
      body: JSON.stringify(req.body) 
    });

    const data = await response.json();

    // 4. 如果 OpenAI 回傳錯誤，將錯誤訊息回傳給前端
    if (!response.ok) {
      console.error("OpenAI API Error:", data);
      throw new Error(data.error?.message || `API 請求失敗，狀態碼: ${response.status}`);
    }

    // 5. 將 OpenAI 的成功結果回傳給前端
    return res.status(200).json(data);

  } catch (error) {
    console.error("Internal Server Error:", error);
    return res.status(500).json({ error: { message: error.message || '伺服器內部發生未知錯誤。' } });
  }
}
