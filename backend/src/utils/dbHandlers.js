// import db from '../services/db.js';
import { insertHeightWeight, insertVision } from "../services/insertDb.js";

// 封裝
export async function processStudentData(studentData, type) {
  let savedCount = 0;
  for (const student of studentData) {
    if (type === "height-weight") {
      if (student.Height && student.Weight && student.ExamDate && student.Pid) {
        await insertHeightWeight(
          student.Pid,
          student.Sid || "",
          student.No,
          student.Grade,
          student.Seat,
          null,
          student.Name || "",
          null,
          student.Height,
          student.Weight,
          student.ExamDate
        );
        savedCount++;
      }
    } else if (type === "vision") {
      const hasSightData = [
        student.Sight0L,
        student.Sight0R,
        student.SightL,
        student.SightR,
      ].some((val) => val !== undefined && val !== null);

      if (hasSightData && student.ExamDate && student.Pid) {
        await insertVision(
          student.Pid,
          student.Sid || "",
          student.No,
          student.Grade,
          student.Seat,
          null,
          student.Name || "",
          null,
          student.Sight0L,
          student.Sight0R,
          student.SightL,
          student.SightR,
          student.ExamDate
        );
        savedCount++;
      }
    }
  }
  return savedCount; // 返回成功儲存的筆數
}

export function normalizeStudentData(data, type) {
  if (type === "height-weight") {
    return data.map((student) => ({
      Pid: student.pid || student.Pid,
      Sid: student.sid || student.Sid || "",
      No: student.no || student.No,
      Grade: student.grade || student.Grade,
      Seat: student.seat || student.Seat,
      Name: student.name || student.Name,
      Height: student.height || student.Height,
      Weight: student.weight || student.Weight,
      ExamDate: student.examDate || student.ExamDate,
    }));
  } else if (type === "vision") {
    return data.map((student) => ({
      Pid: student.pid || student.Pid,
      Sid: student.sid || student.Sid || "",
      No: student.no || student.No,
      Grade: student.grade || student.Grade,
      Seat: student.seat || student.Seat,
      Name: student.name || student.Name,
      Sight0L: student.sight0L || student.Sight0L,
      Sight0R: student.sight0R || student.Sight0R,
      SightL: student.sightL || student.SightL,
      SightR: student.sightR || student.SightR,
      ExamDate: student.examDate || student.ExamDate,
    }));
  }
}

// export function mergeAndDeduplicateData(pendingData, newData, type) {
//   // 格式化資料
//   const normalizedPendingData = normalizeStudentData(pendingData, type);
//   const normalizedNewData = normalizeStudentData(newData, type);

//   // 合併資料
//   const combinedData = [...normalizedPendingData, ...normalizedNewData];

//   // 去重
//   return combinedData.filter(
//     (item, index, self) =>
//       index ===
//       self.findIndex((t) => t.Pid === item.Pid && t.ExamDate === item.ExamDate)
//   );
// }
