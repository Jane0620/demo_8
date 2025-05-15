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
let countdownIntervalId = null;

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
      <div id="broadcast" class="broadcast">
        <div class="buttons-container">
        <img src="../assets/prev.svg" id="prev-student">
        <span id="name"></span>
        <img src="../assets/next.svg" id="next-student">
        </div>
        <div class="end" id="broadcast-end"></div>
      </div>
    `;
    pageState.container.insertAdjacentHTML("afterbegin", broadCast);

    updateBroadcastName();
    setupBroadcastNavigation();
  }
  initializeWebSocket(); // 建立連線
  // 點擊按鈕後清空按鈕
  document.getElementById("action-button-container").innerHTML = "";
}

// 自動廣播
function startAutoBroadcast() {
  if (broadcastStudents.length > 0) {
    // 檢查是否還沒到最後一位學生
    if (currentBroadcastIndex < broadcastStudents.length - 1) {
      currentBroadcastIndex = currentBroadcastIndex + 1;
      updateBroadcastName(); // 更新廣播框中的姓名和高亮列
      console.log(
        `正在廣播學生：${broadcastStudents[currentBroadcastIndex].name}`
      );
    } else {
      console.log("已到達最後一位學生，停止自動廣播推進。");
      // 到達最後一位學生時，倒數計時的啟動會在 updateMeasurementTable 中處理
    }
  } else {
    console.warn("廣播學生列表為空，無法進行自動廣播。");
  }
}

// 插名字
function updateBroadcastName() {
  const nameElement = document.getElementById("name");
  const broadcastEndElement = document.getElementById("broadcast-end"); // 獲取結束標示元素

  // 無論如何，只要切換學生（呼叫此函數），就先停止可能的舊倒數計時
  if (countdownIntervalId) {
    clearInterval(countdownIntervalId);
    countdownIntervalId = null; // 重設 ID
  }

  // 如果切換到不是最後一位學生，清空「量測完畢」的訊息區域
  if (broadcastEndElement) {
    if (
      broadcastStudents.length === 0 ||
      currentBroadcastIndex !== broadcastStudents.length - 1
    ) {
      broadcastEndElement.textContent = "";
    }
    // 當切換到最後一位學生時，這裡不清除，讓 updateMeasurementTable 負責設定內容
  }

  if (nameElement && broadcastStudents.length > 0) {
    // 更新廣播框中的姓名
    nameElement.textContent = broadcastStudents[currentBroadcastIndex].name;

    // 移除所有表格列的高亮樣式
    const highlightedRows = document.querySelectorAll(
      "table.measure-table tr.highlight"
    );
    highlightedRows.forEach((row) => row.classList.remove("highlight"));

    // 為當前廣播的學生所在的表格列添加高亮樣式
    const currentStudent = broadcastStudents[currentBroadcastIndex];
    const currentRow = document.querySelector(
      `table.measure-table tr[data-student-pid="${currentStudent.pid}"]`
    );
    if (currentRow) {
      currentRow.classList.add("highlight");
    }
    if (currentBroadcastIndex === broadcastStudents.length - 1) {
      // 檢查此行的身高和體重輸入框是否有值
      const heightInput = currentRow.querySelector(".height-input");
      const weightInput = currentRow.querySelector(".weight-input");

      // 判斷是否有數據 (檢查 value 是否為非空字串)
      if (heightInput?.value !== "" && weightInput?.value !== "") {
        console.log(
          `Mapsd to last student (${currentStudent.name}) and data exists. Starting countdown.`
        );
        // 呼叫啟動倒數的函數
        startUploadCountdown(60); // 啟動 60 秒倒數
      } else {
        console.log(
          `Mapsd to last student (${currentStudent.name}), but data is empty. Not starting countdown.`
        );
        // 如果切換到最後一位學生但資料是空的，確保結束訊息區域是清空的
        if (broadcastEndElement) {
          broadcastEndElement.textContent = "";
        }
      }
    }
  }
  checkAndDisplayUploadButton();
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
        startAutoBroadcast();
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
// 專門負責啟動並執行倒數計時
function startUploadCountdown(durationInSeconds) {
  const broadcastEndElement = document.getElementById("broadcast-end");

  // 如果結束標示元素不存在，或學生列表為空，則不啟動倒數
  if (!broadcastEndElement || broadcastStudents.length === 0) {
    console.warn(
      "Cannot start countdown: broadcast-end element not found or student list is empty."
    );
    // 可以選擇在這裡加一個延遲上傳的備案，或認為這是錯誤情況
    // setTimeout(() => { handleSaveUpload(); }, durationInSeconds * 1000); // 備案
    return;
  }

  // 清除任何可能正在運行的舊倒數計時
  if (countdownIntervalId) {
    clearInterval(countdownIntervalId);
    countdownIntervalId = null;
  }

  let timeLeft = durationInSeconds; // 從指定時間開始倒數

  // 設定「量測完畢」的訊息，包含顯示倒數時間的 span
  broadcastEndElement.innerHTML = `<span>量測完畢，資料將於<span class="timeleft" id="time">${timeLeft}</span>秒後上傳</span>`;

  // 取得顯示時間的 span 元素
  const timeElement = document.getElementById("time");

  // 如果時間顯示元素不存在，顯示備案文字並直接延遲上傳
  if (!timeElement) {
    console.error("Countdown time element not found inside broadcast-end!");
    broadcastEndElement.textContent = `量測完畢，資料將於${durationInSeconds}秒後上傳 (倒數顯示異常)`;
    setTimeout(() => {
      handleSaveUpload();
    }, durationInSeconds * 1000);
    return; // 不再繼續設定 setInterval
  }

  // 啟動倒數計時器
  countdownIntervalId = setInterval(() => {
    timeLeft--;
    timeElement.textContent = timeLeft; // 更新顯示的時間

    if (timeLeft <= 0) {
      clearInterval(countdownIntervalId); // 停止計時器
      countdownIntervalId = null; // 重設 ID
      broadcastEndElement.textContent = "正在上傳資料..."; // 可選：更新狀態訊息

      // === 觸發儲存及上傳 ===
      handleSaveUpload();
      // =====================
    }
  }, 1000); // 每 1000 毫秒 (1 秒) 更新一次
}
// 用於檢查所有學生資料是否都已填寫
function areAllStudentsDataFilled() {
  // 如果沒有廣播學生，則不算是全部填寫完畢
  if (broadcastStudents.length === 0) {
    return false;
  }

  // 遍歷所有廣播學生
  for (const student of broadcastStudents) {
    // 根據學生 PID 找到對應的表格行
    const row = document.querySelector(
      `table.measure-table tr[data-student-pid="${student.pid}"]`
    );

    // 如果找不到行，或者行中的身高或體重輸入框不存在，或其值為空字串，都表示資料未填寫完畢
    if (!row) {
      console.warn(
        `Row not found for student PID: ${student.pid} during all data check.`
      );
      return false;
    }

    const heightInput = row.querySelector(".height-input");
    const weightInput = row.querySelector(".weight-input");

    // 檢查身高和體重輸入框是否存在且有值 (非空字串)
    if (
      !heightInput ||
      heightInput.value === "" ||
      !weightInput ||
      weightInput.value === ""
    ) {
      // 只要有一個學生資料不完整，就返回 false
      return false;
    }
  }

  // 如果迴圈跑完都沒有返回 false，表示所有學生資料都完整了
  return true;
}

// 新增一個輔助函數，用於管理上傳按鈕的顯示/隱藏
// 這個函數會被 updateMeasurementTable 和 handleSaveUpload 完成後呼叫
function checkAndDisplayUploadButton() {
    const allFilled = areAllStudentsDataFilled();
    const broadcastEndElement = document.getElementById("broadcast-end");
    const uploadButtonId = "upload-all-button";
    const existingButton = document.getElementById(uploadButtonId);

    if (!broadcastEndElement) {
         console.warn("checkAndDisplayUploadButton: broadcast-end element not found.");
         return;
    }

    if (allFilled) {
        // 所有資料都填寫完畢，按鈕應該顯示
        if (!existingButton) {
            // 按鈕不存在，則創建並插入按鈕
            // 在插入按鈕前，清空 broadcastEndElement 的文字內容，但不影響子元素（如倒數 span）
            // 如果倒數計時正在進行，它的 innerHTML 會覆蓋這裡
            // 為了避免與倒數計時的 innerHTML 衝突，我們只在沒有 #time span 時插入按鈕
            if (!broadcastEndElement.querySelector("#time")) {
                // 清空文字內容，不移除子元素
                broadcastEndElement.textContent = ""; // 清空文本節點
                // 清除可能存在的非倒數子元素，只保留倒數 span（如果有的話）
                // 這裡可以選擇更精確的清理方式，但簡單起見，如果沒有倒數 span 就清空再追加
                // 或者直接追加，讓按鈕和倒數訊息並存
                // 根據您的新需求「不要理會倒數計時事件，只要全部有資料就出現按鈕」，意味著它們可以並存
                // 簡單粗暴的方式是，如果按鈕不存在就直接追加
                 const newButton = document.createElement('button');
                 newButton.id = uploadButtonId;
                 newButton.textContent = "儲存並上傳";
                 newButton.addEventListener('click', handleSaveUpload);
                 // 避免重複添加按鈕，先檢查一次，或在添加前移除舊的
                 if(broadcastEndElement.querySelector(`#${uploadButtonId}`)) {
                     broadcastEndElement.querySelector(`#${uploadButtonId}`).remove();
                 }
                 broadcastEndElement.appendChild(newButton); // 追加按鈕
                 console.log("Upload button added.");
            } else {
                // 所有資料已填寫，且倒數計時正在進行，按鈕也應該顯示
                // 如果按鈕不存在，就在倒數訊息後面追加按鈕
                 if (!existingButton) {
                     const newButton = document.createElement('button');
                     newButton.id = uploadButtonId;
                     newButton.textContent = "儲存並上傳";
                     newButton.addEventListener('click', handleSaveUpload);
                     broadcastEndElement.appendChild(newButton); // 追加按鈕
                     console.log("Upload button added alongside countdown.");
                 }
            }

        } else {
            // 不是所有資料都填寫完畢，按鈕不應顯示
            if (existingButton) {
                existingButton.remove(); // 移除按鈕
                console.log("Upload button removed because not all data is filled.");
            }
            // 注意：這裡不應清空 broadcastEndElement 的其他內容
        }
    }
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

    if (
      broadcastStudents.length > 0 &&
      studentPid === broadcastStudents[broadcastStudents.length - 1]?.pid
    ) {
      console.log(
        `Received data for the last student (${studentPid}). Starting countdown.`
      );
      // 在填入最後一位學生的資料後，呼叫倒數計時函數
      startUploadCountdown(60); // 啟動 60 秒倒數
    }
    checkAndDisplayUploadButton();
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
