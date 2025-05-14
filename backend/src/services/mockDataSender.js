// services/mockDataSender.js

export function startDataSimulation(port, options = {}) {
  console.log("開始模擬設備發送資料...");

  const sampleData = options.sampleData || [
    "STX,M,70.50,175.6,22.8,ET",
    "STX,F,58.32,162.8,22.0,ET",
    "STX,C,32.10,135.5,17.4,ET",
    "STX,M,85.72,182.3,25.8,ET",
    "STX,F,62.45,168.7,21.9,ET",
  ];

  let index = 0;

  function getRandomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  const simulationInterval = setInterval(() => {
    if (!port.isOpen) {
      clearInterval(simulationInterval);
      console.log("串口已關閉，停止模擬");
      return;
    }

    const data = sampleData[index % sampleData.length];
    console.log(`模擬設備發送資料: ${data}`);

    try {
      port.port.emitData(Buffer.from(`${data}\r\n`));
    } catch (err) {
      console.error("發送模擬資料時發生錯誤:", err.message);
    }

    index++;
    if (index >= 10) {
      clearInterval(simulationInterval);
      console.log("模擬資料發送完畢");
    }
  }, getRandomDelay(5000, 8000));
}
