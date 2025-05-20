import pcsclite from "pcsclite";

const pcsc = pcsclite();

export const getCardUid = (callback) => {
  pcsc.on("reader", (reader) => {
    console.log(`偵測到讀卡機：${reader.name}`);

    reader.on("status", (status) => {
      const changes = reader.state ^ status.state;
      if (
        changes & reader.SCARD_STATE_PRESENT &&
        status.state & reader.SCARD_STATE_PRESENT
      ) {
        //   console.log('?? 卡片插入');

        reader.connect(
          { share_mode: reader.SCARD_SHARE_SHARED },
          (err, protocol) => {
            if (err) return console.error("連線錯誤：", err);

            // 傳送 APDU 指令以取得卡片 UID
            const getUidCmd = Buffer.from([0xff, 0xca, 0x00, 0x00, 0x00]); // APDU: Get Data (UID)
            reader.transmit(getUidCmd, 40, protocol, (err, response) => {
              if (err) return console.error("讀取 UID 錯誤：", err);

              // 刪除狀態尾碼（SW1 SW2）
              const sw1 = response[response.length - 2];
              const sw2 = response[response.length - 1];

              if (sw1 === 0x90 && sw2 === 0x00) {
                const uid = response.slice(0, -2).toString("hex").toUpperCase();
                console.log("卡號 UID:", uid);
                
                if (typeof callback === "function") {
                  callback(uid);
                }
                // ?? 這裡可以接資料庫查詢
                // findStudentByCard(uid);
              } else {
                console.error(
                  `讀取 UID 失敗，狀態碼: ${sw1.toString(16)} ${sw2.toString(
                    16
                  )}`
                );
              }

              reader.disconnect(reader.SCARD_LEAVE_CARD, () => {});
            });
          }
        );
      }
    });

    reader.on("end", () => {
      console.log("? 讀卡機移除");
    });
  });
};
