// routes/ws.js
import { WebSocket, WebSocketServer } from 'ws';

// 這行程式碼會在 routes/ws.js 模組被載入時就執行
console.log('ws.js: Module loaded.');

const setupWebSocket = (server) => {
    // 這行程式碼會在 setupWebSocket 函數被呼叫時執行
    console.log('ws.js: setupWebSocket function called.');

    const wss = new WebSocketServer({ server });

    // 這行程式碼會在 WebSocketServer 實例建立後執行
    console.log('ws.js: WebSocketServer instance created.');

    // 為 WebSocketServer 實例本身添加錯誤監聽器
    // 這可以捕獲在 connection 事件之外發生的錯誤，例如伺服器無法監聽或升級協定時的錯誤
    wss.on('error', error => {
        console.error('ws.js: WebSocketServer encountered an error:', error);
    });

    const clients = new Set();

    wss.on('connection', ws => {
        // 如果你看到這行，表示 WebSocket 連線已經成功建立！
        console.log('ws.js: Client connected successfully!');
        clients.add(ws);

        ws.on('message', message => {
            const messageString = message.toString('utf-8');
            console.log(`ws.js: Received message: ${messageString}`);
        });

        ws.on('close', () => {
            clients.delete(ws);
            console.log('ws.js: Client disconnected');
        });

        ws.on('error', error => {
            console.error('ws.js: WebSocket client connection error:', error);
            clients.delete(ws);
        });
    });

    const broadcast = (data) => {
        const jsonData = JSON.stringify(data);
        console.log('client.readyState:', clients.readyState); // 加這行幫你 debug
        clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(jsonData);
                console.log('Broadcasting to clients:', jsonData);
            }
        });
    };

    return { broadcast };
};

export default setupWebSocket;