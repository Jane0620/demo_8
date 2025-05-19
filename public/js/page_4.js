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
          window.env.DEFAULT_SYSTEM_NAME
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
  // 新增：處理增設系統區塊的 ID 和 label 綁定的函數
  const processApiBlockToggles = (blockElement) => {
    // 找到區塊內的 radio 和 checkbox
    const downloadRadio = blockElement.querySelector(
      'input[type="radio"][name="controlMode"]'
    );
    const uploadCheckbox = blockElement.querySelector(
      'input[type="checkbox"][name="uploadEnabled"]'
    );

    // 找到對應的 label (假設是 input 的下一個兄弟元素)
    // 增加檢查，確保找到了元素
    const downloadLabel = downloadRadio
      ? downloadRadio.nextElementSibling
      : null;
    const uploadLabel = uploadCheckbox
      ? uploadCheckbox.nextElementSibling
      : null;

    // 生成唯一的 ID
    const uniqueIdDownload =
      "downloadToggle_" + Date.now() + Math.random().toString(36).substr(2, 9);
    const uniqueIdUpload =
      "uploadToggle_" + Date.now() + Math.random().toString(36).substr(2, 9);

    // 設定新的 ID 和 htmlFor
    if (downloadRadio) downloadRadio.id = uniqueIdDownload;
    if (uploadCheckbox) uploadCheckbox.id = uniqueIdUpload;

    if (downloadLabel && downloadLabel.tagName === "LABEL") {
      // 增加判斷確保是 Label
      downloadLabel.htmlFor = uniqueIdDownload;
    } else {
      console.error(
        "processApiBlockToggles: Could not find or process download label!",
        downloadLabel
      );
    }

    if (uploadLabel && uploadLabel.tagName === "LABEL") {
      // 增加判斷確保是 Label
      uploadLabel.htmlFor = uniqueIdUpload;
    } else {
      console.error(
        "processApiBlockToggles: Could not find or process upload label!",
        uploadLabel
      );
    }
    // 你可以在這裡加入 console.log 再次確認 ID 和 htmlFor 是否設定成功
    // console.log('Processed block:', blockElement);
    // console.log('  Download radio ID:', downloadRadio ? downloadRadio.id : 'N/A');
    // console.log('  Download label htmlFor:', downloadLabel ? downloadLabel.htmlFor : 'N/A');
    // console.log('  Upload checkbox ID:', uploadCheckbox ? uploadCheckbox.id : 'N/A');
    // console.log('  Upload label htmlFor:', uploadLabel ? uploadLabel.htmlFor : 'N/A');
  };
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

      // --- 呼叫共用函數來處理新區塊的 ID 和 label 綁定 ---
      processApiBlockToggles(newBlock);
      // --- 結束呼叫 ---

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
      // 先創建固定部分
      tabContentContainer.innerHTML = `
        <div id="api-container">
          ${getRadioTemplate()}
        </div>
      `;
      // 然後添加第一個 api-plus 區塊
      apiContainer = document.getElementById("api-container");
      // --- 創建並處理第一個增設系統區塊 ---
      const initialBlockTempDiv = document.createElement("div");
      initialBlockTempDiv.innerHTML = getApiBlockTemplate(); // 取得原始模板 HTML
      const initialApiBlock = initialBlockTempDiv.querySelector(".api-plus"); // 提取區塊元素

      // **重點：呼叫共用函數來處理第一個區塊的 ID 和 label 綁定**
      processApiBlockToggles(initialApiBlock);
      // --- 處理結束 ---

      // 將處理好的第一個增設系統區塊添加到容器中
      apiContainer.appendChild(initialApiBlock);

      // 為 apiContainer 添加點擊監聽器，用於處理增刪按鈕
      // 檢查是否已經添加過，避免重複添加
      if (!apiContainer.dataset.clickListenerAdded) {
        // 使用 dataset 屬性作為標記
        apiContainer.addEventListener("click", handleButtonClick);
        apiContainer.dataset.clickListenerAdded = "true"; // 設定標記
      }
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

  onTabSwitch("student-management");
  // --- 將處理 radio/checkbox 變化的事件監聽器保留在這裡 (使用事件委派) ---
  // 這個監聽器會捕獲在 tabContentContainer 內部的 change 事件
  // 由於現在第一個增設區塊和新添加的區塊都有了正確的 ID 和 htmlFor，
  // 點擊 Label 後會觸發 input 的 change 事件，這個監聽器就能接收到
  tabContentContainer.addEventListener("change", (event) => {
    const target = event.target;
    const parentBlock = target.closest(".settings-menu"); // 找到最近的設定區塊

    // 檢查這個改變的元素是否在 system tab 的 apiContainer 內部
    // 並且確認它是一個 controlMode radio 或 uploadEnabled checkbox
    // 通過檢查 target 是否在 apiContainer 內部，可以確保只處理 system tab 的事件
    if (
      currentActiveTabId === "system" &&
      parentBlock &&
      parentBlock.closest("#api-container")
    ) {
      // 這個改變發生在 system tab 內的設定區塊中

      // 檢查是否是下載功能的 radio button 變化
      if (target.matches('input[type="radio"][name="controlMode"]')) {
        console.log(
          "System Tab - 下載功能狀態改變:",
          target.id || "動態ID",
          "是否啟用:",
          target.checked
        );
        // TODO: Handle download toggle change for this specific system block
        // 可以使用 parentBlock 找到該系統區塊，然後根據需要處理數據
        // 例如：getSystemData(parentBlock).downloadEnabled = target.checked;
        // 因為是 radio，瀏覽器會自動 uncheck 其他同 name 的 radio
      }

      // 檢查是否是上傳功能的 checkbox 變化
      if (target.matches('input[type="checkbox"][name="uploadEnabled"]')) {
        console.log(
          "System Tab - 上傳功能狀態改變:",
          target.id || "動態ID",
          "是否啟用:",
          target.checked
        );
        // TODO: Handle upload toggle change for this specific system block
        // 例如：getSystemData(parentBlock).uploadEnabled = target.checked;
      }
      // 你可能還有其他 system tab 特定輸入框的 change 事件需要處理，可以在這裡加入
      // 例如：input[name="systemName"], input[name="apiKey"], input[name="token"], input[name="uploadUrl"]
    }

    // --- 其他 Tab 的 change 事件處理 (保持不變) ---
    // 處理 student-management tab 的 radio buttons
    // if (currentActiveTabId === "student-management" && target.matches('input[name="connection"]')) {
    //      console.log('學生管理 - 量測類型改變:', target.value);
    //      // TODO: 處理量測類型變化的邏輯
    //      // 例如：window.env.MEASUREMENT_TYPE = target.value; // 可能需要在保存時讀取，這裡只是響應變化
    // }
    //  // 處理 upload-time tab 的 radio buttons 和 time input
    //  if (currentActiveTabId === "upload-time") {
    //      if (target.matches('input[name="uploadTimePeriod"]')) {
    //           console.log('定時上傳 - 時間段改變:', target.value);
    //           // TODO: 處理時間段變化的邏輯
    //      } else if (target.matches('input[type="time"][name="uploadTimeValue"]')) {
    //           console.log('定時上傳 - 具體時間改變:', target.value);
    //           // TODO: 處理具體時間變化的邏輯
    //      }
    //  }
    // --- 其他 Tab 的 change 事件處理結束 ---
  });

  document
    .getElementById("save-settings")
    .addEventListener("click", async () => {
      let envData = {}; // 初始化一個空物件，只收集當前活躍分頁的資料
      if (currentActiveTabId === "student-management") {
        envData = {
          TYPE:
            document.querySelector('input[name="connection"]:checked')?.value ||
            "",
          SCHOOL_NAME:
            document.querySelector('input[name="schoolName"]')?.value || "",
          SCHOOL_ID:
            document.querySelector('input[name="schoolId"]')?.value || "",
        };
      } else if (currentActiveTabId === "system") {
        // --- 收集 system 分頁的所有系統設定 ---
        const systemConfigs = []; // 用來存放所有系統設定物件的陣列 // 找到 apiContainer 中的所有系統區塊 (預設系統和所有增設系統)

        // .settings-menu class 涵蓋了所有系統區塊
        const allSystemBlocks = apiContainer.querySelectorAll(".settings-menu");

        allSystemBlocks.forEach((blockElement) => {
          // 判斷是否為增設系統區塊 (有 .api-plus class)
          const isAddedSystem = blockElement.classList.contains("api-plus"); // 找到各個 input 元素

          const systemNameInput = blockElement.querySelector(
            'input[name="systemName"]'
          ); // 模板中的網址欄位 name 是 uploadUrl，這裡取它的值作為系統的 url
          const urlInput = blockElement.querySelector(
            'input[name="uploadUrl"]'
          ); // 找到 radio 和 checkbox

          const downloadRadio = blockElement.querySelector(
            'input[type="radio"][name="controlMode"]'
          );
          const uploadCheckbox = blockElement.querySelector(
            'input[type="checkbox"][name="uploadEnabled"]'
          ); // 構建單個系統的設定物件

          const systemConfig = {
            // 根據是否為增設系統設定類型標識 (方便後端識別)
            type: isAddedSystem ? "added" : "default", // 收集通用欄位的值
            systemName: systemNameInput?.value || "", // 使用 url 作為 key 名稱，值來自 uploadUrl input
            url: urlInput?.value || "", // 收集開關狀態

            // radio.checked 屬性反映了當前這個 radio 是否被選中
            downloadEnabled: downloadRadio?.checked || false,
            // checkbox.checked 屬性反映了當前這個 checkbox 是否被勾選
            uploadEnabled: uploadCheckbox?.checked || false,
          }; // 根據系統類型，收集 API Key 或 Token

          if (!isAddedSystem) {
            // 預設系統
            const apiKeyInput = blockElement.querySelector(
              'input[name="apiKey"]'
            );
            systemConfig.apiKey = apiKeyInput?.value || "";
            // 預設系統的 url, downloadEnabled, uploadEnabled 已經在上面收集
          } else {
            // 增設系統
            const tokenInput = blockElement.querySelector(
              'input[name="token"]'
            );
            systemConfig.token = tokenInput?.value || "";
            // 增設系統的 url, downloadEnabled, uploadEnabled 也已經在上面收集
          } // 將這個系統的設定物件添加到陣列中

          systemConfigs.push(systemConfig);
        }); // 最終 envData 包含所有系統設定的陣列，使用 SYSTEM_CONFIGS 作為 key

        envData = {
          SYSTEM_CONFIGS: systemConfigs,
        };

        // 發送這個包含 SYSTEM_CONFIGS 陣列的 JSON 物件到後端
        // 後端會負責解析這個陣列，並根據其中的 downloadEnabled 和 uploadEnabled 狀態
        // 來更新 .env 檔案中的 DOWNLOAD_URL 和 UPLOAD_URL 等 key
        // 例如，後端會找到 systemConfigs 中 downloadEnabled 為 true 的那個物件，取其 url 作為 DOWNLOAD_URL
        // 找到所有 uploadEnabled 為 true 的物件，取其 url 組成 UPLOAD_URL (例如逗號分隔字串)
        // 找到 type 為 'default' 的物件，取其 apiKey 作為 .env 的 API_KEY
        // 可能也取 type 為 'default' 的物件的 url 作為 SHIS_BASE_URL
        // 後端也可能將 systemConfigs 整個列表儲存到另一個地方，以便啟動時加載所有系統配置
        console.log("System Tab - Collected envData:", envData); // 在發送前打印 system tab 的數據結構
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
