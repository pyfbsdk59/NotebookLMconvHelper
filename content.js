// 建立浮動按鈕
const floatBtn = document.createElement('button');
floatBtn.innerText = "📂 檢查檔案";
floatBtn.id = "nlm-helper-btn";
document.body.appendChild(floatBtn);

// 建立面板
const panel = document.createElement('div');
panel.id = "nlm-helper-panel";
panel.innerHTML = `
    <h3>NotebookLM 檔案檢查</h3>
    <p>限制：200MB 以下</p>
    <input type="file" id="nlm-file-input" accept="audio/*,video/*,application/pdf,text/*" />
    <div id="nlm-status"></div>
    <button id="nlm-launch-py" style="display:none; margin-top:10px;">🚀 啟動 Python 轉檔器</button>
`;
document.body.appendChild(panel);

// UI 互動邏輯
floatBtn.addEventListener('click', () => {
    panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
});

const fileInput = panel.querySelector('#nlm-file-input');
const statusDiv = panel.querySelector('#nlm-status');
const launchBtn = panel.querySelector('#nlm-launch-py');

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const sizeMB = file.size / (1024 * 1024);
    statusDiv.innerText = `檔案大小: ${sizeMB.toFixed(2)} MB`;

    if (sizeMB > 200) {
        statusDiv.style.color = "red";
        statusDiv.innerText += "\n⚠️ 超過 200MB！請使用轉檔工具。";
        launchBtn.style.display = "block";
    } else {
        statusDiv.style.color = "green";
        statusDiv.innerText += "\n✅ 大小符合規定。";
        launchBtn.style.display = "none";
    }
});

// 點擊按鈕發送訊息給 Background Script
launchBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: "launch_converter" }, (response) => {
        if (response && response.status === "success") {
            statusDiv.innerText += "\n已發送啟動指令...";
        } else {
            statusDiv.innerText += "\n啟動失敗 (請確認 Native Host 設定)";
        }
    });
});