import {
  getAuthData,
  insertTable,
  fetchAndDisplayData,
  setupTabSwitching,
  handleFetchError,
  collectStudentData,
  domReady,
} from "/js/util.js";
import {
  renderManualTable,
  renderAutoTable,
  selectedStudentsForDetection,
} from "./measureTable.js";

let students = [];
let currentMode = { value: "auto" }; // 預設為自動輸入模式
const pageState = {};

async function initPage() {
  await domReady();
  const className = localStorage.getItem("class_name");
  if (className) {
    document.getElementById("class-name-header").textContent = className;
  }

  pageState.container = document.getElementById("classes-container");
  const classGrade = localStorage.getItem("class_grade");
  const classNo = localStorage.getItem("class_no");

  if (!classGrade || !classNo) {
    insertTable(
      pageState.container,
      null,
      "無法取得班級資訊，請返回班級列表。"
    );
    return;
  }

  const url = `${window.env.API_BASE_URL}/api/students?class_grade=${classGrade}&class_no=${classNo}`;

  fetchAndDisplayData(
    pageState.container,
    url,
    (data) => {
      students = data.map((student) => ({ ...student, attended: true })); // 預設所有學生為已點名
      if (students && students.length > 0) {
        // 初始模式一定是 auto，所以直接渲染自動輸入表格
        pageState.container.innerHTML = ""; // 清空容器
        renderAutoTable(pageState.container, students);
        insertStartDectionButton();
        // 現在設置頁籤切換
        setupTabSwitching({
          containerSelector: ".card",
          tabButtonSelector: ".nav-tab",
          tabContentSelector: ".tab-contents",
          onTabSwitch: (activeTab) => {
            if (activeTab === "student-management") {
              measureAuto();
            } else if (activeTab === "attendance") {
              measureManual();
            }
          },
        });
      } else {
        insertTable(pageState.container, null, "找不到學生資料。");
      }
    },
    "學生名單載入失敗。"
  );
}

initPage();
// 插入動作按鈕
function insertSaveUploadButton() {
  const actionButtonContainer = document.getElementById(
    "action-button-container"
  );
  actionButtonContainer.innerHTML = `
      <button id="save-upload" class="btn">儲存並上傳</button>
    `;
  const saveUploadButton = document.getElementById("save-upload");
  if (saveUploadButton) {
    saveUploadButton.addEventListener("click", handleSaveUpload);
  }
}

function insertStartDectionButton() {
  const actionButtonContainer = document.getElementById(
    "action-button-container"
  );
  actionButtonContainer.innerHTML = `<button id="start-detection" class="btn">開始偵測</button>`;
  const startDetectionButton = document.getElementById("start-detection");
  if (startDetectionButton) {
    startDetectionButton.addEventListener("click", handleStartDetection);
  }
}

let currentBroadcastIndex = 0;
let broadcastStudents = [];

function handleStartDetection() {
  if (selectedStudentsForDetection.length === 0) {
    alert("請先點名要進行偵測的學生。");
    return;
  }

  // 使用已點名的學生資料建立廣播列表
  broadcastStudents = students.filter((student) =>
    selectedStudentsForDetection.includes(student.pid)
  );
  currentBroadcastIndex = 0;
  // 插廣播框
  if (pageState.container) {
    const broadCast = `
      <div id="broadcast">
        <button id="prev-student">◀️</button><p id="name"></p><button id="next-student">▶️</button>
      </div>
    `;
    pageState.container.insertAdjacentHTML("afterbegin", broadCast);

    updateBroadcastName();
    setupBroadcastNavigation();
  }
  initializeWebSocket();// 建立連線
  insertSaveUploadButton(); // 假設點擊開始偵測後，最終會有儲存按鈕
}
// 插名字
function updateBroadcastName() {
  const nameElement = document.getElementById("name");
  if (nameElement && broadcastStudents.length > 0) {
    nameElement.textContent = broadcastStudents[currentBroadcastIndex].name;
  }
}

// 廣播按鈕
function setupBroadcastNavigation() {
  const prevButton = document.getElementById("prev-student");
  const nextButton = document.getElementById("next-student");

  if (prevButton) {
    prevButton.addEventListener("click", () => {
      currentBroadcastIndex = Math.max(0, currentBroadcastIndex - 1);
      updateBroadcastName();
    });
  }

  if (nextButton) {
    nextButton.addEventListener("click", () => {
      currentBroadcastIndex = Math.min(
        broadcastStudents.length - 1,
        currentBroadcastIndex + 1
      );
      updateBroadcastName();
    });
  }
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
  };

  ws.onmessage = (event) => {
    try {
      const receivedData = JSON.parse(event.data);
      console.log("Received measurement data via WebSocket:", receivedData);

      /* 
            2. 處理接收到的資料並更新 UI 
            收到的資料是給當前正在廣播的學生
          */
      if (broadcastStudents.length > 0) {
        const currentStudent = broadcastStudents[currentBroadcastIndex];
        const studentPid = currentStudent.pid;

        updateMeasurementTable(studentPid, receivedData);
      } else {
        console.warn(
          "No broadcast students loaded. Cannot update table with received data."
        );
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  };

  ws.onclose = () => {
    console.log(
      "Disconnected from WebSocket server. Attempting to reconnect in 3 seconds..."
    );
    setTimeout(initializeWebSocket, 3000); // 斷線後嘗試重新連接
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
  };
}

// ---- 4. 將更新表格的邏輯獨立出來 ----
// 這個函數現在會被 WebSocket 的 onmessage 呼叫
function updateMeasurementTable(studentPid, measurementData) {
  // 找到表格中對應學生的列並填入數值
  const row = document.querySelector(
    `table.measure-table tr[data-student-pid="${studentPid}"]`
  );
  if (row) {
    const heightInput = row.querySelector(".height-input");
    const weightInput = row.querySelector(".weight-input");
    // const bmiInput = row.querySelector('.bmi-input'); // Bmi

    // 注意：你的串口資料只包含 height, weight, bmi, gender
    // 如果 Sight0L, Sight0R, SightL, SightR, date 需要更新，
    // 這些資料需要從後端透過其他方式提供 (例如從資料庫查詢，或在 WebSocket 傳送的資料中包含)

    // 這部分的程式碼是你的原始 `WorkspaceAndFillMeasurement` 函數中的更新 UI 部分
    if (heightInput && measurementData.height !== undefined) {
      heightInput.value = measurementData.height;
    }
    if (weightInput && measurementData.weight !== undefined) {
      weightInput.value = measurementData.weight;
    }
    // if (bmiInput && measurementData.bmi !== undefined) {
    //     bmiInput.value = measurementData.bmi; // 更新 BMI
    // }

    // 這些欄位 (Sight0L, Sight0R, SightL, SightR, date) 由於串口資料中沒有，
    // 如果需要更新，你需要確保 measurementData 中包含這些字段
    // 或是當學生切換時，發送一個 HTTP 請求來加載這些歷史數據

    const dateInput = row.querySelector(".date-input");
    function formatDateTime(isoString) {
      const date = new Date(isoString);
      return date.toLocaleString(); // 或根據你的需要格式化
    }

    if (dateInput && measurementData.date !== undefined)
      dateInput.value = formatDateTime(measurementData.date);
  } else {
    console.warn(`Table row for student PID "${studentPid}" not found.`);
  }
}

// 自動輸入操作
function measureAuto() {
  currentMode.value = "auto";
  pageState.container.innerHTML = "";
  renderAutoTable(pageState.container, students);
  insertStartDectionButton();
}
// 手動輸入操作
function measureManual() {
  currentMode.value = "manual";
  pageState.container.innerHTML = "";
  renderManualTable(pageState.container, students);
  insertSaveUploadButton();
}

// 儲存並上傳處理函數
function handleSaveUpload() {
  const studentData = collectStudentData();

  if (!studentData.Students || studentData.Students.length === 0) {
    alert("沒有可上傳的數據！");
    return;
  }

  const auth = getAuthData();
  if (!auth || !auth.token) {
    alert("尚未登入或 token 遺失，請重新登入！");
    return;
  }

  const measurementType = localStorage.getItem("measurementType");

  const payload = {
    studentData: studentData.Students,
    token: auth.token,
    measurementType: measurementType, // 傳遞 measurementType
  };

  console.log("發送到後端的數據：", studentData.Students);

  fetch(`${window.env.API_BASE_URL}/api/save-and-upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`伺服器錯誤 ${response.status}`);
      }
      return response.json();
    })
    .then((result) => {
      if (result.success) {
        alert("數據已成功儲存！");
        window.location.reload();
      } else {
        alert("儲存失敗：" + (result.error || "未知錯誤"));
      }
    })
    .catch((err) => {
      handleFetchError(err, document.body, "儲存數據時發生錯誤");
      alert("儲存數據時發生錯誤：" + err.message);
      window.location.reload();
    });
}
