import {
  getAuthData,
  insertTable,
  fetchAndDisplayData,
  renderMeasureTable,
  setupTabSwitching,
  handleFetchError,
  collectStudentData,
  domReady,
} from "/js/util.js";

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
        renderMeasureTable(
          pageState.container,
          students,
          currentMode.value === "manual"
        );

        // 確保頁籤按鈕和內容已經存在後再初始化
        setupTabSwitching({
          containerSelector: ".card",
          tabButtonSelector: ".nav-tab", // 頁籤按鈕的選擇器
          tabContentSelector: ".tab-content", // 頁籤內容的選擇器
          onTabSwitch: (activeTab) => {
            // console.log(`切換到頁籤: ${activeTab}`);
            // 根據頁籤執行不同的行為
            if (activeTab === "student-management") {
              // console.log('切換到自動輸入模式');
              currentMode.value = "auto";
              renderMeasureTable(pageState.container, students, false); // 移除第四個參數
            } else if (activeTab === "attendance") {
              // console.log('切換到手動輸入模式');
              currentMode.value = "manual";
              renderMeasureTable(pageState.container, students, true); // 移除第四個參數
            }
            updateActionButton(); // 更新按鈕
          },
        });

        updateActionButton(); // 初始化動作按鈕
      } else {
        insertTable(pageState.container, null, "找不到學生資料。");
      }
    },
    "學生名單載入失敗。"
  );
}

initPage();
// 更新動作按鈕
function updateActionButton() {
  const actionButtonContainer = document.getElementById(
    "action-button-container"
  );

  if (!actionButtonContainer) return;

  if (currentMode.value === "auto") {
    actionButtonContainer.innerHTML = `
      <button id="start-detection" class="btn">開始偵測</button>
    `;
    const startDetectionButton = document.getElementById("start-detection");
    if (startDetectionButton) {
      startDetectionButton.addEventListener("click", handleStartDetection);
    }
  } else if (currentMode.value === "manual") {
    actionButtonContainer.innerHTML = `
      <button id="save-upload" class="btn">儲存並上傳</button>
    `;
    const saveUploadButton = document.getElementById("save-upload");
    if (saveUploadButton) {
      saveUploadButton.addEventListener("click", handleSaveUpload);
    }
  }
}

function handleStartDetection() {
  const measurementType = window.env.MEASUREMENT_TYPE;

  if (measurementType === "height-weight") {
    alert("開始偵測身高體重");
  } else if (measurementType === "vision") {
    alert("開始偵測視力");
  }
  const broadCast = `<div id="broadcast">
    <button>◀️</button><p id="name"></p><button>▶️</button>
    </div>`;

  if (pageState.container) {
    pageState.container.insertAdjacentHTML('beforebegin', broadCast);
    // renderMeasureTable(pageState.container, students, false);
  }

  // 在偵測完成後（或在您希望按鈕切換的時機），更改 currentMode 並更新按鈕
  currentMode.value = "manual";
  updateActionButton();
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
