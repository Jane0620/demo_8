import { SerialPort, SerialPortMock } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";
import dotenv from "dotenv";
import { startDataSimulation } from "./mockDataSender.js";

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
    const regex = new RegExp(dataFormat);
    const match = data.match(regex);

    if (match) {
      const gender = match[1];
      const weight = parseFloat(match[2]);
      const height = parseFloat(match[3]);
      const bmi = parseFloat(match[5]);

      const processedData = {
        gender: getGenderText(gender),
        genderCode: gender,
        weight,
        height,
        bmi,
      };

      console.log("解析後資料:", processedData);
      return processedData;
    }

    console.log("無法解析資料格式，返回原始資料");
    return { raw: data };
  }
}

function getGenderText(code) {
  switch (code) {
    case "M": return "男性";
    case "F": return "女性";
    case "C": return "兒童";
    case "T": return "未知";
    default:  return "未知";
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
    console.log("等待模擬資料...");
    startDataSimulation(port);
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
