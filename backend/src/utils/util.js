
import db from './db.js';

// 多個db.run
export function runAsync(query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('SQL 執行錯誤：', err.message);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}