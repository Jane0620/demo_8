import { domReady } from "./util.js";

async function initSearch() {
  await domReady(); // 等待 HTML Ready

  // 先載入搜尋框 HTML
  const response = await fetch("../components/search.html");
  const html = await response.text();
  document.getElementById("search-container").innerHTML = html;

  // 再抓 input 綁事件
  const searchInput = document.querySelector('#search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const rows = document.querySelectorAll('tbody tr'); // ⚡ 每次輸入時動態抓取

      rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
      });
    });
  }
}

initSearch();
