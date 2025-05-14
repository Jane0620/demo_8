// services/mockDataSender.js

let sampleData = [
  "STX,M,70.50,175.6,22.8,ET",
  "STX,F,58.32,162.8,22.0,ET",
  "STX,C,32.10,135.5,17.4,ET",
  "STX,M,85.72,182.3,25.8,ET",
  "STX,F,62.45,168.7,21.9,ET",
];

let currentIndex = 0;
let currentPort = null;

export function bindPort(port, customData = null) {
  currentPort = port;
  if (customData) sampleData = customData;
  currentIndex = 0;
}

export function sendNextMockData() {
  if (!currentPort || !currentPort.isOpen) {
    console.warn("串口尚未綁定或尚未開啟！");
    return;
  }

  const data = sampleData[currentIndex % sampleData.length];
  currentIndex++;

  console.log(`手動發送模擬資料: ${data}`);
  try {
    currentPort.port.emitData(Buffer.from(`${data}\r\n`));
  } catch (err) {
    console.error("發送模擬資料時錯誤:", err.message);
  }
}
