
export function getEnv(key) {
  if (!window.env) {
    console.warn("❌ window.env 尚未定義");
    return null;
  }
  return window.env[key];
}

export function domReady() {
  if (document.readyState === "loading") {
    return new Promise(resolve => {
      document.addEventListener("DOMContentLoaded", resolve);
    });
  } else {
    return Promise.resolve();
  }
}


// 修改 getAuthData 函數
export function getAuthData() {
  const schoolId = localStorage.getItem("school_id");
  const token = localStorage.getItem("shis_token");

  if (!schoolId || !token) {
    console.warn("Auth 資料不完整，請重新登入");
    
    // 如果不是已經在登入頁面，則重定向到登入頁面
    if (!window.location.pathname.includes('login.html') && !window.location.pathname.endsWith('/')) {
      window.location.href = '/'; // 或您的登入頁面路徑
      return null;
    }
    return null;
  }

  return { schoolId, token };
}


/**
 * 插入表格到指定容器
 * @param {HTMLElement} container - 要插入表格的容器元素
 * @param {string} tableHTML - 表格HTML字符串，如果為空則顯示無數據信息
 * @param {string} [emptyMessage="目前沒有資料。"] - 無數據時顯示的信息
 * @param {boolean} [clearLoading=true] - 是否清除加載狀態
 * @returns {void}
 */
export function insertTable(container, tableHTML, emptyMessage = "目前沒有資料。", clearLoading = true) {
  if (!container) {
    console.error("插入表格失敗：容器元素不存在");
    return;
  }

  if (clearLoading) {
    container.innerHTML = "";
  }

  if (tableHTML) {
    container.innerHTML += tableHTML;
  } else {
    container.innerHTML += `<p>${emptyMessage}</p>`;
  }
}

/**
 * 創建表格HTML
 * @param {Array} data - 數據數組
 * @param {Object} options - 表格配置選項
 * @param {Array} options.headers - 表頭配置 [{title: '標題', key: '數據鍵名'}]
 * @param {Function} options.rowRenderer - 自定義行渲染函數，可選
 * @returns {string} - 表格HTML
 */
export function createTableHTML(data, { headers, rowRenderer }) {
  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  // 生成表頭
  const headerRow = `
    <thead>
      <tr>
        ${headers.map(header => `<th>${header.title}</th>`).join('')}
      </tr>
    </thead>
  `;

  // 如果提供了行渲染函數則使用它，否則使用默認渲染
  let tableBody;
  if (typeof rowRenderer === 'function') {
    tableBody = data.map(item => rowRenderer(item)).join('');
  } else {
    tableBody = data.map(item => `
      <tr>
        ${headers.map(header => `<td>${item[header.key] || ''}</td>`).join('')}
      </tr>
    `).join('');
  }

  // 組合完整表格
  return `
    <table border="1" cellpadding="8" cellspacing="0">
      ${headerRow}
      <tbody>
        ${tableBody}
      </tbody>
    </table>
  `;
}

/**
 * 顯示加載狀態
 * @param {HTMLElement} container - 要顯示加載狀態的容器
 */
export function showLoading(container) {
  if (!container) return;
  
  container.innerHTML = `
    <div class="loading">
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="dot"></span>
    </div>
  `;
}

/**
 * 通用頁籤切換功能
 * @param {Object} options - 配置選項
 * @param {string} options.containerSelector - 頁籤容器的選擇器
 * @param {string} options.tabButtonSelector - 頁籤按鈕的選擇器
 * @param {string} options.tabContentSelector - 頁籤內容的選擇器
 * @param {Function} [options.onTabSwitch] - 頁籤切換時的回調函式
 * @param {string} [options.activeClass="active"] - 激活狀態的類名
 */
export function setupTabSwitching({
  containerSelector,
  tabButtonSelector,
  tabContentSelector,
  onTabSwitch,
  activeClass = "active",
}) {
  const container = document.querySelector(containerSelector);
  if (!container) {
    console.error("容器元素不存在");
    return;
  }

  const tabButtons = container.querySelectorAll(tabButtonSelector);
  const tabContents = container.querySelectorAll(tabContentSelector);

  if (!tabButtons.length || !tabContents.length) {
    console.error("頁籤按鈕或內容不存在");
    return;
  }

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // 移除所有按鈕和內容的激活狀態
      tabButtons.forEach((btn) => btn.classList.remove(activeClass));
      tabContents.forEach((content) => content.classList.remove(activeClass));

      // 激活當前按鈕和對應的內容
      button.classList.add(activeClass);
      const targetTab = button.getAttribute("data-tab");
      const targetContent = container.querySelector(`[data-tab-content="${targetTab}"]`);
      if (targetContent) {
        targetContent.classList.add(activeClass);
      }

      // 執行自定義的頁籤切換行為
      if (typeof onTabSwitch === "function") {
        onTabSwitch(targetTab);
      }
    });
  });
}


/**
 * 顯示錯誤信息
 * @param {HTMLElement} container - 容器元素
 * @param {string} message - 錯誤信息
 */
export function showError(container, message) {
  if (!container) return;
  container.innerHTML = `<p class="error">${message}</p>`;
}

/**
 * 從API獲取數據並顯示
 * @param {HTMLElement} container - 容器元素
 * @param {string} url - API URL
 * @param {Function} successCallback - 成功獲取數據後的回調
 * @param {string} errorMessage - 錯誤信息
 */
export function fetchAndDisplayData(container, url, successCallback, errorMessage = "數據載入失敗") {
  if (!container || !url) return;
  
  showLoading(container);
  
  fetch(url)
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // 檢查是否有內容
    if (response.headers.get('Content-Length') === '0') {
      throw new Error('Response is empty');
    }

    // 確保內容類型為 JSON
    const contentType = response.headers.get('Content-Type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Invalid content type, expected JSON');
    }

    return response.json();
  })
  .then(data => {
    if (typeof successCallback === 'function') {
      successCallback(data);
    }
  })
  .catch(error => {
    console.error(error);
    showError(container, errorMessage);
  });
}
/**
 * 渲染學生名單表格
 * @param {HTMLElement} container - 容器元素
 * @param {Array} students - 學生數據
 * @param {boolean} isReadOnly - 是否為唯讀模式
 */
export function renderStudentTable(container, students) {
  const tableHTML = `
    <table border="1" cellpadding="8" cellspacing="0">
      <thead>
        <tr>
          <th>統一證號</th>
          <th>學號</th>
          <th>年</th>
          <th>班代號</th>
          <th>座號</th>
          <th>性別</th>
          <th>姓名</th>
          <th>卡號</th>
        </tr>
      </thead>
      <tbody>
        ${students.map(student => `
          <tr>
            <td>${student.pid}</td>
            <td>${student.sid}</td>
            <td>${student.class_grade}</td>
            <td>${student.class_no}</td>
            <td>${student.seat}</td>
            <td>${student.sex === "1" ? "男" : "女"}</td>
            <td>${student.name}</td>
            <td>${student.card || ''}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  insertTable(container, tableHTML);
}

/**
 * 處理 Fetch 請求的錯誤
 * @param {Error} error - 錯誤對象
 * @param {HTMLElement} container - 容器元素
 * @param {string} defaultMessage - 預設錯誤訊息
 */
export function handleFetchError(error, container, defaultMessage = "發生錯誤，請稍後再試") {
  console.error(error);

  let errorMessage = defaultMessage;

  if (error.message.includes('Failed to fetch')) {
    errorMessage += '\n可能是網路問題或伺服器無法訪問。';
  } else {
    errorMessage += '\n錯誤詳情：' + error.message;
  }

  showError(container, errorMessage);
}

/**
 * 格式化日期為 'YYYY-MM-DD HH:mm:ss+08:00' 格式
 * @param {string} dateString - 日期字串
 * @returns {string|null} 格式化後的日期字串
 */
export function formatToISO8601UTC(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return date.toISOString(); // '2025-04-28T06:18:00.000Z'
}



/**
 * 收集學生數據
 * @returns {Object} 包含學生數據的物件
 */
export function collectStudentData() {
  const measurementType = window.env.MEASUREMENT_TYPE;
  const rows = document.querySelectorAll('table tbody tr');
  const students = [];
  const classGrade = localStorage.getItem('class_grade');
  const classNo = localStorage.getItem('class_no');

  rows.forEach(row => {
    const checkbox = row.querySelector('.attendance-checkbox');

    if (!checkbox || !checkbox.checked) {
      return; // 如果 checkbox 不存在或未被勾選，則跳過當前行
    }
    
    const studentId = checkbox.getAttribute('data-student-id');
    const seatElement = row.querySelector('.seat');

    if (!seatElement) {
      console.error(`❌ 缺少 .seat 元素，跳過該行：`, row);
      return; // 跳過該行
    }

    if (measurementType === 'height-weight') {
      const heightInput = row.querySelector('.height-input');
      const weightInput = row.querySelector('.weight-input');
      const dateInput = row.querySelector('.date-input');

      const formattedDate = dateInput && dateInput.value
        ? formatToISO8601UTC(dateInput.value)
        : null;

      students.push({
        Pid: studentId,
        Sid: "", // 假設 Sid 為空
        No: parseInt(classNo, 10), // 確保是數字
        Grade: parseInt(classGrade, 10), // 確保是數字
        Seat: parseInt(seatElement.textContent.trim(), 10), // 確保是數字
        Name: row.querySelector('td:nth-child(3)').textContent.trim(), // 姓名
        Height: parseFloat(heightInput ? heightInput.value : 0), // 確保是數字
        Weight: parseFloat(weightInput ? weightInput.value : 0), // 確保是數字
        ExamDate: formattedDate
      });
    } else if (measurementType === 'vision') {
      const sight0L = row.querySelector('.sight-input.left-naked');
      const sight0R = row.querySelector('.sight-input.right-naked');
      const sightL = row.querySelector('.sight-input.left');
      const sightR = row.querySelector('.sight-input.right');
      const dateInput = row.querySelector('.date-input');

      const formattedDate = dateInput && dateInput.value
        ? formatToISO8601UTC(dateInput.value)
        : null;

      students.push({
        Pid: studentId,
        Sid: "", // 假設 Sid 為空
        No: parseInt(classNo, 10), // 確保是數字
        Grade: parseInt(classGrade, 10), // 確保是數字
        Seat: parseInt(seatElement.textContent.trim(), 10), // 確保是數字
        Name: row.querySelector('td:nth-child(3)').textContent.trim(), // 姓名
        Sight0L: sight0L && sight0L.value !== '' ? parseFloat(sight0L.value) : null,
        Sight0R: sight0R && sight0R.value !== '' ? parseFloat(sight0R.value) : null,
        SightL: sightL && sightL.value !== '' ? parseFloat(sightL.value) : null,
        SightR: sightR && sightR.value !== '' ? parseFloat(sightR.value) : null,
        ExamDate: formattedDate
      });
    }
  });

  return {
    CheckField: 1,
    Students: students
  };
}