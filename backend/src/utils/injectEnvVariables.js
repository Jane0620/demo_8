// 注入環境變數到 HTML 的函數
export function injectEnvVariables(html) {
  // 確保有環境變數值，否則使用預設值
  const API_KEY = process.env.API_KEY;
  const shisBaseUrl = process.env.SHIS_BASE_URL;
  const measurementType = process.env.TYPE;
  const apiBaseUrl = process.env.API_BASE_URL;
  const schoolId = process.env.SCHOOL_ID;
  const schoolName = process.env.SCHOOL_NAME;
  const serialPath = process.env.SERIAL_PATH;
  const baudRate = process.env.BAUDRATE;  
  const dataBits = process.env.DATABITS;
  const stopBits = process.env.STOPBITS;

  // 正則表達式替換環境變數
  return html.replace(
    /<script>\s*\/\*\s*ENV_PLACEHOLDER\s*\*\/\s*<\/script>/s,
    `<script>
        window.env = {
          API_KEY: "${API_KEY}",
          SHIS_BASE_URL: "${shisBaseUrl}",
          API_BASE_URL: "${apiBaseUrl}",
          SCHOOL_NAME: "${schoolName}",
          MEASUREMENT_TYPE: "${measurementType}",
          SCHOOL_ID: "${schoolId}",
          SERIAL_PATH: "${serialPath}",
          BAUDRATE: "${baudRate}",
          DATABITS: "${dataBits}",
          STOPBITS: "${stopBits}"
        };
        // console.log("Server injected window.env:", window.env);
      </script>`
  );
}
