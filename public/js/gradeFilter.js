// 動態載入 Grade Filter
fetch("../components/gradeFilter.html")
  .then((response) => response.text())
  .then((data) => {
    document.getElementById("grade-filter").innerHTML = data;
  });

document.addEventListener('DOMContentLoaded', () => {
  const gradeFilter = document.querySelector('#grade-filter');
  if (gradeFilter) {
    gradeFilter.addEventListener('change', (e) => {
      const selectedGrade = e.target.value;
      const rows = document.querySelectorAll('tbody tr');
      
      rows.forEach(row => {
        const grade = row.cells[0].textContent;
        row.style.display = selectedGrade === 'all' || grade === selectedGrade ? '' : 'none';
      });
    });
  }
});