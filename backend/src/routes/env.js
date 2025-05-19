// routes/env.js
import express from "express";
import fs from "fs";
import path from "path";
// import { fileURLToPath } from "url";
import { exec } from "child_process";

const router = express.Router();
const envPath = path.join(process.cwd(), ".env");

function parseEnvFile(content) {
  const lines = content.split("\n");
  const env = {};
  for (let line of lines) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const [key, ...rest] = line.split("=");
    env[key.trim()] = rest.join("=").trim();
  }
  return env;
}

function stringifyEnv(envObj) {
  return Object.entries(envObj)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
}

// ✅ GET 取得目前的設定
router.get("/", (req, res) => {
  try {
    const content = fs.readFileSync(envPath, "utf-8");
    const envObj = parseEnvFile(content);
    res.json({ success: true, env: envObj });
  } catch (err) {
    res.status(500).json({ success: false, error: "無法讀取 .env 檔案" });
  }
});

// ✅ POST 修改設定
router.post("/", (req, res) => {
  const updates = req.body; // 這裡的 updates 只會包含前端發送過來的鍵值對
  const allowedKeys = [
    "TYPE",
    "SCHOOL_ID",
    "SCHOOL_NAME",
    "API_KEY",
    "SERIAL_PATH",
    "BAUDRATE",
    "DATABITS",
    "STOPBITS",
    "DOWNLOAD_URL",
    "UPLOAD_URL", // 這裡的 UPLOAD_URL 是一個陣列
    // 確保這裡包含 upload-time 分頁可能新增的 key
    "UPLOAD_TIME_PERIOD", // 如果你使用了這個 key
    "UPLOAD_TIME_VALUE",  // 如果你使用了這個 key
    "DATA_FORMAT",        // 如果你使用了這個 key
  ];

  try {
    const original = fs.readFileSync(envPath, "utf-8");
    const envObj = parseEnvFile(original);

    for (const key of allowedKeys) {
      if (key in updates) { // 只有當這個 key 在 updates 物件中存在時，才會進行更新
        if (key === "UPLOAD_URL" && Array.isArray(updates[key])) {
          envObj[key] = updates[key].join(",");
        } else {
          envObj[key] = updates[key];
        }
      }
      // 如果 key 不在 updates 中，那麼 envObj[key] 的值會維持原始的 .env 檔案中的值，不會被改變。
    }

    const newContent = stringifyEnv(envObj);
    fs.writeFileSync(envPath, newContent, "utf-8");

    res.json({ success: true, message: ".env 已更新，伺服器將重新啟動" });
    setTimeout(() => {
      console.log("✅ .env 已更新，準備重新啟動伺服器...");
      process.exit(0); // 退出當前進程
    }, 200); // 延遲 200ms，確保回應已送出

  } catch (err) {
    console.error("❌ 更新失敗：", err);
    res.status(500).json({ success: false, error: "寫入失敗" });
    console.error("❌ 回應錯誤已發送:", { success: false, error: "寫入失敗" });
  }
});

export default router;
