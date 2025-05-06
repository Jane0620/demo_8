import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import apiRoutes from "./routes/api.js";
import { getValidToken } from "./services/loginShis.js";
import fs from "fs";
import envRoutes from "./routes/env.js";
import { injectEnvVariables } from "./utils/injectEnvVariables.js"; // 引入注入環境變數的函數

import dotenv from "dotenv";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPath = path.join(__dirname, "../../public");

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// 啟動伺服器時自動登入
(async () => {
  try {
    await getValidToken(); // 自動登入並取得 Token
  } catch (err) {
    console.error("❌ 伺服器啟動時登入失敗：", err.message);
  }
})();

// 提供 API 讓前端獲取 Token
app.get("/api/token", async (req, res) => {
  try {
    const token = await getValidToken();
    res.json({ token });
  } catch (err) {
    console.error("❌ 無法取得有效的 Token：", err.message);
    res.status(500).json({ error: "無法取得有效的 Token" });
  }
});

// 處理根路徑
app.get("/", (req, res) => {
  const indexPath = path.join(frontendPath, "index.html");
  try {
    let html = fs.readFileSync(indexPath, "utf-8");
    html = injectEnvVariables(html);
    res.set("Cache-Control", "no-store");
    res.send(html);
  } catch (error) {
    console.error("Error reading index.html:", error);
    res.status(500).send("Internal Server Error");
  }
});

// 處理 /pages/* 路徑
app.get("/pages/*", (req, res) => {
  const pagePath = path.join(frontendPath, req.path);
  try {
    let html = fs.readFileSync(pagePath, "utf-8");
    html = injectEnvVariables(html);
    res.set("Cache-Control", "no-store");
    res.send(html);
  } catch (error) {
    console.error(`Error reading page: ${req.path}`, error);
    res.status(404).send("Page Not Found");
  }
});

// 設置靜態文件服務

app.use(express.static(frontendPath));
console.log("Frontend path:", frontendPath);

// 確保樣式檔案的路徑正確
app.use("/styles", express.static(path.join(frontendPath, "styles")));
app.use("/assets", express.static(path.join(frontendPath, "assets")));
app.use("/components", express.static(path.join(frontendPath, "components")));

app.use("/api", apiRoutes);
app.use("/api/env", envRoutes);

const PORT = process.env.PORT;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Network access: http://172.20.10.5:${PORT}`);
});
