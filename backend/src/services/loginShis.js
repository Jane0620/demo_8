import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

let currentToken = null; // 緩存 Token
let tokenExpiryTime = null; // Token 過期時間

// 登入 SHIS 系統，獲取 Token
export async function loginToShis(schoolId) {
  console.log("🔄 正在登入 SHIS 系統...");
  const res = await fetch(`${process.env.SHIS_BASE_URL}/api/vendor/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': process.env.API_KEY
    },
    body: JSON.stringify({ SchoolId: schoolId })
  });

  const result = await res.json();

  if (result.result && result.data?.token) {
    currentToken = result.data.token;
    tokenExpiryTime = Date.now() + 24 * 60 * 60 * 1000; // 假設 Token 有效期為 24 小時
    console.log("✅ 登入成功，取得 Token:",currentToken);
    return currentToken;
  } else {
    throw new Error('❌ 登入失敗，無法取得 Token');
  }
}

// 獲取有效的 Token，自動刷新
export async function getValidToken() {
  const schoolId = process.env.SCHOOL_ID;

  // 如果沒有 Token 或 Token 已過期，重新登入
  if (!currentToken || Date.now() >= tokenExpiryTime) {
    console.log("🔄 Token 已過期或不存在，重新登入...");
    await loginToShis(schoolId);
  }

  return currentToken;
}