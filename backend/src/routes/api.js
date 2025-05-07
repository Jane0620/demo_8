import express from "express";

import { loginToShis, getValidToken } from "../services/loginShis.js";

import * as download from "../services/downloadShis.js";
// upload
import { processStudentData } from "../utils/dbHandlers.js"; // 封裝進資料庫
import * as upload from "../services/uploadToShis.js";
import { insertUploadLog } from "../services/insertDb.js"; // 封裝進資料庫

import { getAutoWhData } from "../services/serialPortRs232.js";

import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

// 登入 SHIS 系統
let currentSchoolId = null; // 儲存最新的 schoolId
let currentToken = null; // 儲存最新的 token

router.post("/shis-login", async (req, res) => {
  const { schoolId } = req.body;

  if (!schoolId) {
    return res.status(400).json({ error: "缺少 schoolId" });
  }

  try {
    const token = await loginToShis(schoolId);
    currentSchoolId = schoolId; // 儲存 schoolId
    currentToken = token; // 儲存 token
    res.json({ token });
  } catch (err) {
    console.error("SHIS 登入失敗：", err);
    res.status(500).json({ error: "登入 SHIS 失敗" });
  }
});

export { currentSchoolId, currentToken }; // 將這些變數匯出

// 下載最新班級和學生資料
router.post("/download-classes", async (req, res) => {
  const { schoolId, token } = req.body;

  if (!schoolId || !token) {
    return res
      .status(400)
      .json({ success: false, error: "缺少 schoolId 或 Token" });
  }

  // 立即回應前端，避免請求超時
  res.json({
    success: true,
    message: "資料正在處理中，請稍後刷新頁面查看結果",
  });

  try {
    // 清空資料庫
    await download.clearClassesAndStudents();

    // 從 API 獲取班級和學生資料
    const newClasses = await download.fetchClassesFromExternalAPI(token);

    // 插入班級和學生資料
    for (const cls of newClasses) {
      await download.insertClass(cls);

      if (cls.students && cls.students.length > 0) {
        for (const student of cls.students) {
          await download.insertStudent(student);
        }
      }
    }
    console.log("✅ 資料處理完成");
  } catch (err) {
    console.error("❌ 資料處理時發生錯誤：", err);
  }
});

// 呼叫班級列表
router.get("/classes", async (req, res) => {
  const { school_id } = req.query;
  console.log("收到的 school_id:", school_id); // 確認是否收到正確的參數

  try {
    if (!school_id) {
      return res.status(400).json({ error: "缺少 school_id" });
    }
    const classes = await download.getClassesBySchoolId(school_id);
    // console.log('查詢到的班級資料:', classes); // 確認資料是否正確
    res.json(classes);
  } catch (err) {
    console.error("無法取得班級資料:", err);
    res.status(500).json({ error: "無法取得班級資料" });
  }
});
// 呼叫學生列表
router.get("/students", async (req, res) => {
  const { class_grade, class_no } = req.query;
  try {
    if (!class_grade || !class_no) {
      return res.status(400).json({ error: "缺少 class_grade 或 class_no" });
    }
    const students = await download.getStudentsByClass(class_grade, class_no);
    res.json(students);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "無法取得學生資料" });
  }
});

// 儲存量測資料
router.post("/save-student-data", async (req, res) => {
  const { studentData } = req.body;
  const measurementType = process.env.TYPE;

  if (!studentData || !Array.isArray(studentData)) {
    return res.status(400).json({ success: false, error: "無效的數據格式" });
  }

  if (!measurementType) {
    return res
      .status(400)
      .json({ success: false, error: "缺少 measurementType" });
  }

  console.log("💾 收到儲存的數據：", studentData);

  try {
    const savedCount = await processStudentData(studentData, measurementType);
    res.json({ success: true, message: `成功儲存 ${savedCount} 筆資料` });
  } catch (err) {
    console.error("❌ 儲存資料時發生錯誤：", err);
    res
      .status(500)
      .json({ success: false, error: "儲存資料失敗", details: err.message });
  }
});

// 上傳量測資料
router.post("/upload-student-data", async (req, res) => {
  const measurementType = process.env.TYPE;

  if (!measurementType) {
    return res
      .status(400)
      .json({ success: false, error: "缺少 measurementType" });
  }

  try {
    const token = await getValidToken();
    let uploadResult;

    if (measurementType === "height-weight") {
      uploadResult = await upload.uploadWhToShis(token);
    } else if (measurementType === "vision") {
      uploadResult = await upload.uploadSightToShis(token); // 你也需要修改這個函式
    }

    if (uploadResult) {
      res.json({ success: true, message: `成功上傳資料` });
    } else {
      res.json({ success: true, message: "沒有需要上傳的資料" });
    }
  } catch (err) {
    console.error("❌ 儲存並上傳資料時發生錯誤：", err);
    res
      .status(500)
      .json({
        success: false,
        error: "儲存並上傳資料失敗",
        details: err.message,
      });

    let pendingData;
    if (measurementType === "height-weight") {
      pendingData = await upload.getPendingWhData();
      await upload.handleUploadError("wh", pendingData, err.message);
    } else if (measurementType === "vision") {
      pendingData = await upload.getPendingSightData();
      await upload.handleUploadError("sight", pendingData, err.message);
    }
  }
});

// 儲存並上傳
router.post("/save-and-upload", async (req, res) => {
  const { studentData } = req.body;
  const measurementType = process.env.TYPE;

  if (!studentData || !Array.isArray(studentData)) {
    return res.status(400).json({ success: false, error: "無效的數據格式" });
  }

  if (!measurementType) {
    return res
      .status(400)
      .json({ success: false, error: "缺少 measurementType" });
  }

  console.log("🔄 收到儲存並上傳的數據：", studentData);

  try {
    // 1. 儲存資料到資料庫
    const savedCount = await processStudentData(studentData, measurementType);
    console.log(`💾 成功儲存 ${savedCount} 筆資料，開始上傳...`);

    // 2. 從資料庫取出並上傳資料
    const token = await getValidToken();
    let uploadResult;

    if (measurementType === "height-weight") {
      uploadResult = await upload.uploadWhToShis(token);
    } else if (measurementType === "vision") {
      uploadResult = await upload.uploadSightToShis(token); // 確保這個函式也已修改為從資料庫取資料
    }

    if (uploadResult) {
      res.json({
        success: true,
        message: `成功儲存 ${savedCount} 筆並上傳資料`,
      });
    } else {
      res.json({
        success: true,
        message: `成功儲存 ${savedCount} 筆資料，但沒有需要上傳的資料`,
      });
    }
  } catch (err) {
    console.error("❌ 儲存並上傳資料時發生錯誤：", err);
    res
      .status(500)
      .json({
        success: false,
        error: "儲存並上傳資料失敗",
        details: err.message,
      });

    let pendingData;
    if (measurementType === "height-weight") {
      pendingData = await upload.getPendingWhData();
      await upload.handleUploadError("wh", pendingData, err.message);
    } else if (measurementType === "vision") {
      pendingData = await upload.getPendingSightData();
      await upload.handleUploadError("sight", pendingData, err.message);
    }
  }
});

// 開始接收資料
router.get("/get-auto-data", async(req,res) => {
  getAutoWhData();
})

export default router;
