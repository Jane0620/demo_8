// 動態載入 Sidebar
fetch("/components/sidebar.html")
  .then((response) => response.text())
  .then((data) => {
    document.getElementById("sidebar-container").innerHTML = data;
    highlightCurrentSidebarItem(); // 必須在載完 sidebar 後呼叫！
  });

// ✅ 封裝一個專門做 Highlight 的 function
function highlightCurrentSidebarItem() {
  const sidebarItems = document.querySelectorAll('.sidebar-item a');
  const currentPath = window.location.pathname; 

  sidebarItems.forEach(item => {
    const targetPath = item.getAttribute('href'); 
    
    // 檢查當前路徑是否為1_b.html，如果是，則高亮顯示名單管理項
    if (currentPath.includes('1_b.html') && targetPath && targetPath.includes('1_a.html')) {
      item.parentElement.classList.add('active');
    }else if (currentPath.includes('2_b.html') && targetPath && targetPath.includes('2_a.html')) {
      item.parentElement.classList.add('active');
    }
    // 其他一般情況的處理
    else if (targetPath && currentPath === targetPath) {
      item.parentElement.classList.add('active');
    } else {
      item.parentElement.classList.remove('active');
    }
  });
}

