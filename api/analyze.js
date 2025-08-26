Vercel API 金鑰偵錯指南：找出問題的根源
當您確認所有設定都正確，但 API Key 依然讀取失敗時，我們需要透過 Vercel 的即時日誌 (Logs) 來查看伺服器內部的真實情況。

步驟一：更新後端檔案以加入診斷日誌
請將您 GitHub 儲存庫中的 api/analyze.js 檔案，完整替換為以下這段加入了診斷功能的程式碼。

進入您的 GitHub 儲存庫 (AI-utility-tools)。

點擊進入 api 資料夾，然後點擊 analyze.js 檔案。

點擊右上角的編輯按鈕 (鉛筆圖示)。

刪除所有舊的程式碼，並將以下全新的程式碼完整貼上：

// 檔案路徑: /api/analyze.js

export default async function handler(req, res) {
  // ✨ 診斷點 1：確認後端函數是否被成功觸發
  console.log("api/analyze function invoked at:", new Date().toISOString());

  // ✨ 診斷點 2：列出所有 Vercel 提供的環境變數的「名稱」
  // 這可以讓我們確認 Vercel 是否有將變數載入到環境中
  // 為安全起見，我們只印出變數的名稱 (key)，絕不印出值 (value)
  console.log("Available environment variable keys:", Object.keys(process.env));

  // 1. 只接受 POST 請求
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // 2. 從 Vercel 的安全環境中讀取 API Key
  const apiKey = process.env.OPENAI_API_KEY;

  // ✨ 診斷點 3：明確回報 API Key 是否成功讀取
  if (!apiKey) {
    console.error("CRITICAL: OPENAI_API_KEY was not found in process.env.");
    // 回傳一個更詳細的錯誤訊息給前端
    return res.status(500).json({ error: { message: "伺服器設定錯誤：在 Vercel 後端環境中找不到名為 OPENAI_API_KEY 的環境變數。請檢查 Vercel 儀表板中的設定與部署狀態。" } });
  }

  const { prompt } = req.body;
  if (!prompt) {
      return res.status(400).json({ error: { message: "請求錯誤：缺少 'prompt' 欄位。" } });
  }

  try {
    // 3. 將前端傳來的 prompt 送到 OpenAI
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
