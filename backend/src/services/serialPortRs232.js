
// mock
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { MockBinding } from '@serialport/binding-mock';
import dotenv from "dotenv";
dotenv.config();

// 設定 Mock 綁定為 SerialPort 的綁定
SerialPort.Binding = MockBinding;

// 從環境變數取得設定
const path = process.env.SERIAL_PATH;
const baudRate = parseInt(process.env.BAUDRATE);
const dataBits = parseInt(process.env.DATABITS);
const stopBits = parseInt(process.env.STOPBITS);

// 建立模擬串口
MockBinding.createPort(path);

// 處理資料的函數 - 處理來自設備的資料
export function processData(data) {
  try {
    // 嘗試解析JSON格式資料
    const parsedData = JSON.parse(data);
    console.log("接收到JSON格式資料:", parsedData);
    return parsedData;
  } catch (e) {
    // 若非JSON格式，則顯示原始資料
    console.log("接收到原始資料:", data);

    // 嘗試根據圖片中的資料格式解析
    // STX,性別,體重,身高,BMI,ET 格式
    if (data.startsWith("STX")) {
      const parts = data.split(",");
      if (parts.length >= 6) {
        const gender = parts[1].trim();
        const weight = parseFloat(parts[2]);
        const height = parseFloat(parts[3]);
        const bmi = parseFloat(parts[4]);

        const processedData = {
          gender: getGenderText(gender),
          genderCode: gender,
          weight: weight,
          height: height,
          bmi: bmi
        };

        console.log("解析後資料:", processedData);
        return processedData;
      }
    }
    return { raw: data };
  }
}

function getGenderText(code) {
  switch (code) {
    case "M":
      return "男性";
    case "F":
      return "女性";
    case "C":
      return "兒童";
    default:
      return "未知";
  }
}

export function getAutoWhData(callback) {
  // 建立串口連線
  const port = new SerialPort({
    path: path,
    baudRate: baudRate,
    dataBits: dataBits,
    stopBits: stopBits,
    parity: "none"
  });

  // 創建解析器
  const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

  // 連線開啟時的事件處理
  port.on("open", () => {
    console.log(`模擬串口已開啟 (${path})`);
    console.log("等待模擬資料...");
    startDataSimulation(port); // 開始模擬資料
  });

  // 接收資料時的事件處理
  parser.on("data", (data) => {
    console.log("收到模擬資料:", data);
    const processedData = processData(data);
    if (callback && typeof callback === 'function') {
      callback(processedData);
    }
  });

  // 錯誤處理
  port.on("error", (err) => {
    console.error("串口錯誤:", err.message);
    if (callback && typeof callback === 'function') {
      callback({ error: err.message });
    }
  });

  return {
    close: () => {
      port.close((err) => {
        if (err) {
          console.error("關閉串口時發生錯誤:", err.message);
        } else {
          console.log("串口已關閉");
        }
      });
    }
  };
}

// 模擬設備定期發送資料
function startDataSimulation(port) {
  console.log("開始模擬設備發送資料...");

  const sampleData = [
    "STX,M,70.50000,175.60000,22.87,ET",
    "STX,F,58.32000,162.80000,22.00,ET",
    "STX,C,32.10000,135.50000,17.46,ET",
    "STX,M,85.72000,182.30000,25.81,ET",
    "STX,F,62.45000,168.70000,21.95,ET",
  ];

  let index = 0;
  const simulationInterval = setInterval(() => {
    if (!port.isOpen) {
      clearInterval(simulationInterval);
      console.log("串口已關閉，停止模擬");
      return;
    }

    const data = sampleData[index % sampleData.length];
    console.log(`模擬設備發送資料: ${data}`);

    // 使用 MockBinding 的正確方式發送資料
    try {
      port.write(`${data}\r\n`);
    } catch (err) {
      console.error("發送模擬資料時發生錯誤:", err.message);
    }

    index++;
    if (index >= 10) {
      clearInterval(simulationInterval);
      console.log("模擬資料發送完畢");
    }
  }, 3000);

  return simulationInterval;
}