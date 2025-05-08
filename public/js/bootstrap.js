function loadModuleWhenEnvReady(modulePath) {
    // 立即檢查 window.env 是否存在
    if (window.env) {
      // console.log(`✅ 載入模組: ${modulePath}, window.env 存在`);
      loadModule(modulePath);
    } else {
      console.log(`⏳ 等待 window.env 載入...`);
      // 每 50ms 檢查一次，最多等 2.5 秒
      let retries = 50;
      const interval = setInterval(() => {
        if (window.env) {
          clearInterval(interval);
          // console.log(`✅ 載入模組: ${modulePath}, window.env 已載入`);
          loadModule(modulePath);
        } else if (--retries <= 0) {
          clearInterval(interval);
          console.error(`❌ 等待 window.env 超時，模組未載入: ${modulePath}`);
        }
      }, 50);
    }
  }
  
  function loadModule(modulePath) {
    // console.log(`🔄 開始載入模組: ${modulePath}`);
    const script = document.createElement("script");
    script.type = "module";
    script.src = modulePath;
    script.onload = () => // console.log(`✅ 模組載入成功: ${modulePath}`);
    script.onerror = (e) => console.error(`❌ 模組載入失敗: ${modulePath}`, e);
    document.head.appendChild(script);
  }