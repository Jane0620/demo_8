// services/mockDataSender.js

let sampleData = [
  "STX,175.6,68.36,M,105.4,022.8,ET",
  "STX,165.6,55.26,F,105.4,022.8,ET",
  "STX,134.6,29.26,C,105.4,022.8,ET",
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
