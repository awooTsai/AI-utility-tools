export default async function handler(req, res) {
  if (req.method !== 'POST') {
    console.error('方法不支援', req.method);
    return res.status(405).json({ error: '方法不支援' });
  }
  try {
    const { prompt } = req.body;
    if (!prompt) {
      console.error('缺少 prompt');
      return res.status(400).json({ error: '缺少 prompt' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY 未設定');
      return res.status(500).json({ error: 'API Key 未設定' });
    }

    // 建議測試最穩定模型，如果失敗可以改為 'gemini-1.5-pro'
    const endpoint = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });

    const data = await response.json();

    // 加強日誌，方便查問題
    console.error('Gemini API Response Status:', response.status, 'Body:', data);

    if (!response.ok) {
      return res.status(500).json({
        error: data.error?.message || 'API 請求失敗',
        detail: data,
      });
    }

    // 回傳 AI 回應本體
    return res.status(200).json({
      result: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
    });
  } catch (error) {
    console.error('伺服器執行異常:', error);
    return res.status(500).json({ error: error.message || '伺服器發生錯誤' });
  }
}
