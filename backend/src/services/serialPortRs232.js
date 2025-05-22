import { SerialPort, SerialPortMock } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";
import dotenv from "dotenv";
// import { startDataSimulation } from "./mockDataSender.js";
import { bindPort } from "./mockDataSender.js";

dotenv.config();

const path = process.env.SERIAL_PATH;
const baudRate = parseInt(process.env.BAUDRATE);
const dataBits = parseInt(process.env.DATABITS);
const stopBits = parseInt(process.env.STOPBITS);
const dataFormat = process.env.DATA_FORMAT;

SerialPortMock.binding.createPort(path);

export function processData(data) {
  try {
    const parsedData = JSON.parse(data);
    console.log("接收到JSON格式資料:", parsedData);
    return parsedData;
  } catch (e) {
    // 使用從環境變數載入的正規表達式
    const regex = new RegExp(dataFormat);
    const match = data.match(regex);

    if (match) {
      // match[0] 是完整的匹配字串
      // match[1] 是第一個捕獲群組：身高
      // match[2] 是第二個捕獲群組：體重

      const height = parseFloat(match[1]); // 提取身高並轉換為浮點數
      const weight = parseFloat(match[2]); // 提取體重並轉換為浮點數

      const processedData = {
        height: height,
        weight: weight,
        // 忽略其他欄位
      };

      console.log("解析後的身高體重資料:", processedData);
      return processedData;
    }

    console.log("無法解析資料格式，返回原始資料");
    return { raw: data };
  }
}



export function getAutoWhData(callback) {
  const port = new SerialPortMock({
    path,
    baudRate,
    dataBits,
    stopBits,
    parity: "none",
  });

  const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));

  port.on("open", () => {
    console.log(`模擬串口已開啟 (${path})`);
    bindPort(port); // 綁定給 mockDataSender
  });

  parser.on("data", (data) => {
    const processedData = processData(data);
    if (typeof callback === "function") {
      callback(processedData);
    }
  });

  port.on("error", (err) => {
    console.error("串口錯誤:", err.message);
    if (typeof callback === "function") {
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