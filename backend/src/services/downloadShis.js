import axios from 'axios';

import { runAsync } from '../utils/util.js';
import dotenv from 'dotenv';
dotenv.config();

// 下載最新的班級學生資料
// 當前端點及下載按鈕，資料庫全部清空並全部載入新資料

// 清空資料庫
export function clearClassesAndStudents() {
    const queries = [
        'DELETE FROM classes;',
        'DELETE FROM students;',
        'DELETE FROM wh;',
        'DELETE FROM sight;'
    ];

    return Promise.all(queries.map(query => runAsync(query)))
        .then(() => console.log('✅ 資料庫清空成功'))
        .catch(err => {
            console.error('❌ 清空資料庫時發生錯誤：', err);
            throw err;
        });
}

// 插入班級資料
// 這裡的班級資料是從 API 獲取的
export function insertClass(cls) {
    const query = `
      INSERT INTO classes (class_id, grade, no, name, school_id)
      VALUES (?, ?, ?, ?, ?);
    `;
    return runAsync(query, [cls.id, cls.grade, cls.no, cls.name, cls.schoolId]);
}

// 插入學生資料
// 這裡的學生資料是從 API 獲取的
export function insertStudent(student) {
    const query = `
      INSERT INTO students (pid, sid, class_grade, class_no, seat, name, sex, birth)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `;
    return runAsync(query, [student.pid, student.sid, student.class_grade, student.class_no, student.seat, student.name, student.sex, student.birth]);
}

// 從南華 API 獲取最新的班級資料
export async function fetchClassesFromExternalAPI(token) {
    try {
        // 呼叫班級資料 API
        const response = await axios.get(`${process.env.SHIS_BASE_URL}/api/classes`, {
            headers: {
                'X-API-KEY': process.env.API_KEY, // 如果需要 API KEY
                'Authorization': `Bearer ${token}`
            }
        });
        console.log('🚀 呼叫 API 的網址，班級：', `${process.env.SHIS_BASE_URL}/api/classes`);
        // console.log('API 回傳的班級資料：', response.data);

        // 確保回傳的班級資料格式正確
        if (!response.data || !Array.isArray(response.data.data)) {
            throw new Error('班級 API 回傳的班級資料格式不正確');
        }

        const classes = response.data.data;

        // 依據每個班級直接呼叫學生名單 API
        for (const cls of classes) {
            try {
                const studentResponse = await axios.get(`${process.env.SHIS_BASE_URL}/api/grades/${cls.grade}/students`, {
                    headers: {
                        'X-API-KEY': process.env.API_KEY,
                        'Authorization': `Bearer ${token}`
                    }
                });
                console.log(`🚀 呼叫 API 的網址，學生：${process.env.SHIS_BASE_URL}/api/grades/${cls.grade}/students`);
                // console.log(`年級 ${cls.grade} 的學生資料：`, studentResponse.data);

                // 確保學生資料格式正確
                if (studentResponse.data && Array.isArray(studentResponse.data.data)) {
                    const matchedStudents = studentResponse.data.data
                        .filter(student => student.classGrade === cls.grade && student.classNo === cls.no)
                        .map(student => ({
                            pid: student.pid,
                            sid: student.sid || '',
                            class_grade: student.classGrade,
                            class_no: student.classNo,
                            seat: student.seat,
                            name: student.name,
                            sex: student.sex,
                            birth: student.birth
                        }));

                    cls.students = matchedStudents;
                } else {
                    console.warn(`⚠️ 年級 ${cls.grade} 的學生資料格式不正確`);
                    cls.students = [];
                }
            } catch (err) {
                console.error(`❌ 無法取得年級 ${cls.grade} 的學生資料：`, err.response?.data || err.message);
                cls.students = []; // 若發生錯誤，設為空陣列
            }
        }
        return classes; // 回傳包含學生資料的班級資料
    } catch (err) {
        console.error('❌ 取得資料失敗：', err.response?.data || err.message);
        throw new Error('無法從外部 API 獲取資料: ' + (err.response?.data?.error || err.message));
    }
}
// 學生列表
export function getStudentsByClass(classGrade, classNo) {
    const query = 'SELECT * FROM students WHERE class_grade = ? AND class_no = ?';
    return runAsync(query, [classGrade, classNo]);
}
// 班級列表
export function getClassesBySchoolId(schoolId) {
    console.log('執行 SQL 查詢，schoolId:', schoolId); // 確認參數
    const query = 'SELECT * FROM classes WHERE school_id = ?';
    return runAsync(query, [schoolId]);
}