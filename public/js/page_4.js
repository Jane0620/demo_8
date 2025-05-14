import { setupTabSwitching, domReady } from "./util.js";

async function initPage() {
  await domReady();
  const tabContentContainer = document.querySelector(".tab-content");
  let apiContainer; // 用來存放 api-plus 容器的參考
  let currentActiveTabId = "student-management"; // 新增：追蹤當前活躍分頁的 ID，預設為 student-management

  // 分離模板為兩個部分
  const getRadioTemplate = () => `
    <label class="measurement">📇量測類型
      <input type="radio" name="connection" value="height-weight" id="height-weight" ${
        window.env.MEASUREMENT_TYPE === "height-weight" ? "checked" : ""
      } /><span>身高體重</span>
      <input type="radio" name="connection" value="vision" id="vision" ${
        window.env.MEASUREMENT_TYPE === "vision" ? "checked" : ""
      } /><span>視力</span>
    </label>
    <div class="settings-menu">
    <label>🏫學校名稱：
      <input type="text" name="schoolName" placeholder="請輸入學校名稱" value=${ // 建議改用 schoolName 避免與其他input name混淆
        window.env.SCHOOL_NAME
      }>
    </label>
    <label>🏫學校代碼：
      <input type="text" name="schoolId" placeholder="請輸入學校代碼" value=${ 
        window.env.SCHOOL_ID
      }>
    </label>
    </div>
    <div class="api-plus settings-menu">
    <label>⬇️API-KEY：
      <input type="password" name="apiKey" placeholder="請輸入API-KEY" value=${ 
        window.env.API_KEY
      } />
    </label>
    <label>⬇️下載系統：
      <input type="text" name="downloadSystem" placeholder="請輸入系統名稱" /> 
    </label>
    <label>⬇️下載網址：
      <input type="text" name="downloadUrl" placeholder="請輸入下載網址" value=${ 
        window.env.SHIS_BASE_URL
      } />
    </label>
    </div>
  `;

  const getApiBlockTemplate = () => `
    <div class="api-plus settings-menu">
      <label>⬆️上傳系統：
        <input type="text" name="uploadSystem" placeholder="請輸入系統名稱" /> 
      </label>
      <label>⬆️上傳網址：
        <input type="text" name="uploadUrl" placeholder="請輸入上傳網址" value=${window.env.SHIS_BASE_URL} /> 
        <button class="add-btn">➕</button>
        <button class="delete-btn">🗑️</button>
      </label>
    </div>
  `;

  const handleButtonClick = (e) => {
    const blocks = document.querySelectorAll(".api-plus");

    if (e.target.classList.contains("add-btn")) {
      if (blocks.length >= 5) {
        alert("已達到最大數量限制");
        return;
      }

      // 只創建 api-plus 部分
      const newBlock = document.createElement("div");
      newBlock.innerHTML = getApiBlockTemplate();
      // 取出內部的 api-plus div 並添加到 apiContainer
      apiContainer.appendChild(newBlock.querySelector(".api-plus"));
    } else if (e.target.classList.contains("delete-btn")) {
      if (blocks.length > 1) {
        e.target.closest(".api-plus").remove();
      }
    }
  };

  function onTabSwitch(activeTab) {
    currentActiveTabId = activeTab; // 更新當前活躍分頁的 ID
    tabContentContainer.innerHTML = "";

    if (activeTab === "student-management") {
      // 先創建包含單選按鈕的固定部分
      tabContentContainer.innerHTML = `
        <div id="api-container">
          ${getRadioTemplate()}
        </div>
      `;

      // 然後添加第一個 api-plus 區塊
      apiContainer = document.getElementById("api-container");
      const initialBlock = document.createElement("div");
      initialBlock.innerHTML = getApiBlockTemplate();
      apiContainer.appendChild(initialBlock.querySelector(".api-plus"));

      apiContainer.addEventListener("click", handleButtonClick);
    } else if (activeTab === "attendance") {
      tabContentContainer.innerHTML = `
        <div id="connection" class="connect-menu">
        <label>
        <span>資料格式</span>
        <input type="text" name="dataFormat" placeholder="請輸入資料格式" value=${window.env.DATA_FORMAT || ''} /> 
        </label>
          <label>
          <span>連接埠</span>
            <input type="text" name="serialPath" placeholder="請輸入連接阜請輸入連接埠" value=${window.env.SERIAL_PATH}/> 
          </label>
          <label>
            <span>Baud Rate</span>
            <select class="round" name="baudrate" id="baudrate">
              <option value="9600">9600</option>
              <option value="115200">115200</option>
              </select>
          </label>
          <label>
          <span>Data Bits</span> 
            <select class="round" name="dataBits" id="data-bits"> 
              <option value="0">0</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
              <option value="7">7</option>
              <option value="8">8</option>
              <option value="9">9</option>
            </select>
          </label>
          <label>
          <span>Stop Bits</span> 
            <select class="round" name="stopBits" id="stop-bits"> 
              <option value="0">0</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
              <option value="7">7</option>
              <option value="8">8</option>
              <option value="9">9</option>
            </select>
          </label>
        </div>
      `;
      const baudRateElement = document.getElementById("baudrate");
      const dataBitsElement = document.getElementById("data-bits");
      const stopBitsElement = document.getElementById("stop-bits");

      // 確認元素存在後，設定其值
      // 注意：這裡也需要處理資料格式的預設值
      if (baudRateElement) baudRateElement.value = window.env.BAUDRATE || ''; // 新增空字串處理
      if (dataBitsElement) dataBitsElement.value = window.env.DATABITS || '';
      if (stopBitsElement) stopBitsElement.value = window.env.STOPBITS || '';
      // 如果有資料格式的 input，也要設置其預設值
      const dataFormatElement = document.querySelector('input[name="dataFormat"]');
      if (dataFormatElement) dataFormatElement.value = window.env.DATA_FORMAT || '';

    } else if (activeTab === "upload-time") {
      tabContentContainer.innerHTML = `
        <div id="upload-time" class="settings-menu">
          <label>🕧定時上傳時間
            <input type="radio" name="uploadTimePeriod" value="morning" ${window.env.UPLOAD_TIME_PERIOD === "morning" ? "checked" : ""} /> // 建議改用 uploadTimePeriod
            <span>早上</span>
            <input type="radio" name="uploadTimePeriod" value="afternoon" ${window.env.UPLOAD_TIME_PERIOD === "afternoon" ? "checked" : ""} /> // 建議改用 uploadTimePeriod
            <span>下午</span>
          </label>
          <label>時間
            <input type="time" name="uploadTimeValue" value=${window.env.UPLOAD_TIME_VALUE || '00:00'} /> // 新增一個時間輸入框，並設定預設值
          </label>
        </div>
      `;
    }
  }

  setupTabSwitching({
    containerSelector: ".card",
    tabButtonSelector: ".nav-tab",
    tabContentSelector: ".tab-content",
    onTabSwitch,
  });

  onTabSwitch("student-management"); // 頁面載入時預設顯示「學生管理」分頁

  document
    .getElementById("save-settings")
    .addEventListener("click", async () => {
      let envData = {}; // 初始化一個空物件，只收集當前活躍分頁的資料

      if (currentActiveTabId === "student-management") {
        const uploadUrls = Array.from(
          document.querySelectorAll('.api-plus input[placeholder="請輸入上傳網址"]') // 請確認這裡的 placeholder 是否正確對應 getApiBlockTemplate
        )
          .map((input) => input.value.trim())
          .filter((url) => url); // 過濾空值

        envData = {
          TYPE: document.querySelector('input[name="connection"]:checked')?.value || "",
          SCHOOL_NAME: document.querySelector('input[name="schoolName"]')?.value || "",
          SCHOOL_ID: document.querySelector('input[name="schoolId"]')?.value || "",
          API_KEY: document.querySelector('input[name="apiKey"]')?.value || "",
          DOWNLOAD_URL: document.querySelector('input[name="downloadUrl"]')?.value || "",
          UPLOAD_URL: uploadUrls, // 多個網址，傳陣列
        };
      } else if (currentActiveTabId === "attendance") {
        envData = {
          SERIAL_PATH: document.querySelector('input[name="serialPath"]')?.value || "",
          BAUDRATE: document.getElementById("baudrate")?.value || "",
          DATABITS: document.getElementById("data-bits")?.value || "",
          STOPBITS: document.getElementById("stop-bits")?.value || "",
          DATA_FORMAT: document.querySelector('input[name="dataFormat"]')?.value || "", // 確保名稱一致
        };
      } else if (currentActiveTabId === "upload-time") {
        envData = {
          UPLOAD_TIME_PERIOD: document.querySelector('input[name="uploadTimePeriod"]:checked')?.value || "",
          UPLOAD_TIME_VALUE: document.querySelector('input[name="uploadTimeValue"]')?.value || "", // 獲取時間輸入框的值
        };
      }

      try {
        const res = await fetch("/api/env", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(envData),
        });
        console.log("Sending envData:", envData); // 檢查發送的資料
        const result = await res.json();
        if (result.success) {
          alert("✅ 設定儲存成功，重新啟動伺服器");
          window.location.reload(); // 重新載入頁面
        } else {
          alert("❌ 儲存失敗：" + result.error);
        }
      } catch (err) {
        alert("❌ 錯誤：" + err.message);
      }
    });
}

initPage();