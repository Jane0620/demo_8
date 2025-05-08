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
  selectedStudentsForDetection
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
  broadcastStudents = students.filter(student => selectedStudentsForDetection.includes(student.pid));
  currentBroadcastIndex = 0;

  // const broadCastContainer = document.getElementById('broadcast-container');
  if (pageState.container) {
    const broadCast = `
      <div id="broadcast">
        <button id="prev-student">◀️</button><p id="name"></p><button id="next-student">▶️</button>
      </div>
    `;
    pageState.container.insertAdjacentHTML('afterbegin', broadCast);

    updateBroadcastName();
    setupBroadcastNavigation();
  }

  insertSaveUploadButton(); // 假設點擊開始偵測後，最終會有儲存按鈕
}

function updateBroadcastName() {
  const nameElement = document.getElementById('name');
  if (nameElement && broadcastStudents.length > 0) {
    nameElement.textContent = broadcastStudents[currentBroadcastIndex].name;
  }
}

function setupBroadcastNavigation() {
  const prevButton = document.getElementById('prev-student');
  const nextButton = document.getElementById('next-student');

  if (prevButton) {
    prevButton.addEventListener('click', () => {
      currentBroadcastIndex = Math.max(0, currentBroadcastIndex - 1);
      updateBroadcastName();
      // 觸發後端請求獲取當前學生的量測數值並填入表格 (步驟 5)
      fetchAndFillMeasurement(broadcastStudents[currentBroadcastIndex].pid);
    });
  }

  if (nextButton) {
    nextButton.addEventListener('click', () => {
      currentBroadcastIndex = Math.min(broadcastStudents.length - 1, currentBroadcastIndex + 1);
      updateBroadcastName();
      // 觸發後端請求獲取當前學生的量測數值並填入表格 (步驟 5)
      fetchAndFillMeasurement(broadcastStudents[currentBroadcastIndex].pid);
    });
  }
}

function fetchAndFillMeasurement() {
  // 假設後端 API 會按照廣播順序提供數據，不需要 studentPid
  const measurementUrl = `${window.env.API_BASE_URL}/get-auto-data`; // 修改 API URL

  fetch(measurementUrl)
    .then(response => {
      if (!response.ok) {
        console.error('獲取量測數據失敗');
        return null;
      }
      return response.json();
    })
    .then(measurementData => {
      if (measurementData && broadcastStudents.length > 0) {
        // 使用 currentBroadcastIndex 獲取當前廣播的學生物件
        const currentStudent = broadcastStudents[currentBroadcastIndex];
        const studentPid = currentStudent.pid;

        // 找到表格中對應學生的列並填入數值
        const row = document.querySelector(`table.measure-table tr[data-student-pid="${studentPid}"]`);
        if (row) {
          const heightInput = row.querySelector('.height-input');
          const weightInput = row.querySelector('.weight-input');
          const leftNakedInput = row.querySelector('.sight-input.left-naked');
          const rightNakedInput = row.querySelector('.sight-input.right-naked');
          const leftInput = row.querySelector('.sight-input.left');
          const rightInput = row.querySelector('.sight-input.right');
          const dateInput = row.querySelector('.date-input');

          if (measurementData.height !== undefined) heightInput.value = measurementData.height;
          if (measurementData.weight !== undefined) weightInput.value = measurementData.weight;
          if (measurementData.Sight0L !== undefined) leftNakedInput.value = measurementData.Sight0L;
          if (measurementData.Sight0R !== undefined) rightNakedInput.value = measurementData.Sight0R;
          if (measurementData.SightL !== undefined) leftInput.value = measurementData.SightL;
          if (measurementData.SightR !== undefined) rightInput.value = measurementData.SightR;
          if (measurementData.date !== undefined) dateInput.value = formatDateTime(measurementData.date);
        }
      }
    });
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
