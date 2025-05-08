async function initHeader() {
  try {
    const headerContainer = document.getElementById("header-container");
    if (!headerContainer) {
      throw new Error("無法找到 #header-container 元素");
    }

    const response = await fetch("/components/header.html");
    if (!response.ok) {
      throw new Error(`無法載入 header 組件 (狀態碼: ${response.status})`);
    }

    const headerHtml = await response.text();
    headerContainer.innerHTML = headerHtml;

    // 學校名稱
    const schoolNameElement = document.getElementById("school-name");
    if (schoolNameElement) {
      schoolNameElement.textContent = window.env?.SCHOOL_NAME || "未知學校";
      // console.log("✅ header 載入成功，學校名稱設定為：", schoolNameElement.textContent);
    } else {
      console.error("❌ 無法找到 #school-name 元素");
    }

    // 量測說明
    const typeElement = document.getElementById("type-description");
    if (typeElement) {
      const type = window.env?.MEASUREMENT_TYPE || "unknown";
      let typeText = "，你好";

      switch (type) {
        case "height-weight":
          typeText = "，量測身高體重";
          break;
        case "vision":
          typeText = "，量測視力";
          break;
      }

      typeElement.textContent = typeText;
      // console.log("✅ TYPE 載入成功，顯示文字為：", typeText);
    } else {
      console.error("❌ 無法找到 #type-description 元素");
    }

  } catch (error) {
    console.error("❌ header 載入失敗：", error.message);
  }

}

// 重要：直接判斷，如果 DOM 已經 ready 就直接執行，否則等 DOMContentLoaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHeader);
} else {
  initHeader();
}