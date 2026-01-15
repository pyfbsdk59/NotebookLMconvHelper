// content.js

// ============================================================================
// 【已整合】您的 Google Drive 直連下載連結
const ZIP_DOWNLOAD_URL = "https://drive.google.com/uc?export=download&id=1Jix19WKE3ZhibWlOkkoySKIE-Ot_BJq9"; 
// ============================================================================

// 1. 建立介面元素 (保持不變)
const floatBtn = document.createElement('button');
floatBtn.innerText = "📂 檢查檔案";
floatBtn.id = "nlm-helper-btn";
document.body.appendChild(floatBtn);

const panel = document.createElement('div');
panel.id = "nlm-helper-panel";
panel.innerHTML = `
    <h3 style="margin-top:0;">NotebookLM 檔案檢查</h3>
    <p style="font-size:13px; color:#555;">限制：200MB 以下</p>
    
    <input type="file" id="nlm-file-input" accept="audio/*,video/*,application/pdf,text/*" style="margin-bottom:10px; width:100%;" />
    <div id="nlm-status" style="font-size:13px; margin-bottom:10px; min-height:20px;"></div>
    
    <button id="nlm-launch-py" style="display:none; width:100%; background:#1a73e8; color:white; border:none; padding:8px; border-radius:4px; cursor:pointer; margin-bottom:10px;">
        🚀 啟動 Python 轉檔器
    </button>
    
    <hr style="border:0; border-top:1px solid #eee; margin:10px 0;">

    <div style="text-align:right;">
        <a href="#" id="nlm-toggle-install" style="font-size:12px; color:#1a73e8; text-decoration:none;">🛠️ 尚未安裝轉換器？</a>
    </div>

    <div id="nlm-install-guide" style="display:none; background:#f8f9fa; padding:10px; border-radius:4px; margin-top:5px; border:1px solid #ddd;">
        <p style="color: #d93025; font-size: 12px; margin:0 0 5px 0; font-weight:bold;">⚠️ 需要安裝輔助工具</p>
        <p style="font-size: 11px; margin:0 0 8px 0; color:#666;">
            下載後請 <b>右鍵 -> 以系統管理員身分執行</b> 即可。<br>
            (若已有舊版，安裝將會自動覆蓋更新)
        </p>
        
        <button id="nlm-download-setup" style="width:100%; background:#34a853; color:white; border:none; padding:8px 5px; border-radius:4px; cursor:pointer; font-size:12px; font-weight:bold;">
            📥 下載安裝NotebookLM輸入格式適合轉換器
        </button>
    </div>
`;
document.body.appendChild(panel);

// 2. 介面互動邏輯 (保持不變)
floatBtn.addEventListener('click', () => {
    panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
});

const fileInput = panel.querySelector('#nlm-file-input');
const statusDiv = panel.querySelector('#nlm-status');
const launchBtn = panel.querySelector('#nlm-launch-py');
const installGuide = panel.querySelector('#nlm-install-guide');
const downloadSetupBtn = panel.querySelector('#nlm-download-setup');
const toggleInstallBtn = panel.querySelector('#nlm-toggle-install');

toggleInstallBtn.addEventListener('click', (e) => {
    e.preventDefault();
    installGuide.style.display = installGuide.style.display === 'block' ? 'none' : 'block';
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const sizeMB = file.size / (1024 * 1024);
    statusDiv.innerText = `檔案大小: ${sizeMB.toFixed(2)} MB`;

    if (sizeMB > 200) {
        statusDiv.style.color = "#d93025";
        statusDiv.innerText += "\n⚠️ 超過 200MB！需轉檔。";
        launchBtn.style.display = "block";
    } else {
        statusDiv.style.color = "green";
        statusDiv.innerText += "\n✅ 大小符合規定。";
        launchBtn.style.display = "none";
    }
});

// 3. 啟動按鈕
launchBtn.addEventListener('click', () => {
    try {
        chrome.runtime.sendMessage({ action: "launch_converter" }, (response) => {
            if (chrome.runtime.lastError || (response && response.status === "not_installed")) {
                statusDiv.innerText += "\n❌ 啟動失敗：未偵測到工具。";
                statusDiv.style.color = "#d93025";
                installGuide.style.display = "block";
            } else {
                statusDiv.innerText += "\n✅ 已發送啟動指令...";
                statusDiv.style.color = "green";
                installGuide.style.display = "none";
            }
        });
    } catch (e) {
        installGuide.style.display = "block";
    }
});

// 4. 動態生成並下載 BAT 腳本 (修正崩潰問題版)
downloadSetupBtn.addEventListener('click', () => {
    const extId = chrome.runtime.id; 

    const batContent = `@echo off
chcp 65001 >nul
title NotebookLM Converter Installer
echo ========================================================
echo   NotebookLM 輸入格式適合轉換器 - 自動安裝程式
echo ========================================================
echo.

:: 1. 檢查管理員權限
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [OK] 已取得系統管理員權限...
) else (
    echo [ERROR] 權限不足！
    echo 請對此檔案按右鍵，選擇「以系統管理員身分執行」。
    echo.
    pause
    exit
)

:: 2. 建立目標資料夾
set "TARGET_DIR=C:\\extensionConv"
if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"
echo [OK] 資料夾準備完成。

:: 3. 下載 ZIP 檔案
echo [INFO] 正在下載工具包，請稍候...
:: 【修正點】這裡加上了雙引號，避免網址中的 & 符號導致腳本崩潰
echo 來源: "${ZIP_DOWNLOAD_URL}"

powershell -Command "Invoke-WebRequest -Uri '${ZIP_DOWNLOAD_URL}' -OutFile '%TARGET_DIR%\\extensionConv.zip'"

if not exist "%TARGET_DIR%\\extensionConv.zip" (
    echo.
    echo [ERROR] 下載失敗！檔案未建立。
    echo 請檢查網路連線，或手動下載檔案。
    pause
    exit
)

:: 4. 解壓縮 (Force代表強制覆蓋)
echo [INFO] 正在解壓縮與覆蓋舊檔...
powershell -Command "Expand-Archive -Path '%TARGET_DIR%\\extensionConv.zip' -DestinationPath '%TARGET_DIR%' -Force"

:: 5. 注入 Chrome Extension ID
(
echo {
echo   "name": "com.yourname.nlmconverter",
echo   "description": "NotebookLM Converter Launcher",
echo   "path": "launcher.bat",
echo   "type": "stdio",
echo   "allowed_origins": [
echo     "chrome-extension://${extId}/"
echo   ]
echo }
) > "%TARGET_DIR%\\host_manifest.json"
echo [OK] 設定檔 ID 已修正為: ${extId}

:: 6. 寫入 Registry
reg add "HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts\\com.yourname.nlmconverter" /ve /t REG_SZ /d "%TARGET_DIR%\\host_manifest.json" /f >nul
echo [OK] 系統註冊完成。

:: 7. 清理
del "%TARGET_DIR%\\extensionConv.zip"

echo.
echo ========================================================
echo      安裝成功！您現在可以回到網頁使用轉檔按鈕了。
echo ========================================================
pause
`;

    // 觸發下載
    const blob = new Blob([batContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "Install_NotebookLM_Converter.bat"; 
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});