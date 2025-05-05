# 學生體檢資料自動量測與串接API
以南華系統為基準，連接量測設備，自動存取學生體檢資料並上傳南華系統

## 功能簡述
- 名單管理
- > 下載班級學生名單進入資料庫
- 批次量測
- > 點名與輸入量測值
- - 自動量測(還沒)
- - > 點名後點擊開始量測按鈕，自動讀取機器傳出的量測值，存進資料庫並上傳
- - 手動量測
- - > 手動輸入量測值，儲存進資料庫並上傳
- 刷卡量測
- > 插入登記卡片，確認學生資料後，進行量測，量測值進入資料庫並上傳
- 定時上傳(還沒)
- > 固定於台灣時間，上傳未上傳成功之資料
- 系統設定(還沒)
- > 透過選單修改環境變數env檔
- - 量測設定
- - > 切換量測項目、更改學校代碼、更改學校名稱、更改下載網址、增加上傳網址(最多5個網址)

## 工具
- 前端：HTML, CSS, JavaScript
- 後端：Node.js, Express
- 資料庫：SQLite
- 硬體：RassberryPi

## 目錄結構
.
├── backend/
│   ├── db/                 # 資料庫
│   ├── src/
│   │   ├── controllers/    # 控制器
│   │   ├── routes/         # 路由
│   │   ├── services/       # 邏輯
│   │   └── utils/          # 工具函數
│   └── server.js           # 入口文件
├── public/
│   ├── src/
│   │   ├── assets/         # 靜態資源
│   │   ├── components/     # 可復用組件
│   │   ├── js/             # 前端全部的邏輯
│   │   ├── pages/          # 頁面
│   │   └── styles/         # 樣式
│   └── index.html          # 入口 HTML
├──.env                     # 環境變數
└── README.md               # 說明


## 安裝
- 克隆專案
```bash
git clone [repository-url]
```

- 安裝依賴
```bash
npm install
```

- 配置環境變數
- > 複製 .env.example 到 .env 並填寫必要的配置：
```bash
cp .env.example .env
```

- 補充nodemon全域安裝
```bash
npm install -g nodemon
```

## 內容

- 資料庫
- > table
- - > 欄位依據API傳回資料開設，每次下載最新班級資料會清空class、students、wh、sight這4張table
- - class
- - > 班級列表，清空資料庫後由API下載最新名單並輸入進資料庫
```SQL
CREATE TABLE classes (
    class_id TEXT,
    school_id TEXT,
    grade INTEGER,
    no INTEGER,
    name TEXT
    -- , UNIQUE(no, grade)
);
```
- - students
- - > 學生列表，清空資料庫後由API依據年級下載最新名單並輸入進資料庫
```SQL
CREATE TABLE students (
    pid TEXT,                      -- 統一證號
    sid TEXT,                      -- 學號，可空
    class_grade INTEGER,           -- 對應班級年級
    class_no INTEGER,              -- 對應班級編號
    seat INTEGER,                  -- 座號
    name TEXT,                     -- 學生姓名
    sex TEXT,                      -- 性別 "1"=男, "2"=女
    birth TEXT                     -- 出生年月日（字串形式）
    -- , FOREIGN KEY (class_grade, class_no) REFERENCES classes(grade, no)
);
```
- - wh
- - > 身高體重列表，前端輸入後將資料儲存，上傳後更新上傳時間與是否成功
```SQL
CREATE TABLE wh (
    PKNO INTEGER NOT NULL,
    pid TEXT,
    sid TEXT,
    no INTEGER,
    grade INTEGER,
    seat INTEGER,
	sex TEXT,
	name TEXT,
	birth TEXT,
    height REAL,
    weight REAL,
	examDate TEXT,
	id INTERGER,
	bmi REAL,
	bmiCode INTERGER,
    upload_time TEXT,
    successed INTEGER ,
    PRIMARY KEY (PKNO)
);
```
- - sight
- - > 視力列表，前端輸入後將資料儲存，上傳後更新上傳時間與是否成功
```SQL
CREATE TABLE sight (
    PKNO INTEGER NOT NULL,
    pid TEXT,
    sid TEXT,
    no INTEGER,
    grade INTEGER,
    seat INTEGER,
    sex TEXT,
    name TEXT,
    birth TEXT,
    sight0L REAL,
    sight0R REAL,
    sightL REAL,
    sightR REAL,
    examDate TEXT,
    id INTEGER,
    upload_time TEXT,
    successed INTEGER ,
    PRIMARY KEY (PKNO)

);
```
- - upload_log
```SQL
CREATE TABLE upload_log (
    PKNO INTEGER NOT NULL,
    data TEXT,
    upload_time TEXT,
    successed INTEGER
);
```

- 後端
- > server.js
- - 後端伺服器
- 1.設定前端檔案路徑
- 2.提供前端路由
- 3.提供前端環境變數
- 4.啟動伺服器

- > //routes
- - 前端使用的路由，不同功能使用不同支路由
- - > api.js
- - 1.**/shis-login**
- - - 登入路由，取得API使用的Token
- - 2.**/download-classes**
- - 下載路由，清空資料庫後下載最新班級和學生資料再存入資料庫
- - 3.**/classes**
- - - 呼叫班級列表
- - 4.**/students**
- - - 呼叫學生列表
- - 5.**/save-stusent-data**
- - - 儲存量測資料
- - 6.**/upload-student-data**
- - - 上傳量測資料
- - 7.**/save-and-upload**
- - - 儲存並上傳
- - > env.js(還沒)
- - 前端修改env檔的路由

- > //utils
- - 工具函數，主要有啟動資料庫、執行資料庫指令、格式化上傳資料、合併上傳資料
- 1.db.js
- - 連接資料庫
- 2.util.js
- - > runAsync(query, params = [])
- - -執行SQL指令
- 3.dbHandlers.js
- - > processStudentData(student, payload, type)
- - - 封裝資料進資料庫
- - > normalizeStudentData(data, type)
- - - 格式化上傳資料
- - > mergeAndDeduplicateData(pendingData, newData, type)
- - - 合併上傳資料(未使用)

- > //services
- 1.loginShis.js
- - > loginToShis(schoolId)
- - - 登入系統，獲取 Token
- - > getValidToken()
- - - 自動刷新
- 2.downloadShis.js
- - > clearClassesAndStudents()
- - - 清空資料庫
- - > insertClass(cls)
- - - 插入班級資料進資料庫
- - > insertStudent(student)
- - - 插入學生資料進資料庫
- - > fetchClassesFromExternalAPI(token)
- - - 從南華 API 獲取最新的班級資料
- - > getClassesBySchoolId(schoolId)
- - - 從資料庫取得班級列表
- - > getStudentsByClass(classGrade, classNo)
- - - 從資料庫取得學生列表
- 3.insertDB.js
- - > insertHeightWeight(studentId, sid, no, grade, seat, sex, name, birth, height, weight, date)
- - - 輸入身高體重進資料庫
- - > insertVision(studentId, sid, no, grade, seat, sex, name, birth, Sight0L, Sight0R, SightL, SightR, date)
- - - 輸入視力進資料庫
- - > insertUploadLog(combinedData, successed)
- - - 輸入上傳紀錄進資料庫
- 4.uploadToShis.js
- - > updateDatabaseStatus(tableName, students, successed)
- - - 通用更新 upload_time 和 successed 狀態
- - > uploadWhToShis(token, data)
- - - 上傳身高體重資料
- - > uploadSightToShis(token, data)
- - - 上傳視力資料
- - > processAndUploadData(studentData, token, measurementType)
- - - 通用上傳，(未使用)
- - > getPendingWhData()
- - - 查詢沒上傳的身高體重資料
- - > getPendingSightData()
- - - 查詢沒上傳的視力資料

- > //controllers

- 前端
- - index.html
- - // pages
- - > 1_a.html
- - - 班級列表、下載最新列表，點選班級跳轉1_b.html 
- - > 1_b.html
- - - 學生列表，根據1_a.html選擇之班級顯示學生名單
- - > 2_a.html
- - - 班級列表，點選班級跳轉2_b.html
- - > 2_b.html
- - - 學生量測列表，分頁籤自動量測與手動量測
- - - > 自動量測(還沒)
- - - - (1)不能手動輸入數值
- - - - (2)第一欄為點名欄，若點名欄為打勾狀態，量測數值可被存入資料庫並上傳。
- - - - (3)列表最下方為開始量測按鈕，系統會開始接收設備傳輸之數值，顯示於點名欄已打勾的表格，並存入資料庫。
- - - > 手動量測
- - - - (1)第一欄為點名欄，若點名欄為打勾狀態，可以手動輸入量測數值且量測數值可被存入資料庫。
- - - - (2)列表下點擊儲存並上傳按鈕，資料會儲存進資料庫並上傳。
- - > 3.html(還沒)
- - - 刷卡量測頁面，刷卡後搜尋學生資料，確認學生身分後，接收量測設備數值，與學生資料一起存進資料庫。
- - > 4.html(還沒)
- - - 系統設定列表，分頁籤量測設定與連線設定
- - - > 量測設定(目前前端動這頁系統會掛掉，細部內容可能需要根據各家系統API調整)
- - - (1)量測項目切換會出現不同的量測表格
- - - (2)可以修改學校名稱和學校代碼，學校代碼切換會影響下載的班級學生名單
- - - (3)修改下載網址，一定要有對應的API-KEY
- - - (4)增加上傳網址，最多增加5個

- - // components
- - > sidebar.html
- - - 側邊欄，可跳轉不同頁面
- - > search.html
- - - 搜尋欄，搜尋表格內的內容
- - > header.html
- - - 顯示學校名稱
- - > gradeFilter.html(還沒測試，可能刪除)
- - - 根據所選年級區間顯示班級
- - // js
- - > bootstrap.js
- - - 讀取環境變數後才執行其他功能初始化
- - - > loadModuleWhenEnvReady(modulePath)
- - - - 判斷環境變數是否存在，再執行模組初始化
- - - > loadModule(modulePath)
- - - - 載入模組(ES6)
- - > index.js
- - - index.html 使用的 js 檔，呼叫後端登入取得token和schoolId，存入localStorage，馬上跳轉到3.html
- - > page_1-a.js
- - - 1_a.html 使用的js檔，功能包裹於initPage()，會使用localStorage儲存班級資料，讓下一頁顯示該班級學生列表
- - - initPage()中有按鈕事件，會呼叫後端清除資料庫並再次下載班級學生資料進資料庫
- - > page_1-b.js
- - - 1_b.html 使用的js檔，功能包裹於initPage()



## 開發指南
- 代碼規範
- > 使用 ESLint 進行代碼檢查
- > 遵循 JavaScript Standard Style
- > 使用 Prettier 進行代碼格式化

- 提交規範
- > feat: 新功能
- > fix: 修復問題
- > docs: 文檔更新
- > style: 代碼格式調整
- > refactor: 代碼重構
- > test: 測試相關
- > chore: 構建過程或輔助工具的變動

## 授權
- MIT License