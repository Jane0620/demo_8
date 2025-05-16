import { setupTabSwitching, domReady } from "./util.js";

async function initPage() {
  await domReady();
  const tabContentContainer = document.querySelector(".tab-content");
  let apiContainer; // 用來存放 api-plus 容器的參考
  let currentActiveTabId = "student-management"; // 新增：追蹤當前活躍分頁的 ID，預設為 student-management

  // 分離模板為兩個部分
  // 預設系統模板 - 下載預設啟用，上傳預設啟用
  const getRadioTemplate = () => `
  <div class="settings-menu">
    <h3>預設系統</h3>
    <div class="form-container">
      <div class="form-group">
        <label class="form-label">系統名稱:</label>
        <input class="form-input" type="text" name="systemName" placeholder="請輸入系統名稱" value="${
          window.env.SYSTEM_NAME || ""
        }" />
      </div>
      <div class="form-group">
        <label class="form-label">API-KEY:</label>
        <input class="form-input" type="password" name="apiKey" placeholder="請輸入API-KEY" value="${
          window.env.API_KEY
        }" />
      </div>
      <div class="form-group">
        <label class="form-label">網址:</label>
        <input class="form-input" type="text" name="uploadUrl" placeholder="請輸入上傳網址" value="${
          window.env.SHIS_BASE_URL || ""
        }" />
      </div>
    </div>
    <div class="toggle-container">
      <div>
        <div class="switch-desc">下載功能</div>
        <input type="radio" name="controlMode" id="defaultDownloadToggle" class="ios-toggle" checked/>
        <label for="defaultDownloadToggle" class="checkbox-label" data-off="關閉" data-on="啟用"></label>
      </div>
      <div>
        <div class="switch-desc">上傳功能</div>
        <input type="checkbox" name="uploadEnabled" id="defaultUploadToggle" class="ios-toggle" checked/>
        <label for="defaultUploadToggle" class="checkbox-label" data-off="關閉" data-on="啟用"></label>
      </div>
    </div>
  </div>
`;

  // 增設系統模板 - 下載預設關閉，上傳預設啟用
  // 注意：此模板中的 toggle input 沒有 id 和 label 沒有 for
  // 會在 JS 動態新增時產生唯一的 id
  const getApiBlockTemplate = () => `
  <div class="api-plus settings-menu">
    <h3>增設系統</h3>
    <div class="form-container">
      <div class="form-group">
        <label class="form-label">系統名稱:</label>
        <input class="form-input" type="text" name="systemName" placeholder="請輸入系統名稱" value="${
          window.env.SYSTEM_NAME || ""
        }" />
      </div>
      <div class="form-group">
        <label class="form-label">Token:</label>
        <input class="form-input" type="password" name="token" placeholder="請輸入Token" value="" />
      </div>
      <div class="form-group">
        <label class="form-label">網址:</label>
        <input class="form-input" type="text" name="uploadUrl" placeholder="請輸入上傳網址" value="${
          window.env.SHIS_BASE_URL || ""
        }" />
      </div>
    </div>
    <div class="toggle-container">
      <div>
        <div class="switch-desc">下載功能</div>
        <input type="radio" name="controlMode" class="ios-toggle"/>
        <label class="checkbox-label" data-off="關閉" data-on="啟用"></label>
      </div>
      <div>
        <div class="switch-desc">上傳功能</div>
        <input type="checkbox" name="uploadEnabled" class="ios-toggle" checked/>
        <label class="checkbox-label" data-off="關閉" data-on="啟用"></label>
      </div>
    </div>
    <div class="buttons-container">
      <img class="add-btn" src="../assets/plus.svg" alt="Add" />
      <img class="delete-btn" src="../assets/trash.svg" alt="Delete" />
    </div>
  </div>
`;

  const handleButtonClick = (e) => {
    // 確保事件來源是 add-btn 或 delete-btn
    if (
      !e.target.classList.contains("add-btn") &&
      !e.target.classList.contains("delete-btn")
    ) {
      return;
    }

    const blocks = apiContainer.querySelectorAll(".api-plus"); // 只找 apiContainer 內的 .api-plus

    if (e.target.classList.contains("add-btn")) {
      if (blocks.length >= 5) {
        alert("已達到最大數量限制 (5 個增設系統)"); // 限制增設系統數量
        return;
      }

      // 創建一個臨時 div 來解析模板字符串
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = getApiBlockTemplate();

      // 取出內部的 api-plus div
      const newBlock = tempDiv.querySelector(".api-plus");

      // 找到新增區塊內的 radio 和 checkbox
      const downloadRadio = newBlock.querySelector(
        'input[type="radio"][name="controlMode"]'
      );
      const uploadCheckbox = newBlock.querySelector(
        'input[type="checkbox"][name="uploadEnabled"]'
      );

      // 找到對應的 label
      // 假設 label 就在 input 的下一個兄弟元素
      const downloadLabel = downloadRadio.nextElementSibling;
      const uploadLabel = uploadCheckbox.nextElementSibling;

      // 生成唯一的 ID
      const uniqueIdDownload =
        "downloadToggle_" +
        Date.now() +
        Math.random().toString(36).substr(2, 9);
      const uniqueIdUpload =
        "uploadToggle_" + Date.now() + Math.random().toString(36).substr(2, 9);

      // 設定新的 ID
      downloadRadio.id = uniqueIdDownload;
      uploadCheckbox.id = uniqueIdUpload;

      // 更新 label 的 for 屬性
      downloadLabel.htmlFor = uniqueIdDownload;
      uploadLabel.htmlFor = uniqueIdUpload;

      // 將完整的區塊添加到容器中
      apiContainer.appendChild(newBlock);
    } else if (e.target.classList.contains("delete-btn")) {
      // 確保至少還有一個增設系統區塊才允許刪除
      if (blocks.length > 1) {
        e.target.closest(".api-plus").remove();
      } else {
        alert("至少需要保留一個增設系統區塊");
      }
    }
  };

  function onTabSwitch(activeTab) {
    currentActiveTabId = activeTab; // 更新當前活躍分頁的 ID
    tabContentContainer.innerHTML = "";

    if (activeTab === "student-management") {
      tabContentContainer.innerHTML = `
        <div class="settings-menu">
          <div class="form-container">
            <label class="">量測類型
              <input type="radio" name="connection" value="height-weight" id="height-weight" ${
                window.env.MEASUREMENT_TYPE === "height-weight" ? "checked" : ""
              } /><span>身高體重</span>
              <input type="radio" name="connection" value="vision" id="vision" ${
                window.env.MEASUREMENT_TYPE === "vision" ? "checked" : ""
              } /><span>視力</span>
            </label>
            <div class="form-group">
              <label class="form-label">學校名稱：</label>
              <input class="form-input" type="text" name="schoolName" placeholder="請輸入學校名稱" value="${
                window.env.SCHOOL_NAME
              }">
            </div>
            <div class="form-group">
              <label class="form-label">學校代碼：</label>
              <input class="form-input" type="text" name="schoolId" placeholder="請輸入學校代碼" value="${
                window.env.SCHOOL_ID
              }">
            </div>
          </div>
        </div>
      `;
    } else if (activeTab === "system") {
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
        <div id="connection" class="form-container">
          <div class="form-group">
            <label class="form-label">資料格式</label>
            <input class="form-input" type="text" name="dataFormat" placeholder="請輸入資料格式" value="${
              window.env.DATA_FORMAT || ""
            }" />
          </div>
          <div class="form-group">
            <label class="form-label">連接埠</label>
            <input class="form-input" type="text" name="serialPath" placeholder="請輸入連接阜請輸入連接埠" value="${
              window.env.SERIAL_PATH
            }"/> 
          </div>
          <div class="form-group">
            <label class="form-label">Baud Rate</label>
            <select class="round" name="baudrate" id="baudrate">
              <option value="9600">9600</option>
              <option value="115200">115200</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Data Bits</label>
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
          </div>
          <div class="form-group">
            <label class="form-label">Stop Bits</label>
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
          </div>
        </div>
      `;
      const baudRateElement = document.getElementById("baudrate");
      const dataBitsElement = document.getElementById("data-bits");
      const stopBitsElement = document.getElementById("stop-bits");
      if (baudRateElement) baudRateElement.value = window.env.BAUDRATE || "";
      if (dataBitsElement) dataBitsElement.value = window.env.DATABITS || "";
      if (stopBitsElement) stopBitsElement.value = window.env.STOPBITS || "";
      const dataFormatElement = document.querySelector(
        'input[name="dataFormat"]'
      );
      if (dataFormatElement)
        dataFormatElement.value = window.env.DATA_FORMAT || "";
    } else if (activeTab === "upload-time") {
      tabContentContainer.innerHTML = `
        <div id="upload-time" class="settings-menu">
          <label>🕧定時上傳時間
            <input type="radio" name="uploadTimePeriod" value="morning" ${
              window.env.UPLOAD_TIME_PERIOD === "morning" ? "checked" : ""
            } /> 
            <span>早上</span>
            <input type="radio" name="uploadTimePeriod" value="afternoon" ${
              window.env.UPLOAD_TIME_PERIOD === "afternoon" ? "checked" : ""
            } /> 
            <span>下午</span>
          </label>
          <label>時間
            <input type="time" name="uploadTimeValue" value="${
              window.env.UPLOAD_TIME_VALUE || "00:00"
            }" />
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
          document.querySelectorAll(
            '.api-plus input[placeholder="請輸入上傳網址"]'
          )
        )
          .map((input) => input.value.trim())
          .filter((url) => url);
        envData = {
          TYPE:
            document.querySelector('input[name="connection"]:checked')?.value ||
            "",
          SCHOOL_NAME:
            document.querySelector('input[name="schoolName"]')?.value || "",
          SCHOOL_ID:
            document.querySelector('input[name="schoolId"]')?.value || "",
          API_KEY: document.querySelector('input[name="apiKey"]')?.value || "",
          DOWNLOAD_URL:
            document.querySelector('input[name="downloadUrl"]')?.value || "",
          UPLOAD_URL: uploadUrls, // 多個網址，傳陣列
        };
      } else if (currentActiveTabId === "attendance") {
        envData = {
          SERIAL_PATH:
            document.querySelector('input[name="serialPath"]')?.value || "",
          BAUDRATE: document.getElementById("baudrate")?.value || "",
          DATABITS: document.getElementById("data-bits")?.value || "",
          STOPBITS: document.getElementById("stop-bits")?.value || "",
          DATA_FORMAT:
            document.querySelector('input[name="dataFormat"]')?.value || "",
        };
      } else if (currentActiveTabId === "upload-time") {
        envData = {
          UPLOAD_TIME_PERIOD:
            document.querySelector('input[name="uploadTimePeriod"]:checked')
              ?.value || "",
          UPLOAD_TIME_VALUE:
            document.querySelector('input[name="uploadTimeValue"]')?.value ||
            "",
        };
      }
      try {
        const res = await fetch("/api/env", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(envData),
        });
        console.log("Sending envData:", envData);
        const result = await res.json();
        if (result.success) {
          alert("✅ 設定儲存成功，重新啟動伺服器");
          window.location.reload();
        } else {
          alert("❌ 儲存失敗：" + result.error);
        }
      } catch (err) {
        alert("❌ 錯誤：" + err.message);
      }
    });
}

initPage();
