// background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "launch_converter") {
        // 嘗試連接 Native Host
        const port = chrome.runtime.connectNative('com.yourname.nlmconverter');
        
        // 監聽連接是否立即斷開 (代表沒安裝或設定錯誤)
        port.onDisconnect.addListener(() => {
            if (chrome.runtime.lastError) {
                console.log("連線失敗:", chrome.runtime.lastError.message);
                // 回傳失敗狀態給前端
                sendResponse({ status: "not_installed", error: chrome.runtime.lastError.message });
            }
        });

        // 如果成功連接，發送訊息並關閉
        // 注意：這是一個異步操作，為了確保 sendResponse 能在 onDisconnect 後被呼叫，
        // 我們這裡做個簡單的延遲或是利用 port 的特性。
        // 但最簡單的方法是：NativeMessaging 啟動後，如果沒有馬上斷線就是成功。
        
        // 為了簡化，我們直接發送訊息，若報錯由 onDisconnect 捕獲
        try {
            port.postMessage({ text: "open_gui" });
            // 假設沒報錯就是成功 (Native Host 啟動通常很快)
            sendResponse({ status: "success" }); 
        } catch (e) {
            sendResponse({ status: "not_installed" });
        }
        
        // 保持消息通道開啟以進行異步回應
        return true; 
    }
});