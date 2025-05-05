import { getEnv, insertTable, showLoading } from "./util.js";

const API_BASE_URL = getEnv('API_BASE_URL');
const SCHOOL_ID = getEnv('SCHOOL_ID');
    document.addEventListener("DOMContentLoaded", function () {
      const measurementType = MEASUREMENT_TYPE;

      if (measurementType === "height-weight") {
        console.log("開始偵測身高體重...");
      } else if (measurementType === "vision") {
        console.log("開始偵測視力...");
      }
    });