import {
    getAuthData,
    showLoading,
    insertTable,
    createTableHTML,
    fetchAndDisplayData,
    handleFetchError,
    domReady
  } from '../js/util.js';

  async function initPage() {
    await domReady();
    const auth = getAuthData();
    const schoolId = auth?.schoolId;
    const token = auth?.token;
    const container = document.getElementById('classes-container');

    if (!schoolId || !token) {
      insertTable(container, null, '請重新登入，找不到登入資訊');
      return;
    }

    const url = `${window.env.API_BASE_URL}/api/classes?school_id=${schoolId}`;

    fetchAndDisplayData(
      container,
      url,
      (data) => {
        const headers = [
          { title: '年級', key: 'grade' },
          { title: '班代號', key: 'no' },
          { title: '班級名稱', key: 'name' },
          { title: '功能', key: '' }
        ];

        const rowRenderer = (cls) => `
      <tr onclick="viewStudentList('${cls.id}', '${cls.name}', '${cls.grade}', '${cls.no}')" style="cursor: pointer;">
        <td>${cls.grade}</td>
        <td>${cls.no}</td>
        <td>${cls.name}</td>       
        <td>
          <button class="btn" onclick="event.stopPropagation(); viewStudentList('${cls.id}', '${cls.name}', '${cls.grade}', '${cls.no}')">開始測量</button>
        </td>
      </tr>
    `;

        const tableHTML = createTableHTML(data, { headers, rowRenderer });
        insertTable(container, tableHTML);
      },
      '班級資料載入失敗。'
    );
  };

  initPage();

  window.viewStudentList = (id, className, classGrade, classNo) => {
    localStorage.setItem('class_name', className);
    localStorage.setItem('class_grade', classGrade);
    localStorage.setItem('class_no', classNo);
    window.location.href = './2_b.html';
  };