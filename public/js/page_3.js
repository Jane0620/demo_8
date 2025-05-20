import { domReady } from "./util.js";

const messageElement = document.getElementById("message");

// 追蹤當前刷卡的學生資料和測量數據
let currentScannedStudent = null;
let currentMeasurementData = null; // 儲存最近一次接收到的身高體重數據

async function initPage() {
  domReady();
  initializeWebSocket();
  resetDisplay();
}
initPage();

function resetDisplay() {
  if (messageElement) {
    messageElement.textContent = "請刷卡進行量測";
  }
  currentScannedStudent = null;
  currentMeasurementData = null; // 重置測量數據
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

  ws.onmessage = (event) => {
    try {
      const receivedData = JSON.parse(event.data);
      console.log("Received data via WebSocket:", receivedData);

      // 根據接收到的資料類型進行處理
      if (receivedData.type === "studentInfo") {
        // updateStudentInfoDisplay(receivedData.data, receivedData.message);
        handleStudentInfo(receivedData);
      }else if (receivedData.type === "error"){
        handleError(receivedData.message);
      } else {
        // 處理來自串口或其他部分的資料，例如處理processedData
        // console.log("Received measurement data:", receivedData);
        // 如果有其他需要顯示的串口數據，可以在這裡處理
        handleMeasurementData(receivedData);
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
    // 您可以在這裡添加更多邏輯來顯示學生的其他資訊，例如學號、班級等
    // 例如：const studentDetailsElement = document.getElementById('student-details');
    // 如果有更多要顯示的區塊，可以在這裡更新
  } else {
    // 未找到學生或訊息提示
    messageElement.textContent = message || "未找到匹配的學生資訊";
    // 短暫顯示後恢復初始提示
    setTimeout(() => {
      messageElement.textContent = "請刷卡進行量測";
    }, 3000); // 3 秒後恢復
  }
}

function handleStudentInfo(receivedData){
  if (receivedData.data) {
    currentScannedStudent = receivedData.data; // 儲存當前刷卡的學生資料
    updateStudentInfoDisplay(currentScannedStudent, receivedData.message);
  } else {
    // 如果沒有找到學生資料，顯示錯誤訊息
    messageElement.textContent = receivedData.message || "未找到匹配的學生資訊";
    setTimeout(() => {
      messageElement.textContent = "請刷卡進行量測";
    }, 3000); // 3 秒後恢復
  }
}
function handleError(message) {
  messageElement.textContent = message || "發生錯誤";
  setTimeout(() => {
    messageElement.textContent = "請刷卡進行量測";
  }, 3000); // 3 秒後恢復
}

function handleMeasurementData(receivedData) {
  // 假設 receivedData 包含身高和體重的數據
  if (receivedData.height && receivedData.weight) {
    currentMeasurementData = receivedData; // 儲存最近一次接收到的身高體重數據
    messageElement.textContent = `身高: ${receivedData.height} cm, 體重: ${receivedData.weight} kg`;
  } else {
    messageElement.textContent = "無效的測量數據";
  }
}
  