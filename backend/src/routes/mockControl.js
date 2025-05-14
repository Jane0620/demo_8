import express from "express";
import { sendNextMockData } from "../services/mockDataSender.js";

const router = express.Router();

router.post("/send-mock-data", (req, res) => {
  sendNextMockData();
  res.json({ message: "已發送一筆模擬資料" });
});

export default router;
