/**
 * 渲染量測表格
 * @param {HTMLElement} container - 容器元素
 * @param {Array} students - 學生數據
 * @param {Object} options - 配置選項
 * @param {string} options.measurementType - 測量類型（如 "height-weight" 或 "vision"）
 */
export function renderManualTable(container, students, options = {}) {
  const measurementType = window.env.MEASUREMENT_TYPE;

  function formatDateTime(dateStr) {
    const date = dateStr ? new Date(dateStr) : new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const hour = date.getHours().toString().padStart(2, "0");
    const minute = date.getMinutes().toString().padStart(2, "0");
    return `${year}-${month}-${day}T${hour}:${minute}`; // 顯示用
  }

  let tableHTML = "";

  const getRowHTML = (student, isRowReadOnly) => {
    const commonRowStart = `
        <tr>
          <td><input type="checkbox" data-student-id="${
            student.pid
          }" class="attendance-checkbox" ${
      student.attended ? "checked" : ""
    } /></td>
          <td class="seat">${student.seat}</td>
          <td>${student.name}</td>
          <td>${student.sex == 1 ? "男" : "女"}</td>
      `;
    const commonRowEnd = `
          <td><input type="datetime-local" class="date-input" value="${formatDateTime(
            student.date
          )}" ${isRowReadOnly ? "readonly" : ""} /></td>
        </tr>
      `;

    if (measurementType === "height-weight") {
      return `${commonRowStart}
          <td><input type="number" class="height-input" value="${
            student.height || ""
          }" ${isRowReadOnly ? "readonly" : ""} /></td>
          <td><input type="number" class="weight-input" value="${
            student.weight || ""
          }" ${isRowReadOnly ? "readonly" : ""} /></td>
          ${commonRowEnd}
        `;
    } else if (measurementType === "vision") {
      return `${commonRowStart}
          <td><input type="number" step="any" class="sight-input left-naked" value="${
            student.Sight0L || ""
          }" ${isRowReadOnly ? "readonly" : ""} /></td>
          <td><input type="number" step="any" class="sight-input right-naked" value="${
            student.Sight0R || ""
          }" ${isRowReadOnly ? "readonly" : ""} /></td>
          <td><input type="number" step="any" class="sight-input left" value="${
            student.SightL || ""
          }" ${isRowReadOnly ? "readonly" : ""} /></td>
          <td><input type="number" step="any" class="sight-input right" value="${
            student.SightR || ""
          }" ${isRowReadOnly ? "readonly" : ""} /></td>
          ${commonRowEnd}
        `;
    }
    return "";
  };

  if (measurementType === "height-weight" || measurementType === "vision") {
    tableHTML = `
        <table border="1" cellpadding="8" cellspacing="0" class="measure-table">
          <thead>
            <tr>
              <th>點名</th>
              <th>座號</th>
              <th>姓名</th>
              <th>性別</th>
              ${
                measurementType === "height-weight"
                  ? "<th>身高 (cm)</th><th>體重 (kg)</th>"
                  : ""
              }
              ${
                measurementType === "vision"
                  ? "<th>左眼裸視</th><th>右眼裸視</th><th>左眼視力</th><th>右眼視力</th>"
                  : ""
              }
              <th>檢測日期</th>
            </tr>
          </thead>
          <tbody>
            ${students
              .map((student) => {
                const isRowReadOnly = !student.attended; // Modified logic
                return getRowHTML(student, isRowReadOnly);
              })
              .join("")}
          </tbody>
        </table>
      `;
  }

  container.innerHTML = tableHTML;

  // 在表格渲染後，為點名checkbox添加事件監聽器

  const attendanceCheckboxes = container.querySelectorAll(
    ".attendance-checkbox"
  );
  attendanceCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", (event) => {
      const studentId = event.target.dataset.studentId;
      const isChecked = event.target.checked;

      // 更新 students 陣列中對應學生的 attended 屬性
      students = students.map((student) =>
        student.pid === studentId
          ? { ...student, attended: isChecked }
          : student
      );

      // 找到對應的表格行
      const row = event.target.closest("tr");
      if (row) {
        // 根據測量類型更新輸入欄位的 readonly 屬性
        if (measurementType === "height-weight") {
          const heightInput = row.querySelector(".height-input");
          const weightInput = row.querySelector(".weight-input");
          if (heightInput) {
            heightInput.readOnly = !isChecked;
          }
          if (weightInput) {
            weightInput.readOnly = !isChecked;
          }
        } else if (measurementType === "vision") {
          const leftNakedInput = row.querySelector(".sight-input.left-naked");
          const rightNakedInput = row.querySelector(".sight-input.right-naked");
          const leftInput = row.querySelector(".sight-input.left");
          const rightInput = row.querySelector(".sight-input.right");
          if (leftNakedInput) {
            leftNakedInput.readOnly = !isChecked;
          }
          if (rightNakedInput) {
            rightNakedInput.readOnly = !isChecked;
          }
          if (leftInput) {
            leftInput.readOnly = !isChecked;
          }
          if (rightInput) {
            rightInput.readOnly = !isChecked;
          }
        }

        // 更新日期時間輸入框的 readonly 屬性
        const dateInput = row.querySelector(".date-input");
        if (dateInput) {
          dateInput.readOnly = !isChecked;
        }
      }
    });
  });

  // container.innerHTML = tableHTML;
}

/**
 * 渲染量測表格 (自動輸入模式)
 * @param {HTMLElement} container - 容器元素
 * @param {Array} students - 學生數據
 * @param {Object} options - 配置選項
 * @param {string} options.measurementType - 測量類型（如 "height-weight" 或 "vision"）
 */

export let selectedStudentsForDetection = [];

export function renderAutoTable(container, students, options = {}) {
  const measurementType = window.env.MEASUREMENT_TYPE;

  selectedStudentsForDetection = [];
  students.forEach(student => {
    if (student.attended) {
      selectedStudentsForDetection.push(student.pid);
    }
  });

  function formatDateTime(dateStr) {
    const date = dateStr ? new Date(dateStr) : new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const hour = date.getHours().toString().padStart(2, "0");
    const minute = date.getMinutes().toString().padStart(2, "0");
    return `${year}-${month}-${day}T${hour}:${minute}`; // 顯示用
  }

  let tableHTML = "";

  const getRowHTML = (student) => {
    const commonRowStart = `
        <tr data-student-pid="${student.seat}">
          <td><input type="checkbox" data-student-id="${
            student.pid
          }" class="attendance-checkbox" ${
      student.attended ? "checked" : ""
    } /></td>
          <td class="seat">${student.seat}</td>
          <td>${student.name}</td>
          <td>${student.sex == 1 ? "男" : "女"}</td>
      `;
    const commonRowEnd = `
          <td><input type="datetime-local" class="date-input" value="${formatDateTime(
            student.date
          )}" readonly /></td>
        </tr>
      `;

    let rowSpecificData = "";
    if (measurementType === "height-weight") {
      rowSpecificData = `
          <td><input type="number" class="height-input" value="${
            student.height || ""
          }" readonly /></td>
          <td><input type="number" class="weight-input" value="${
            student.weight || ""
          }" readonly /></td>
        `;
    } else if (measurementType === "vision") {
      rowSpecificData = `
          <td><input type="number" step="any" class="sight-input left-naked" value="${
            student.Sight0L || ""
          }" readonly /></td>
          <td><input type="number" step="any" class="sight-input right-naked" value="${
            student.Sight0R || ""
          }" readonly /></td>
          <td><input type="number" step="any" class="sight-input left" value="${
            student.SightL || ""
          }" readonly /></td>
          <td><input type="number" step="any" class="sight-input right" value="${
            student.SightR || ""
          }" readonly /></td>
        `;
    }

    return `${commonRowStart}${rowSpecificData}${commonRowEnd}`;
  };

  if (measurementType === "height-weight" || measurementType === "vision") {
    tableHTML = `
          <table border="1" cellpadding="8" cellspacing="0" class="measure-table">
            <thead>
              <tr>
                <th>點名</th>
                <th>座號</th>
                <th>姓名</th>
                <th>性別</th>
                ${
                  measurementType === "height-weight"
                    ? "<th>身高 (cm)</th><th>體重 (kg)</th>"
                    : ""
                }
                ${
                  measurementType === "vision"
                    ? "<th>左眼裸視</th><th>右眼裸視</th><th>左眼視力</th><th>右眼視力</th>"
                    : ""
                }
                <th>檢測日期</th>
              </tr>
            </thead>
            <tbody>
              ${students.map((student) => getRowHTML(student)).join("")}
            </tbody>
          </table>
        `;
  }

  container.innerHTML = tableHTML;

  const attendanceCheckboxes = container.querySelectorAll(
    ".attendance-checkbox"
  );
  attendanceCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", (event) => {

      const studentId = event.target.dataset.studentId;
      if (event.target.checked) {
        if (!selectedStudentsForDetection.includes(studentId)) {
          selectedStudentsForDetection.push(studentId);
        }
      } else {
        selectedStudentsForDetection = selectedStudentsForDetection.filter(
          (id) => id !== studentId
        );
      }
    });
  });
}
