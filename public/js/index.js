// js/index.js
import { getEnv } from './util.js';
import './header.js'; // 這樣也會執行 header.js 的 DOM 操作

const API_BASE_URL = getEnv('API_BASE_URL');
const SCHOOL_ID = getEnv('SCHOOL_ID');

async function initialize() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/token`);
    if (!response.ok) throw new Error("無法取得 Token");

    const { token } = await response.json();
    localStorage.setItem("shis_token", token);
    localStorage.setItem("school_id", SCHOOL_ID);

    window.location.href = "./pages/3.html";
  } catch (err) {
    console.error("初始化失敗：", err);
    document.body.innerHTML = "<p>系統初始化失敗，請稍後再試。</p>";
  }
}

initialize();
