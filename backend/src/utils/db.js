import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

// 模擬 __dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 從 .env 中讀取資料庫路徑
const dbPath = path.resolve(__dirname, process.env.DB_PATH);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('無法連接到資料庫：', err.message);
  } else {
    console.log('成功連接到資料庫');
  }
});

export default db;

// 查詢身高體重
// 前端沒開放
export function getHeightWeight(classGrade, classNo) {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM wh WHERE grade = ? AND no = ?';
    db.all(query, [classGrade, classNo], (err, rows) => {
      if (err) {
        console.error('查詢錯誤：', err);
        reject(err);
      } else {
        console.log('查詢結果：', rows); // ✅ debug 用
        resolve(rows);
      }
    });
  });
}