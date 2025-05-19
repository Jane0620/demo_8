import { domReady } from "./util.js";

async function initPage() {


}
initPage();

// 建立連線
function initializeWebSocket() {
  /* 
     假設你的後端 WebSocket 伺服器運行在相同的域名和端口，路徑為 '/ws' (如果沒有指定路徑，預設就是 '/' )
     如果你的後端伺服器和端口與前端不同，請替換為正確的 URL
     例如： const ws = new WebSocket('ws://localhost:3000');
     注意：window.env.API_BASE_URL 通常用於 REST API，WebSocket 通常使用 ws:// 或 wss:// 協定
     伺服器是 http://localhost:3000，則 WebSocket 連線是 ws://localhost:3000 
  */
  const ws = new WebSocket(
    `${window.location.protocol === "https:" ? "wss" : "ws"}://${
      window.location.host
    }`
  ); // 假設WebSocket和HTTP服務器共享相同的host和port

  ws.onopen = () => {
    console.log("Connected to WebSocket server");
  };

  ws.onmessage = (event) => {
    try {
      const receivedData = JSON.parse(event.data);
      console.log("Received measurement data via WebSocket:", receivedData);

    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  };

  ws.onclose = () => {
    console.log(
      "Disconnected from WebSocket server. Attempting to reconnect in 3 seconds..."
    );
    setTimeout(initializeWebSocket, 3000); // 斷線後嘗試重新連接
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
  };
}