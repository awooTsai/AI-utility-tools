export default async function handler(req, res) {
  // 1. 只接受 POST 請求
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // 2. 從 Vercel 的安全環境中讀取 API Key
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("CRITICAL: OPENAI_API_KEY was not found in process.env.");
    return res.status(500).json({ error: { message: "伺服器設定錯誤：在 Vercel 後端環境中找不到名為 OPENAI_API_KEY 的環境變數。" } });
  }

  const { prompt } = req.body;
  if (!prompt) {
      return res.status(400).json({ error: { message: "請求錯誤：缺少 'prompt' 欄位。" } });
  }

  try {
    // 3. 將前端傳來的 prompt 送到 OpenAI (直接使用內建的 fetch)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo-1106",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      }) 
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI API Error:", data);
      throw new Error(data.error?.message || `API 請求失敗，狀態碼: ${response.status}`);
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error("Internal Server Error during OpenAI call:", error);
    return res.status(500).json({ error: { message: error.message || '伺服器內部發生未知錯誤。' } });
  }
}
