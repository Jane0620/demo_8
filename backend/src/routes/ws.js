// routes/ws.js
import { WebSocketServer } from 'ws';

const setupWebSocket = (server) => {
    const wss = new WebSocketServer({ server });
    const clients = new Set();

    wss.on('connection', ws => {
        clients.add(ws);

        ws.on('message', message => {
            // 前端請求 (message 是 Buffer 或 ArrayBuffer)
            const messageString = message.toString('utf-8'); // 轉換為字串
            console.log(`Received message: ${messageString}`);
            // 在這裡處理來自客戶端的消息
        });

        ws.on('close', () => {
            clients.delete(ws);
            console.log('Client disconnected');
        });

        ws.on('error', error => {
            console.error('WebSocket error:', error);
            clients.delete(ws);
        });
    });

    const broadcast = (data) => {
        const jsonData = JSON.stringify(data);
        clients.forEach(client => {
            if (client.readyState === WebSocketServer.OPEN) {
                client.send(jsonData);
            }
        });
    };

    return { broadcast };
};

export default setupWebSocket;