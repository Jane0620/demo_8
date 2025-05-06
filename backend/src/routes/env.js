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
  const updates = req.body;
  const allowedKeys = [
    "TYPE",
    "SCHOOL_ID",
    "SCHOOL_NAME",
    "API_KEY",
    "DOWNLOAD_URL",
    "UPLOAD_URL",
  ];

  try {
    const original = fs.readFileSync(envPath, "utf-8");
    const envObj = parseEnvFile(original);

    for (const key of allowedKeys) {
      if (key in updates) {
        if (key === "UPLOAD_URL" && Array.isArray(updates[key])) {
          envObj[key] = updates[key].join(",");
        } else {
          envObj[key] = updates[key];
        }
      }
    }

    const newContent = stringifyEnv(envObj);
    fs.writeFileSync(envPath, newContent, "utf-8");

    res.json({ success: true, message: ".env 已更新，伺服器將重新啟動" });
    

  } catch (err) {
    console.error("❌ 更新失敗：", err);
    res.status(500).json({ success: false, error: "寫入失敗" });
    console.error("❌ 回應錯誤已發送:", { success: false, error: "寫入失敗" });
  }
});

export default router;
