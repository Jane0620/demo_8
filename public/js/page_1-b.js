import {
    insertTable,
    fetchAndDisplayData,
    renderStudentTable,
    domReady
  } from '/js/util.js';

  let students = [];

  async function initPage(){
    await domReady();
    const className = localStorage.getItem('class_name');
    if (className) {
      document.getElementById('class-name-header').textContent = className;
    }

    const container = document.getElementById('classes-container');
    const classGrade = localStorage.getItem('class_grade');
    const classNo = localStorage.getItem('class_no');

    if (!classGrade || !classNo) {
      container.innerHTML = '<p>無法取得班級資訊，請返回班級列表。</p>';
      return;
    }

    const url = `${window.env.API_BASE_URL}/api/students?class_grade=${classGrade}&class_no=${classNo}`;

    fetchAndDisplayData(
      container,
      url,
      (data) => {
        students = data;
        if (students && students.length > 0) {
          renderStudentTable(container, students);
        } else {
          container.innerHTML = '<p>找不到學生資料。</p>';
        }
      },
      '學生名單載入失敗。'
    );
  };
  initPage();