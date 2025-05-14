// mock
import { SerialPort, SerialPortMock } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";
// import { MockBinding } from '@serialport/binding-mock';
import dotenv from "dotenv";
dotenv.config();

// 從環境變數取得設定
const path = process.env.SERIAL_PATH;
const baudRate = parseInt(process.env.BAUDRATE);
const dataBits = parseInt(process.env.DATABITS);
const stopBits = parseInt(process.env.STOPBITS);
const dataFormat = process.env.DATA_FORMAT;

// 建立模擬串口
SerialPortMock.binding.createPort(path);
console.log("模擬串口已建立:", SerialPortMock.binding.createPort(path));

// 處理資料的函數 - 處理來自設備的資料
export function processData(data) {
  try {
    // 嘗試解析JSON格式資料
    const parsedData = JSON.parse(data);
    console.log("接收到JSON格式資料:", parsedData);
    return parsedData;
  } catch (e) {
    console.log("接收到原始資料:", data);

    // 使用正規表達式匹配資料格式
    const regex = new RegExp(dataFormat);
    const match = data.match(regex);

    if (match) {
      // 提取正規表達式捕獲組中的資料
      const gender = match[1]; // 性別
      const weight = parseFloat(match[2]); // 體重
      const height = parseFloat(match[3]); // 身高
      const bmi = parseFloat(match[5]); // BMI

      const processedData = {
        gender: getGenderText(gender),
        genderCode: gender,
        weight: weight,
        height: height,
        bmi: bmi,
      };

      console.log("解析後資料:", processedData);
      return processedData;
    }

    // 如果正規表達式無法匹配，返回原始資料
    console.log("無法解析資料格式，返回原始資料");
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
    case "T":
      return "未知";
    default:
      return "未知";
  }
}

export function getAutoWhData(callback) {
  // 建立串口連線
  const port = new SerialPortMock({
    path: path,
    baudRate: baudRate,
    dataBits: dataBits,
    stopBits: stopBits,
    parity: "none",
  });

  // 創建解析器
  const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));

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
    if (callback && typeof callback === "function") {
      callback(processedData);
    }
  });

  // 錯誤處理
  port.on("error", (err) => {
    console.error("串口錯誤:", err.message);
    if (callback && typeof callback === "function") {
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
    },
  };
}

// 模擬設備定期發送資料
function startDataSimulation(port) {
  console.log("開始模擬設備發送資料...");

  const sampleData = [
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

  // 使用 getRandomDelay(5000, 8000) 替代 Radom(5000, 8000)
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
