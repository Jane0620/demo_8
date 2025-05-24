# 學生體檢資料自動量測與串接API
以○○系統為基準，連接量測設備，自動存取學生體檢資料並上傳○○系統

## 功能簡述
- 名單管理
  > 下載班級學生名單進入資料庫
- 批次量測
  > 點名與輸入量測值，分自動量測與手動輸入
  - 自動量測
    > 點名後點擊開始量測按鈕，自動讀取機器傳出的量測值，存進資料庫並上傳
  - 手動量測
    > 手動輸入量測值，儲存進資料庫並上傳
- 刷卡量測
  > 感應登記卡片，確認學生資料後，進行量測，量測值進入資料庫並上傳
- 定時上傳(還沒)
  > 固定於台灣時間，上傳未上傳成功之資料
- 系統設定(還沒)
  > 透過選單修改環境變數env檔
  - 基本設定
    > 切換量測項目、更改學校代碼、更改學校名稱
  - 系統連接
    > 設定學生資料從`哪一個系統下載`與量測資料要`上傳哪些系統`。表單分為預設系統與增設系統區塊，預設系統為○○系統，不能刪除；增設系統區塊有增加、刪除鍵，可自行決定要串接的系統。兩種區塊都有下載功能與上傳功能按鈕，下載功能：學生資料只能從一個系統下載，當區塊內的下載功能按鈕為`啟用`，其他區塊的下載功能會關閉，資料會從此系統下載；上傳功能：上傳功能的按鈕不會限制選取，當按鈕為啟用時，量測資料會上傳該系統。
  - 硬體連接
    > 設定串接的量測設備，與設備的規格有關，目前針對身高體重機RS-232序列埠設計。
  - 上傳時間
    > 設定定時上傳的時間

## 工具
- 前端：HTML, CSS, JavaScript
- 後端：Node.js, Express
- 資料庫：SQLite
- 硬體：RassberryPi

## 目錄結構
```bash
.
├── backend/
│   ├── db/                 # 資料庫
│   ├── src/
│   │   ├── controllers/    # 控制器(沒分好)
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
```

## 環境
- windows
- Linux(RassberryPi)

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
  - table
     > 欄位依據API傳回資料開設，每次下載最新班級資料會清空class、students、wh、sight這4張table
  - class
     > 班級列表，清空資料庫後由API下載最新名單並輸入進資料庫
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
  - students 
    > 學生列表，清空資料庫後由API依據年級下載最新名單並輸入進資料庫
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
  - wh
    > 身高體重列表，前端輸入後將資料儲存，上傳後更新上傳時間與是否成功
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
  - sight
    > 視力列表，前端輸入後將資料儲存，上傳後更新上傳時間與是否成功
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
  - upload_log
    ```SQL
    CREATE TABLE upload_log (
        PKNO INTEGER NOT NULL,
        data TEXT,
        upload_time TEXT,
        successed INTEGER
    );
    ```

- 後端
- server.js☠️
  - 後端伺服器  
    1. 設定前端檔案路徑  
    2. 提供前端路由  
    3. 提供前端環境變數  
    4. 啟動伺服器

  - //routes☠️
    > 前端使用的路由，不同功能使用不同支路由
    - api.js
    1. **/shis-login** (未使用)
        > 登入路由，取得API使用的Token
    2. **/download-classes**
        > 下載路由，清空資料庫後下載最新班級和學生資料再存入資料庫
    3. **/classes**
        > 呼叫班級列表
    4. **/students**
        > 呼叫學生列表
    5. **/save-stusent-data**
        > 儲存量測資料
    6. **/upload-student-data**
        > 上傳量測資料
    7. **/save-and-upload**
        > 儲存並上傳

    - env.js(nodemon啟動下適用)☠️
        > 前端修改env檔的路由
    
    - ws.js
        > websocket伺服器，讓後端向前端發送硬體資訊  
        文件：https://www.npmjs.com/package/websocket-express

  - //utils
    > 工具函數，主要有啟動資料庫、執行資料庫指令、格式化上傳資料、合併上傳資料
    1. db.js
        > 連接資料庫
    2. util.js
    - runAsync(query, params = [])
        > 執行SQL指令
    3. dbHandlers.js
    - processStudentData(student, payload, type)
        > 封裝資料進資料庫
    - normalizeStudentData(data, type)
        > 格式化上傳資料
    - mergeAndDeduplicateData(pendingData, newData, type)
        > 合併上傳資料(未使用)
    4. injectEnvVariables.js
    - injectEnvVariables(html)
        > 注入環境變數到 HTML 的函數
    5. getCardUid.js
        > 使用pcsclite套件製作使用讀卡機讀取卡片取得卡號(UID)

  - //services
    1. loginShis.js
    - loginToShis(schoolId)
        > 登入系統，獲取 Token
    - getValidToken()
        > 檢查○○系統登入Token是否存在，再自動刷新

    2. downloadShis.js
    - clearClassesAndStudents()
        > 清空資料庫
    - insertClass(cls)
        > 插入班級資料進資料庫
    - insertStudent(student)
        > 插入學生資料進資料庫
    - fetchClassesFromExternalAPI(token)
        > 從○○系統 API 獲取最新的班級資料
    - getClassesBySchoolId(schoolId)
        > 從資料庫取得班級列表
    - getStudentsByClass(classGrade, classNo)
        > 從資料庫取得學生列表

    3. insertDB.js
    - insertHeightWeight(studentId, sid, no, grade, seat, sex, name, birth, height, weight, date)
        > 輸入身高體重進資料庫
    - insertVision(studentId, sid, no, grade, seat, sex, name, birth, Sight0L, Sight0R, SightL, SightR, date)
        > 輸入視力進資料庫
    - insertUploadLog(combinedData, successed)
        > 輸入上傳紀錄進資料庫
    - getStudentByPid(pid)
        > 使用pid尋找學生

    4. uploadToShis.js
    - updateDatabaseStatus(tableName, students, successed)
        > 通用更新資料庫的 successed 狀態
    - handleUploadError(measurementType, pendingData, errorMessage)
        > 上傳錯誤紀錄```updateDatabaseStatus(measurementType, pendingData, 0);insertUploadLog(pendingData, 0);```  
    - getPendingWhData()
        > 查詢未成功上傳的身高體重資料
    - getPendingSightData()
        > 查詢未成功上傳的視力資料
    - uploadWhToShis(token, data)
        > 上傳身高體重資料到○○系統。  
            1.  查詢資料庫中待上傳的 WH 資料```getPendingWhData()```   
            2.  格式化上傳資料```normalizeStudentData(pendingData, "height-weight");```  
            3.  上傳到○○系統  
            4.  更新資料庫的 successed 狀態```updateDatabaseStatus("wh", pendingData, 1);   insertUploadLog(pendingData, 1);```  
            5.  error, ```handleUploadError("wh", err.message);```  
    - uploadSightToShis(token, data)
        > 上傳視力資料到○○系統。
    - processAndUploadData(studentData, token, measurementType)
        > 通用上傳，(未使用)

    5. serialPortRs232.js
        > 使用serialport套件製作硬體序列埠串接  
        文件：https://serialport.io/docs/api-serialport/
    - processData(data)
        > 處理資料的函數，依據正規表達式接收資料，再提取需要的身高體重資料
    - getAutoWhData(callback)
        > 啟動串口的函數，啟動後使用```processData(data)```處理接收到的資料

    6. cardMeasure.js
    - findStudentByCardUid(cardUid)
        > 根據卡號尋找學生
  - //controllers☠️

- 前端
- index.html
    > 入口頁面，為了○○系統存在的登入畫面
  - // pages  
    - 1_a.html
        > 班級列表、下載最新列表，點選班級跳轉1_b.html 
    - 1_b.html
        > 學生列表，根據1_a.html選擇之班級顯示學生名單
    - 2_a.html
        > 班級列表，點選班級跳轉2_b.html
    - 2_b.html
        > 學生量測列表，分頁籤自動量測與手動輸入  
        - 自動量測  
            > 1. 不能手動輸入數值  
            > 2. 第一欄為點名欄，若點名欄為打勾狀態，量測數值可被存入資料庫並上傳。   
            > 3. 列表最下方為開始量測按鈕，當點名完成後點擊，系統啟動硬體連線，並出現廣播框，當設備傳來數值會更新當前廣播學生之量測資料。  
            > 4. 量測完成於60秒後自動上傳  
            > 5. 若需更新學生資料或跳過學生，可點選廣播框上按鈕更換廣播學生。
        - 手動量測
            > 1. 第一欄為點名欄，若點名欄為打勾狀態，可以手動輸入量測數值且量測數值可被存入資料庫。  
            > 2. 列表下點擊儲存並上傳按鈕，資料會儲存進資料庫並上傳。
    - 3.html
        > 刷卡量測頁面，刷卡後搜尋學生資料，確認學生身分後，接收量測設備數值，與學生資料綁定後一起存進資料庫。
    - 4.html
        > 系統設定列表，分頁籤基本設定、系統連接、硬體連接與上傳時間
        - 基本設定
            > 1. 量測項目切換會出現不同的量測表格
            > 2. 可以修改學校名稱和學校代碼，學校代碼切換會影響下載的班級學生名單
        - 系統連接☠️☠️
            > 1. 預設系統區塊：預設為○○系統，使用API-KEY和URL
            > 2. 增設系統區塊：使用Token和URL，最多可增加5個
            > 3. 下載功能按鈕：所有系統只能選一個下載(Radio)
            > 4. 上傳功能按鈕：可以選取多個系統上傳(Checkbox)
        - 硬體連接
            > 根據實際的硬體設備規格修改此頁籤設定
            > 1. 資料格式：設備發送的資料格式，系統會依據資料格式的正規表達式匹配接收的資料  
            > 2. 連接埠：依作業系統而有不同的連接埠  
            >   - Linux(RassberryPi) ```ls /dev/tty*```或```lsusb```
            >   - Windows  
            ```bash  
                Get-PnpDevice -Class Ports
                Get-PnpDevice -Class USB
                Get-PnpDevice -Class Ports | Format-List FriendlyName, InstanceId
                [System.IO.Ports.SerialPort]::GetPortNames()
            ```
            > - 按 `Win + X`，選擇「裝置管理員」，展開「連接埠 (COM 和 LPT)」
            > 3. Baud Rate
            > 4. Data Bits
            > 5. Stop Bits
        - 上傳時間☠️
  - // components
    - sidebar.html
        > 側邊欄，可跳轉不同頁面
    - search.html
        > 搜尋欄，搜尋表格內的內容
    - header.html
        > 顯示學校名稱和量測類型
    - gradeFilter.html(未使用)
        > 根據所選年級區間顯示班級
  - // js
    - bootstrap.js
        > 讀取環境變數後才執行其他功能初始化
        - loadModuleWhenEnvReady(modulePath)
            > 判斷環境變數是否存在，再執行模組初始化
        - loadModule(modulePath)
            > 載入模組(ES6)
    - gradeFilter.js☠️
    - header.js
        > 插入header.html
        - initHeader()
            > 取得學校名稱和量測類型，判斷DOM後才執行
    - search.js
        > 插入搜尋欄與搜尋欄的邏輯
        - initSearch() 
            > 先載入搜尋框 HTML， 再抓 input 綁事件
    - sideBar.js
        - highlightCurrentSidebarItem()
            > 側邊欄標記，顯示當前頁面
    - toast.js📖
        > 吐司訊息模組，陸續取代目前開發中使用的alert
    - util.js
        > 通用函數
        - getEnv(key)
            > 取得環境變數  
            > 使用：```index.js```
        - domReady()
            > 等待DOM  
            > 使用：```page_1-a.js```, ```page_1-b.js```, ```page_2-a.js```, ```page_2-b.js```, ```page_3.js```, ```page_4.js```, ```search.js```
        - getAuthData()
            > 檢查○○系統登入條件  
            > 使用：```page_1-a.js```, ```page_2-a.js```, ```page_2-b.js```, ```page_3.js```
        - insertTable(container, tableHTML, emptyMessage = "目前沒有資料。", clearLoading = true)
            > 插入表格到指定容器  
            > 使用：```page_1-a.js```, ```page_1-b.js```, ```page_2-a.js```, ```page_2-b.js```
        - createTableHTML(data, { headers, rowRenderer })
            > 創建表格HTML，主要用在班級列表  
            > 使用：```page_1-a.js```, ```page2-a.js```
        - showLoading(container)
            > 顯示加載狀態  
            > 使用：```page_1-a.js```, ```page_2-a.js```, ```fetchAndDisplayData(container, url, successCallback, errorMessage = "數據載入失敗")```
        - setupTabSwitching({ containerSelector,  tabButtonSelector, tabContentSelector, onTabSwitch,   activeClass = "active", }) 
            > 通用頁籤切換功能  
            > 使用：```page_2-b.js```, ```page_4.js```
            > 1. containerSelector - 頁籤容器的選擇器  
            > 2. tabButtonSelector - 頁籤按鈕的選擇器  
            > 3. tabContentSelector - 頁籤內容的選擇器  
            > 4. onTabSwitch - 頁籤切換時的回調函式  
            > 5. activeClass="active" - 激活狀態的類名  
        - showError(container, message)  
            > 顯示錯誤信息  
            > 使用：無
        - fetchAndDisplayData(container, url, successCallback, errorMessage = "數據載入失敗")
            > 從API(後端)獲取數據並顯示    
            > 使用：```page_1-a.js```, ```page_1-b.js```, ```page_2-a.js```, ```page_2-b.js```
        - renderStudentTable(container, students) 
            > 渲染學生名單表格   
            > 使用：```page_1-b.js```
        - handleFetchError(error, container, defaultMessage = "發生錯誤，請稍後再試")
            > 處理 Fetch 請求的錯誤  
            > 使用：```page_1-a.js```, ```page_2-a.js```, ```page_2-b.js```
        - formatToISO8601UTC(dateStr)☠️
            > 格式化日期為 'YYYY-MM-DD HH:mm:ss+08:00' 格式
            > 使用：```page_3.js```
        - collectStudentData()
            > 收集學生數據，把資料串成○○系統要求的格式  
            > 使用：```page_2-b.js```
    - measureTable.js
        > 渲染量測表格的函數  
        - renderManualTable(container, students, options = {})
            > 渲染手動輸入頁籤的量測表格
        - renderAutoTable(container, students, options = {})
            > 渲染自動量測頁籤的量測表格
        - selectedStudentsForDetection
            > 點名用的陣列     
    - index.js(○○系統需要登入)
        > index.html 使用的 js 檔，呼叫後端登入取得token和schoolId，存入localStorage，馬上跳轉到3.html
    - page_1-a.js
        > 1_a.html 使用的js檔，initPage()初始化頁面   
        - initPage() 
            > 1. domReady()  
            > 2. fetchAndDisplayData 獲取並顯示班級資料  
            > 3. 按鈕事件：下載最新班級資料
            > 4. 跳轉學生列表頁面：使用localStorage儲存班級資料，讓下一頁顯示該班級學生列表
    - page_1-b.js
        > 1_b.html 使用的js檔，initPage()初始化頁面
        - initPage()
            > 1. domReady()  
            > 2. fetchAndDisplayData => renderStudentTable
    - page_2-a.js
        > 2_a.html 使用的js檔，initPage()初始化頁面
        - initPage()
            > 1. domReady()
            > 2. fetchAndDisplayData，表格header名稱  
            > 3. 跳轉學生列表頁面：使用localStorage儲存班級資料，讓下一頁顯示該班級學生列表  
    - page_2-b.js
        > 2_b.html 使用的js檔，預設為自動量測模式，initPage()初始化頁面
        - initPage()
            > 1. domReady()
            > 2. fetchAndDisplayData => renderAutoTable, insertStartDectionButton(); => setupTabSwitching 決定自動量測動作```measureAuto()```或手動輸入動作```measureManual()```
        - measureAuto()
            > 1. 設定自動量測模式  
            > 2. 清空  
            > 3. renderAutoTable(pageState.container, students);  
            > 4. ```insertStartDectionButton();```
        - measureManual()
            > 1. 設定手動輸入模式  
            > 2. 清空  
            > 3. renderManualTable(pageState.container, students);  
            > 4. ```insertSaveUploadButton();``` 
        - insertSaveUploadButton()
            > 插入儲存並上傳動作按鈕  
            > ```handleSaveUpload```
        - insertStartDectionButton()
            > 插入開始偵測動作按鈕  
            > ```handleStartDetection```
        - currentBroadcastIndex
            > 廣播索引
        - broadcastStudents
            > 廣播學生陣列  
        - countdownIntervalId
            > 上傳倒數計時           
        - handleStartDetection()
            > 1. 辨認點名selectedStudentsForDetection
            > 2. 使用已點名的學生資料建立廣播列表  
            > 3. 添加一個虛擬學生  
            > 4. 插廣播框開始廣播 ```updateBroadcastName();```更新廣播名，```setupBroadcastNavigation();```廣播按鈕，```setupBroadcastOverlay();```廣播遮罩  
            > 5. ```initializeWebSocket();```啟動websocket連線  
            > 6. 清空開始偵測按鈕
        - startAutoBroadcast()
            > 廣播推進
        - updateBroadcastName() 
            > 1. 插入名字
            > 2. 插入倒數計時```startUploadCountdown(60);```的條件判斷，判斷廣播到虛擬學生(代表量測完成)時倒數計時開始，並出現上傳按鈕```checkAndDisplayUploadButton();```。   
        - setupBroadcastNavigation()
            > 廣播按鈕事件，分```prevButton```和```nextButton```，可以自行決定調整廣播姓名
        - setupBroadcastOverlay()
            > 內建函數建立遮罩 
        - removeBroadcastOverlay()
            > 移除遮罩
        - initializeWebSocket()
            > 1. 與後端建立WebSocket連線，連線失敗每3秒嘗試重新連接    
            > 2. 處理接收到的資料並更新表格```updateMeasurementTable(studentPid, receivedData);```，收到的資料給當前正在廣播的學生，並推進廣播  
        - updateMeasurementTable(studentPid, measurementData)
            > 找到表格中對應學生的列並填入數值
        - startUploadCountdown(durationInSeconds)
            > 負責啟動並執行倒數計時，計時結束後將學生資料儲存並上傳```handleSaveUpload()```。
        - checkAndDisplayUploadButton()☠
            > 上傳按鈕的顯示/隱藏，檢查資料填寫判斷是否出現```areAllStudentsDataFilled()```
        - handleSaveUpload()
            > 1. 使用```collectStudentData();```收集要上傳的資料  
            > 2. fetch後端路由```/save-and-upload```
            > 3. 移除遮罩```removeBroadcastOverlay();```
    - page_3.js 
        > 3.html 使用的js檔，initPage()初始化頁面
        - initPage()
            > 1. domReady()  
            > 2. ```initializeWebSocket()```啟動WebSocket連線，讀取卡片與等待量測數據，綁定後儲存並上傳  
            > 3. ```resetDisplay()```回復初始狀態
        - currentScannedStudent
            > 當前刷卡的學生資料
        - currentMeasurementData
            > 接收到的數據 
        - measurementTimeoutId
            > 量測數據接收時間     
        - resetDisplay()
            > 清空接收時間、學生資料和量測數據並回復初始圖示
        - resetDisplayAfterDelay(delay)
            > 幾秒後resetDisplay()
        - initializeWebSocket()
            > 1. 啟動連線  
            > 2. 非同步onmessage事件：根據接收到的資料類型進行處理，收到學生資料```handleStudentInfo(receivedData);```；收到量測資料```await handleMeasurementData(receivedData);```；處理錯誤訊息```handleError(receivedData.message);```  
            > 3. 資料錯誤處理☠☠  
            > 4. 斷線後每3秒嘗試重新連接
        - handleStudentInfo(receivedData)
            > 1. 接收讀卡機學生資料  
            > 2. ```updateStudentInfoDisplay(currentScannedStudent, receivedData.message);```顯示學生姓名，並確保currentMeasurementData為空  
            > 3. 15 秒量測時間計時，15 秒內未收到身高體重數據則重置顯示resetDisplayAfterDelay  
            > 4. 錯誤處理，未找到匹配的學生資訊，3秒後回復刷卡量測☠☠
        - handleError(errorMessage)
            > 顯示錯誤訊息後，重置顯示resetDisplayAfterDelay(3000);
        - handleMeasurementData(receivedData) 
            > 接收身高和體重的數據，綁定資料儲存並上傳```handleSaveUpload();```
        - handleSaveUpload()
            > 綁定與處理資料格式， fetch後端路由save-and-upload儲存並上傳，成功後重置頁面
    - page_4.js☠
        > 4.html 使用的js檔，initPage()初始化頁面，全部的功能都包覆於initPage()☠☠  
        - initPage()
            > 1. domReady()  
            > 2. 設定頁籤
            > 3. onTabSwitch設定頁籤內事件
            > 4. 按鈕儲存事件，根據當前頁籤表單內容儲存變數資料，fetch後端路由/env，更新變數後重啟系統。  




## 開發指南
- 代碼規範
    - 遵循 JavaScript Standard Style
    - 使用 Prettier 進行代碼格式化

- 提交規範📖
    - feat: 新功能
    - fix: 修復問題
    - docs: 文檔更新
    - style: 代碼格式調整
    - refactor: 代碼重構
    - test: 測試相關
    - chore: 構建過程或輔助工具的變動

## 授權
<!-- - MIT License -->
