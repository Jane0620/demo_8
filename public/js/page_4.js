import { setupTabSwitching, domReady } from "./util.js";

async function initPage() {
  await domReady();
  const tabContentContainer = document.querySelector(".tab-content");
  let apiContainer; // 用來存放 api-plus 容器的參考

  // 分離模板為兩個部分
  const getRadioTemplate = () => `
    <label class="measurement">📇量測類型
      <input type="radio" name="connection" value="height-weight" /><span>身高體重</span>
      <input type="radio" name="connection" value="vision" /><span>視力</span>
    </label>
    <div class="settings-menu">
    <label>🏫學校名稱：
      <input type="text" name="measurement" placeholder="請輸入學校名稱" />
    </label>
    <label>🏫學校代碼：
      <input type="text" name="measurement" placeholder="請輸入學校代碼" />
    </label>
    </div>
    <div class="api-plus settings-menu">
    <label>⬇️API-KEY：
      <input type="text" name="measurement" placeholder="請輸入API-KEY" />
    </label>
    <label>⬇️下載系統：
      <input type="text" name="measurement" placeholder="請輸入系統名稱" />
    </label>
    <label>⬇️下載網址：
      <input type="text" name="measurement" placeholder="請輸入網址" />
    </label>
    </div>
  `;

  const getApiBlockTemplate = () => `
    <div class="api-plus settings-menu">
      <label>⬆️上傳系統：
        <input type="text" name="measurement" placeholder="請輸入系統名稱" />
      </label>
      <label>⬆️上傳網址：
        <input type="text" name="measurement" placeholder="請輸入網址" />
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
        <div id="connection" class="settings-menu">
          <label>連接埠
            <input type="radio" name="connection" value="usb" />
            com1
          </label>
          <label>
            Transfer Rate
            <input type="radio" name="connection" value="wifi" />
            <span>115200bps</span>
            <input type="radio" name="connection" value="wifi" />
            <span>9600bps</span>
          </label>
        </div>
      `;
    }else if (activeTab === "upload-time") {
      tabContentContainer.innerHTML = `
        <div id="upload-time" class="settings-menu">
          <label>🕧定時上傳時間
            <input type="radio" name="upload-time" value="morning" />
            <span>早上</span>
            <input type="radio" name="upload-time" value="afternoon" />
            <span>下午</span>
          </label>
          <label>時間
          
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

  document.getElementById("save-settings").addEventListener("click", async () => {
    const uploadUrls = Array.from(document.querySelectorAll('.api-plus input[placeholder="請輸入網址"]'))
      .map(input => input.value.trim())
      .filter(url => url); // 過濾空值
  
    const envData = {
      TYPE: document.querySelector('input[name="connection"]:checked')?.value || "",
      SCHOOL_NAME: document.querySelectorAll('input[placeholder="請輸入學校名稱"]')[0]?.value || "",
      SCHOOL_ID: document.querySelectorAll('input[placeholder="請輸入學校代碼"]')[0]?.value || "",
      API_KEY: document.querySelectorAll('input[placeholder="請輸入API-KEY"]')[0]?.value || "",
      DOWNLOAD_URL: document.querySelectorAll('input[placeholder="請輸入網址"]')[0]?.value || "",
      UPLOAD_URL: uploadUrls, // 多個網址，傳陣列
    };
  
    try {
      const res = await fetch("/api/env", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(envData),
      });
  
      const result = await res.json();
      if (result.success) {
        alert("✅ 設定儲存成功，請重新啟動伺服器以生效");
      } else {
        alert("❌ 儲存失敗：" + result.error);
      }
    } catch (err) {
      alert("❌ 錯誤：" + err.message);
    }
  });
 }

initPage();



