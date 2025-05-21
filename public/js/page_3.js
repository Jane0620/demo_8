import { domReady, getAuthData, formatToISO8601UTC } from "./util.js";

const messageElement = document.getElementById("message");
const iconElement = document.getElementById("icon");

// 追蹤當前刷卡的學生資料和測量數據
let currentScannedStudent = null;
let currentMeasurementData = null; // 儲存最近一次接收到的身高體重數據
let measurementTimeoutId = null;

async function initPage() {
  domReady();
  initializeWebSocket();
  resetDisplay();
}
initPage();

function resetDisplay() {
  if (measurementTimeoutId) {
    clearTimeout(measurementTimeoutId);
    measurementTimeoutId = null;
  }
  if (messageElement) {
    messageElement.textContent = "請刷卡進行量測";
  }
  if (iconElement) {
    // 檢查元素是否存在
    iconElement.src = "/assets/card.svg"; // 恢復初始圖示
  }
  currentScannedStudent = null;
  currentMeasurementData = null; // 重置測量數據
}

// 延遲後重置顯示
function resetDisplayAfterDelay(delay) {
  setTimeout(() => {
    resetDisplay();
  }, delay);
}
// 建立連線
function initializeWebSocket() {
  /* 
     假設你的後端 WebSocket 伺服器運行在相同的域名和端口，路徑為 '/ws' (如果沒有指定路徑，預設就是 '/' )
     如果你的後端伺服器和端口與前端不同，請替換為正確的 URL
     例如： const ws = new WebSocket('ws://localhost:3000');
     注意：window.env.API_BASE_URL 通常用於 REST API，WebSocket 通常使用 ws:// 或 wss:// 協定
     伺服器是 http://localhost:3000，則 WebSocket 連線是 ws://localhost:3000 
  */

  const ws = new WebSocket(
    `${window.location.protocol === "https:" ? "wss" : "ws"}://${
      window.location.host
    }`
  ); // 假設WebSocket和HTTP服務器共享相同的host和port

  ws.onopen = () => {
    console.log("Connected to WebSocket server");
    messageElement.textContent = "請刷卡進行量測";
  };

  ws.onmessage = async (event) => {
    try {
      const receivedData = JSON.parse(event.data);
      console.log("Received data via WebSocket:", receivedData);

      // 根據接收到的資料類型進行處理
      if (receivedData.type === "studentInfo") {
        // updateStudentInfoDisplay(receivedData.data, receivedData.message);
        handleStudentInfo(receivedData);
      } else if (receivedData.type === "error") {
        handleError(receivedData.message);
      } else {
        // 處理來自串口或其他部分的資料，例如處理processedData
        // console.log("Received measurement data:", receivedData);
        // 如果有其他需要顯示的串口數據，可以在這裡處理
        await handleMeasurementData(receivedData);
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
      messageElement.textContent = "資料解析錯誤";
      setTimeout(() => {
        messageElement.textContent = "請刷卡進行量測";
      }, 3000); // 3 秒後恢復
    }
  };

  ws.onclose = () => {
    console.log(
      "Disconnected from WebSocket server. Attempting to reconnect in 3 seconds..."
    );
    messageElement.textContent = "連線已斷開，嘗試重新連線...";
    setTimeout(initializeWebSocket, 3000); // 斷線後嘗試重新連接
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
    messageElement.textContent = "WebSocket 連線錯誤";
  };
}

function updateStudentInfoDisplay(studentData, message) {
  if (studentData) {
    messageElement.textContent = `${studentData.name} 進行量測`;
    iconElement.src = "/assets/student.svg"; // 顯示成功的圖示
    // 您可以在這裡添加更多邏輯來顯示學生的其他資訊，例如學號、班級等
    // 例如：const studentDetailsElement = document.getElementById('student-details');
    // 如果有更多要顯示的區塊，可以在這裡更新
  } else {
    // 未找到學生或訊息提示
    messageElement.textContent = message || "未找到匹配的學生資訊";
    // 短暫顯示後恢復初始提示
    setTimeout(() => {
      iconElement.src = "/assets/card.svg"; // 恢復初始圖示
      messageElement.textContent = "請刷卡進行量測";
    }, 3000); // 3 秒後恢復
  }
}

function handleStudentInfo(receivedData) {
  if (measurementTimeoutId) {
    clearTimeout(measurementTimeoutId);
    measurementTimeoutId = null;
  }
  if (receivedData.data) {
    currentScannedStudent = receivedData.data; // 儲存當前刷卡的學生資料
    updateStudentInfoDisplay(currentScannedStudent, receivedData.message);
    currentMeasurementData = null; // 清空舊的測量數據

    console.log(`已設定當前刷卡學生為: ${currentScannedStudent.name}`);

    // 開始 15 秒的測量超時計時器
    measurementTimeoutId = setTimeout(() => {
      console.warn("測量超時：15 秒內未收到身高體重數據。");
      if (messageElement) messageElement.textContent = "測量超時，請重新刷卡。";
      resetDisplayAfterDelay(3000); // 3 秒後重置顯示
    }, 15000); // 15000 毫秒 = 15 秒
  } else {
    // 如果沒有找到學生資料，顯示錯誤訊息
    currentScannedStudent = null; // 未找到學生，重設
    messageElement.textContent = receivedData.message || "未找到匹配的學生資訊";
    setTimeout(() => {
      messageElement.textContent = "請刷卡進行量測";
    }, 3000); // 3 秒後恢復
  }
}
function handleError(errorMessage) {
  if (messageElement) messageElement.textContent = `錯誤：${errorMessage}`;
  if (iconElement) iconElement.src = "/assets/card.svg"; // 恢復初始圖示
  resetDisplayAfterDelay(3000);
}

async function handleMeasurementData(receivedData) {
  if (measurementTimeoutId) {
    clearTimeout(measurementTimeoutId);
    measurementTimeoutId = null;
  }
  // 假設 receivedData 包含身高和體重的數據
  if (receivedData.height && receivedData.weight) {
    currentMeasurementData = receivedData; // 儲存最近一次接收到的身高體重數據
    messageElement.textContent = `身高: ${receivedData.height} cm, 體重: ${receivedData.weight} kg`;
    handleSaveUpload();
  } else {
    messageElement.textContent = "無效的測量數據";
  }
}

async function handleSaveUpload() {
  if (!currentScannedStudent || !currentMeasurementData) {
    console.error("當前沒有學生或測量數據可供上傳");
    if (messageElement)
      messageElement.textContent = "上傳失敗，請確認學生和測量數據";
    resetDisplayAfterDelay(3000); // 3 秒後恢復
    return; // 結束函數
  }

  // 格式化日期時間為 ISO 8601 UTC 帶時區偏移量
  const examDateFormatted = currentMeasurementData.date
    ? formatToISO8601UTC(currentMeasurementData.date)
    : formatToISO8601UTC(new Date().toISOString()); // 如果沒有日期，使用當前時間

  const dataToUpload = {
    Pid: currentScannedStudent.pid, // 統一證號
    Sid: currentScannedStudent.student_id || "", // 學號 (如果沒有則為空字串)
    No: parseInt(currentScannedStudent.class_no, 10) || 0, // 班級號碼 (確保是數字)
    Grade: parseInt(currentScannedStudent.class_grade, 10) || 0, // 班級年級 (確保是數字)
    Seat: parseInt(currentScannedStudent.seat_no, 10) || 0, // 座號 (假設學生資料中有 seat_no，確保是數字)
    Height: parseFloat(currentMeasurementData.height) || 0, // 身高 (確保是數字)
    Weight: parseFloat(currentMeasurementData.weight) || 0, // 體重 (確保是數字)
    ExamDate: examDateFormatted, // <--- 將鍵名改為 ExamDate
    Name: currentScannedStudent.name || "", // 添加 Name 字段，雖然後端檢查時沒有用到，但 insertHeightWeight 需要
    // 如果還有其他測量數據，也一併包含進來，例如：
    // Sight0L: currentMeasurementData.Sight0L,
    // Sight0R: currentMeasurementData.Sight0R,
    // SightL: currentMeasurementData.SightL,
    // SightR: currentMeasurementData.MeasurementData.SightR, // 如果在 MeasurementData 內部
    // gender: currentMeasurementData.gender, // 如果串口數據有性別
  };
  console.log("要上傳的數據:", dataToUpload);
  const auth = getAuthData(); // 假設 getAuthData 來自 util.js
  if (!auth || !auth.token) {
    console.error("尚未登入或 token 遺失，請重新登入！");
    if (messageElement) messageElement.textContent = "上傳失敗：請重新登入！";
    resetDisplayAfterDelay(3000);
    return;
  }

  const measurementType = window.env.MEASUREMENT_TYPE; // 從 localStorage 獲取
  if (!measurementType) {
    console.error("未找到 measurementType，無法上傳。");
    if (messageElement)
      messageElement.textContent = "上傳失敗：未設定量測類型！";
    resetDisplayAfterDelay(3000);
    return;
  }

  const payload = {
    studentData: [dataToUpload], // API 通常期望一個學生數據的陣列，即使只有一個
    token: auth.token,
    measurementType: measurementType,
  };

  if (messageElement) messageElement.textContent = "正在上傳數據...";
  console.log("發送到後端的數據：", payload.studentData);

  try {
    const response = await fetch(
      `${window.env.API_BASE_URL}/api/save-and-upload`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "無法解析錯誤響應" }));
      throw new Error(
        `伺服器錯誤 ${response.status}: ${
          errorData.message || response.statusText
        }`
      );
    }

    const result = await response.json();

    if (result.success) {
      if (messageElement) messageElement.textContent = "數據已成功儲存！";
      console.log("數據已成功儲存！", result);
      // 上傳成功後，重置所有顯示並等待下一次刷卡
      resetDisplayAfterDelay(2000); // 短暫顯示成功後重置頁面
    } else {
      if (messageElement)
        messageElement.textContent =
          "儲存失敗：" + (result.error || "未知錯誤");
      console.error("儲存失敗：", result.error || "未知錯誤");
      resetDisplayAfterDelay(3000);
    }
  } catch (err) {
    console.error("儲存數據時發生錯誤：", err);
    if (messageElement)
      messageElement.textContent = "儲存數據時發生錯誤：" + err.message;
    resetDisplayAfterDelay(3000);
  }
}
