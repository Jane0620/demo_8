// import axios from 'axios';
import dayjs from "dayjs";
import { runAsync } from "../utils/util.js";
import dotenv from "dotenv";
dotenv.config();

// 輸入身高體重
export function insertHeightWeight(
  studentId,
  sid,
  no,
  grade,
  seat,
  sex,
  name,
  birth,
  height,
  weight,
  date
) {
  if (!date || typeof date !== "string" || date.trim() === "") {
    console.error("❌ 無效的 date 值：", date);
    throw new Error("缺少 date，無法插入身高體重資料");
  }
  const query = `
    INSERT INTO wh (pid, sid, no, grade, seat, sex, name, birth, height, weight, examDate)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;
  // console.log('🚀 插入資料庫的 SQL 語句：', query);
  console.log("🚀 插入資料庫的參數：", [
    studentId,
    sid,
    no,
    grade,
    seat,
    sex,
    name,
    birth,
    height,
    weight,
    date,
  ]);

  return runAsync(query, [
    studentId,
    sid,
    no,
    grade,
    seat,
    sex,
    name,
    birth,
    height,
    weight,
    date,
  ])
    .then(() => console.log("✅ 資料庫插入成功"))
    .catch((err) => console.error("❌ 資料庫插入失敗：", err));
}

// 輸入視力
export function insertVision(
  studentId,
  sid,
  no,
  grade,
  seat,
  sex,
  name,
  birth,
  Sight0L,
  Sight0R,
  SightL,
  SightR,
  date
) {
  if (!date || typeof date !== "string" || date.trim() === "") {
    console.error("❌ 無效的 date 值：", date);
    throw new Error("缺少 date，無法插入視力資料");
  }

  const query = `
    INSERT INTO sight (pid, sid, no, grade, seat, sex, name, birth, sight0L, sight0R, sightL, sightR, examDate)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;
  // console.log('🚀 插入資料庫的 SQL 語句：', query);
  // console.log('🚀 插入資料庫的參數：', [studentId, sid, no, grade, seat, sex, name, birth, Sight0L, Sight0R, SightL, SightR, formattedDate]);

  return runAsync(query, [
    studentId,
    sid,
    no,
    grade,
    seat,
    sex,
    name,
    birth,
    Sight0L,
    Sight0R,
    SightL,
    SightR,
    date
  ])
    .then(() => console.log("✅ 資料庫插入成功"))
    .catch((err) => console.error("❌ 資料庫插入失敗：", err));
}

export function insertUploadLog(combinedData, successed) {
  // 提取所有資料的 Name 值，並用逗號分隔
  const names = combinedData.map((item) => item.name || "").join(", ");

  const now = dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss"); // 獲取當前時間

  const query = `
    INSERT INTO upload_log (data, upload_time, successed)
    VALUES (?, ?, ?);
  `;

  return runAsync(query, [names, now, successed])
    .then(() => console.log("✅ 上傳紀錄插入成功"))
    .catch((err) => console.error("❌ 上傳紀錄插入失敗：", err));
}

export function getStudentByPid(pid) {
  const query = `
    SELECT * FROM wh WHERE pid = ?;
  `;
  return runAsync(query, [pid])
    .then((rows) => {
      if (rows.length > 0) {
        return rows[0]; // 返回第一條記錄
      } else {
        throw new Error("找不到該學生的資料");
      }
    })
    .catch((err) => console.error("❌ 查詢學生資料失敗：", err));
}
