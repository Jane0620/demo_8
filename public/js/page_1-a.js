import {
    getAuthData,
    showLoading,
    insertTable,
    createTableHTML,
    fetchAndDisplayData,
    handleFetchError,
    domReady
  } from '/js/util.js';

  async function initPage()  {
    await domReady();
    const auth = getAuthData();
    const schoolId = auth?.schoolId;
    const token = auth?.token;
    const container = document.getElementById('classes-container');

    console.log('schoolId:', schoolId);
    if (!schoolId || !token) {
      insertTable(container, null, '請重新登入，找不到登入資訊');
      return;
    }

    const url = `${window.env.API_BASE_URL}/api/classes?school_id=${schoolId}`;

    // 使用 fetchAndDisplayData 獲取並顯示班級資料
    fetchAndDisplayData(
      container,
      url,
      (data) => {
        const headers = [
          { title: '年級', key: 'grade' },
          { title: '班代號', key: 'no' },
          { title: '班級名稱', key: 'name' },
          { title: '班級 id', key: 'class_id' },
          { title: '學生名單', key: '' }
        ];

        const rowRenderer = (cls) => `
          <tr onclick="viewStudentList('${cls.id}', '${cls.name}', '${cls.grade}', '${cls.no}')" style="cursor: pointer;">
            <td>${cls.grade}</td>
            <td>${cls.no}</td>
            <td>${cls.name}</td>
            <td>${cls.class_id}</td>                  
            <td>
              <button class="btn" onclick="event.stopPropagation(); viewStudentList('${cls.id}', '${cls.name}', '${cls.grade}', '${cls.no}')">查看學生名單</button>
            </td>
          </tr>
        `;

        const tableHTML = createTableHTML(data, { headers, rowRenderer });
        insertTable(container, tableHTML);
      },
      '班級資料載入失敗。'
    );

    // 按鈕事件：下載最新班級資料
    document.getElementById('dowmload-new-schema').addEventListener('click', async () => {
      if (!schoolId || !token) {
        alert('請重新登入，找不到 school_id 或 Token');
        return;
      }

      const downloadUrl = `${window.env.API_BASE_URL}/api/download-classes`;

      try {
        showLoading(container); // 顯示載入動畫

        const response = await fetch(downloadUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ schoolId, token }),
        });

        if (!response.ok) {
          throw new Error(`HTTP 錯誤：${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
          alert('班級資料已成功更新！');
          location.reload();
        } else {
          alert('更新失敗：' + result.error);
        }
      } catch (err) {
        handleFetchError(err, container, '下載班級資料失敗，請稍後再試！');
      }
    });
  };
  initPage();

  window.viewStudentList = (classId, className, classGrade, classNo) => {
    localStorage.setItem('class_id', classId);
    localStorage.setItem('class_name', className);
    localStorage.setItem('class_grade', classGrade);
    localStorage.setItem('class_no', classNo);
    window.location.href = './1_b.html';
  };