import { runAsync } from "../utils/util";
import { getCardUid } from "../utils/getCardUid";

// 根據卡號尋找學生
export async function findStudentByCardUid(cardUid) {
    const query = `
        SELECT * FROM students WHERE card_uid = ?;
    `;
    const result = await runAsync(query, [cardUid]);
    return result[0]; // 返回第一個匹配的學生
}