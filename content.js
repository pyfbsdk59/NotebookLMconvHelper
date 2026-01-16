// content.js

// ============================================================================
// 【MediaFire 下載連結】
const ZIP_DOWNLOAD_URL = "https://www.mediafire.com/file/ztnqcm5d3e5ha7e/extensionConv.zip/file"; 
// ============================================================================

// 1. 建立介面元素
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
        🚀 啟動轉檔器
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

// 2. 介面互動邏輯
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

// ----------------------------------------------------------------------
// Base64 編碼函式
function convertToPsBase64(str) {
    let utf16le = new Uint8Array(str.length * 2);
    for (let i = 0; i < str.length; i++) {
        let code = str.charCodeAt(i);
        utf16le[i * 2] = code & 0xff;
        utf16le[i * 2 + 1] = (code >> 8) & 0xff;
    }
    let binStr = "";
    for (let i = 0; i < utf16le.length; i++) {
        binStr += String.fromCharCode(utf16le[i]);
    }
    return btoa(binStr);
}

// 4. 下載功能：MediaFire + Session + 自動產生 Launcher.bat
downloadSetupBtn.addEventListener('click', () => {
    const extId = chrome.runtime.id; 
    
    // PowerShell 腳本
    const psScript = `
$ErrorActionPreference = 'Stop'
Write-Host "Starting NotebookLM Converter Installer..." -ForegroundColor Cyan

# 1. 參數設定
$url = "${ZIP_DOWNLOAD_URL}"
$folder = "C:\\extensionConv"
$zipPath = "$folder\\extensionConv.zip"
$manifestPath = "$folder\\host_manifest.json"
$launcherPath = "$folder\\launcher.bat"

# 2. 建立資料夾
if (!(Test-Path $folder)) { 
    New-Item -ItemType Directory -Path $folder -Force | Out-Null
    Write-Host "[OK] Directory created." 
}

# 3. 安全性協定
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# -----------------------------------------------------------
# 失敗救援函式
# -----------------------------------------------------------
function Trigger-ManualFallback {
    param($reason)
    Write-Host ""
    Write-Host "========================================================" -ForegroundColor Yellow
    Write-Host " AUTOMATIC DOWNLOAD FAILED ($reason)" -ForegroundColor Yellow
    Write-Host "========================================================" -ForegroundColor Yellow
    Write-Host "Opening browser for manual download..." -ForegroundColor Cyan
    Start-Sleep -Seconds 2
    Start-Process "${ZIP_DOWNLOAD_URL}"
    Write-Host "Please save ZIP to C:\\extensionConv\\extensionConv.zip and press Enter."
    Read-Host
    try { Expand-Archive -Path $zipPath -DestinationPath $folder -Force; Write-Host "[OK] Unzip success!" -ForegroundColor Green } catch { exit 1 }
}

# 4. 下載邏輯
Write-Host "[INFO] Connecting to MediaFire..."
try {
    # 建立 Session
    $req = Invoke-WebRequest -Uri $url -SessionVariable mfSession -UserAgent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36"
    $htmlContent = $req.Content

    Write-Host "[INFO] Parsing download link..."
    $realUrl = $null
    if ($htmlContent -match 'id="downloadButton".*?href="([^"]+)"') { $realUrl = $matches[1] }
    elseif ($htmlContent -match 'aria-label="Download file".*?href="([^"]+)"') { $realUrl = $matches[1] }
    elseif ($htmlContent -match 'href="(https://download[^"]+)"') { $realUrl = $matches[1] }

    if ([string]::IsNullOrEmpty($realUrl)) {
        Trigger-ManualFallback "Could not find direct download link on page."
    } else {
        Write-Host "[INFO] Link Found! Downloading..."
        Invoke-WebRequest -Uri $realUrl -WebSession $mfSession -UserAgent "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" -OutFile $zipPath

        $fileSize = (Get-Item $zipPath).Length
        if ($fileSize -lt 10000) {
            Trigger-ManualFallback "File too small ($fileSize bytes)."
        } else {
            Write-Host "[OK] Download success." -ForegroundColor Green
        }
    }
} catch {
    Trigger-ManualFallback "Error: $_"
}

# 5. 解壓縮 & 智慧路徑整平
Write-Host "[INFO] Unzipping..."
try {
    # 清理舊檔
    Get-ChildItem -Path $folder -Exclude "extensionConv.zip" | Remove-Item -Recurse -Force

    Expand-Archive -Path $zipPath -DestinationPath $folder -Force
    
    # 智慧整平
    $items = Get-ChildItem -Path $folder -Exclude "extensionConv.zip"
    $dirCount = ($items | Where-Object { $_.PSIsContainer }).Count
    $fileCount = ($items | Where-Object { -not $_.PSIsContainer }).Count

    if ($dirCount -eq 1 -and $fileCount -eq 0) {
        $nestedDir = $items[0].FullName
        Write-Host "[INFO] Flattening directory structure..."
        Get-ChildItem -Path $nestedDir | Move-Item -Destination $folder -Force
        Remove-Item $nestedDir -Force
        Write-Host "[OK] Structure flattened." -ForegroundColor Green
    }
    Write-Host "[OK] Unzip success." -ForegroundColor Green
} catch {
    Trigger-ManualFallback "File is not a valid ZIP."
}

# 6. 【關鍵修正】建立 launcher.bat
# 這一步確保即使 ZIP 裡面沒有 bat 檔，我們也會自動產生一個
Write-Host "[INFO] Creating Launcher..."
$batContent = '@echo off' + [Environment]::NewLine + '"%~dp0notebooklmConv.exe" %*'
Set-Content -Path $launcherPath -Value $batContent -Encoding ASCII
Write-Host "[OK] Launcher created." -ForegroundColor Green


# 7. 建立 Manifest
Write-Host "[INFO] Configuring extension ID..."
$jsonContent = '{"name":"com.yourname.nlmconverter","description":"NotebookLM Converter Launcher","path":"launcher.bat","type":"stdio","allowed_origins":["chrome-extension://${extId}/"]}'
Set-Content -Path $manifestPath -Value $jsonContent -Encoding UTF8

# 8. 註冊登錄檔
Write-Host "[INFO] Updating Registry..."
reg add "HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts\\com.yourname.nlmconverter" /ve /t REG_SZ /d $manifestPath /f | Out-Null

# 9. 清理
Remove-Item $zipPath -ErrorAction SilentlyContinue

Write-Host "---------------------------------------"
Write-Host "   INSTALLATION SUCCESSFUL!            " -ForegroundColor Green
Write-Host "---------------------------------------"
Write-Host "You can now verify the extension."
Start-Sleep -Seconds 3
`;

    const encodedCommand = convertToPsBase64(psScript);

    const batContent = `@echo off
title NotebookLM Installer
echo ========================================================
echo   NotebookLM Converter Auto-Installer
echo ========================================================
echo.

:: Check Admin
net session >nul 2>&1
if %errorLevel% NEQ 0 (
    echo [ERROR] Admin rights required.
    echo Please Right-Click -> Run as Administrator.
    pause
    exit
)

echo [INFO] Executing installation script...
powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encodedCommand}

if %errorLevel% NEQ 0 (
    echo.
    echo [ERROR] Installation failed.
    pause
) else (
    echo.
    echo [OK] Done. Closing in 3 seconds...
    timeout /t 3 >nul
)
`;

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