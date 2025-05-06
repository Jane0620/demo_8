// import * as db from "../services/db.js";
import axios from "axios";
import { runAsync } from "../utils/util.js";
import { normalizeStudentData } from "../utils/dbHandlers.js";
import dayjs from "dayjs";
import dotenv from "dotenv";
import { insertUploadLog } from "./insertDb.js";
dotenv.config();

/**
 * 更新資料庫的 successed 狀態
 * @param {string} tableName - 資料表名稱 (如 "wh" 或 "sight")
 * @param {string[]} pidList - 要更新的 Pid 列表
 * @param {number} successed - 更新的 successed 狀態 (1 或 0)
 * @param {string} now - 當前時間
 * @param {string} [examDate] - 可選的測量日期條件
 */
export async function updateDatabaseStatus(tableName, students, successed) {
  try {
    const now = dayjs().format("YYYY-MM-DD HH:mm:ss");

    for (const student of students) {
      const { PKNO } = student;

      const updateQuery = `
        UPDATE ${tableName}
        SET upload_time = ?, successed = ?
        WHERE PKNO = ?
      `;

      const params = [now, successed, PKNO];

      console.log("🚀 更新 SQL 語句：", updateQuery);
      console.log("🚀 更新參數：", params);

      await runAsync(updateQuery, params);
    }
  } catch (err) {
    console.error("❌ 更新測量狀態時發生錯誤：", err.message);
    throw err;
  }
}

// 上傳身高體重資料到 SHIS
export async function uploadWhToShis(token) {
  try {
    console.log("📤 後端開始查詢並上傳未成功的 WH 資料...");

    // 1. 查詢資料庫中待上傳的 WH 資料 (包含 PKNO)
    const pendingData = await getPendingWhData();
    console.log("🚀 從資料庫查詢到的待上傳 WH 資料：", pendingData);

    if (pendingData.length > 0) {
      // 2. 格式化上傳資料
      const normalizedData = normalizeStudentData(pendingData, "height-weight");
      const payload = { CheckField: 1, Students: normalizedData };
      console.log(
        "🚀 格式化後準備上傳到 SHIS 的 WH 資料：",
        JSON.stringify(payload, null, 2)
      );
      // 3. 上傳到 SHIS
      const response = await axios.put(
        `${process.env.SHIS_BASE_URL}/api/phi/wh/batch`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            "X-API-KEY": process.env.API_KEY,
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status !== 200) {
        throw new Error(`上傳 SHIS 失敗，HTTP 狀態碼：${response.status}`);
      }

      console.log("✅ 上傳 SHIS WH 結果：", response.data);

      // 4.更新資料庫的 successed 狀態
      await updateDatabaseStatus("wh", pendingData, 1);
      insertUploadLog(pendingData, 1); // 紀錄上傳成功的資料

      return response.data;
    } else {
      console.log("✅ 沒有需要上傳的 WH 資料。");
      return null;
    }
  } catch (err) {
    console.error(
      "❌ 上傳 WH 資料到 SHIS 時發生錯誤：",
      err.response?.data || err.message
    );

    // 如果上傳失敗，你可能需要將這些記錄的 successed 狀態更新為 0
    // 注意：這裡需要再次查詢失敗的記錄，或者在 catch 區塊中處理 pendingData
    // 這部分邏輯需要根據你的錯誤處理需求來設計
    const pendingData = await getPendingWhData();
    await updateDatabaseStatus("wh", pendingData, 0);
    insertUploadLog(pendingData, 0); // 紀錄上傳失敗的資料
    throw new Error(
      "上傳 WH 資料到 SHIS 失敗: " + (err.response?.data?.error || err.message)
    );
  }
}

// 上傳視力資料到 SHIS
export async function uploadSightToShis(token, data) {
  try {
    console.log("📤 後端開始查詢並上傳未成功的 WH 資料...");

    // 1. 查詢資料庫中待上傳的 WH 資料 (包含 PKNO)
    const pendingData = await getPendingSightData();
    console.log("🚀 從資料庫查詢到的待上傳 WH 資料：", pendingData);

    if (pendingData.length > 0) {
      // 2. 格式化上傳資料
      const normalizedData = normalizeStudentData(pendingData, "vision");
      const payload = { CheckField: 1, Students: normalizedData };
      console.log(
        "🚀 格式化後準備上傳到 SHIS 的 sight 資料：",
        JSON.stringify(payload, null, 2)
      );
      // 3. 上傳到 SHIS
      const response = await axios.put(
        `${process.env.SHIS_BASE_URL}/api/phi/sight/batch`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            "X-API-KEY": process.env.API_KEY,
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status !== 200) {
        throw new Error(`上傳 SHIS 失敗，HTTP 狀態碼：${response.status}`);
      }

      console.log("✅ 上傳 SHIS WH 結果：", response.data);

      // 4.更新資料庫的 successed 狀態
      await updateDatabaseStatus("sight", pendingData, 1);
      insertUploadLog(pendingData, 1); // 紀錄上傳成功的資料

      return response.data;
    } else {
      console.log("✅ 沒有需要上傳的 WH 資料。");
      return null;
    }
  } catch (err) {
    console.error(
      "❌ 上傳 WH 資料到 SHIS 時發生錯誤：",
      err.response?.data || err.message
    );

    // 如果上傳失敗，你可能需要將這些記錄的 successed 狀態更新為 0
    // 注意：這裡需要再次查詢失敗的記錄，或者在 catch 區塊中處理 pendingData
    // 這部分邏輯需要根據你的錯誤處理需求來設計
    const pendingData = await getPendingSightData();
    await updateDatabaseStatus("wh", pendingData, 0);
    insertUploadLog(pendingData, 0); // 紀錄上傳失敗的資料
    throw new Error(
      "上傳 WH 資料到 SHIS 失敗: " + (err.response?.data?.error || err.message)
    );
  }
}

// 查詢未成功上傳的資料
export async function getPendingWhData() {
  const query = `
      SELECT PKNO, pid, sid, no, grade, seat, sex, name, birth, height, weight, examDate
      FROM wh
      WHERE successed = 0 OR successed IS NULL
      ORDER BY examDate ASC
    `;
  try {
    const rows = await runAsync(query);
    console.log("🚀 待上傳的 WH 資料：", rows);
    return rows;
  } catch (err) {
    console.error("❌ 查詢待上傳資料時發生錯誤：", err.message);
    throw err;
  }
}
export async function getPendingSightData() {
  const query = `
      SELECT PKNO, pid, sid, no, grade, seat, sex, name, birth, sight0L, sight0R, sightL, sightR, examDate
      FROM sight
      WHERE successed = 0 OR successed IS NULL
      ORDER BY examDate ASC
    `;
  try {
    const rows = await runAsync(query);
    // console.log("🚀 待上傳的 sight 資料：", rows);
    return rows;
  } catch (err) {
    console.error("❌ 查詢待上傳資料時發生錯誤：", err.message);
    throw err;
  }
}
// // 通用的上傳函式
// export async function processAndUploadData(
//   studentData,
//   token,
//   measurementType
// ) {
//   const payload = { CheckField: 1, Students: [] };

//   try {
//     for (const student of studentData) {
//       await processStudentData(student, payload, measurementType);
//     }

//     if (payload.Students.length > 0) {
//       if (measurementType === "height-weight") {
//         const result = await uploadWhToShis(token, payload);
//         console.log("✅ 上傳 SHIS WH 結果：", result);
//       } else if (measurementType === "vision") {
//         const result = await uploadSightToShis(token, payload);
//         console.log("✅ 上傳 SHIS 視力結果：", result);
//       } else {
//         throw new Error(`無效的 measurementType：${measurementType}`);
//       }
//     }

//     return payload.Students; // ✅ 回傳上傳成功的資料
//   } catch (err) {
//     console.error(`❌ 上傳 ${measurementType} 資料時發生錯誤：`, err.message);
//     throw err;
//   }
// }
