chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "launch_converter") {
        // "com.yourname.nlmconverter" 是我們在 Native Host 定義的 ID
        chrome.runtime.sendNativeMessage('com.yourname.nlmconverter',
            { text: "open_gui" },
            function (response) {
                console.log("Native output:", response);
            }
        );
        sendResponse({ status: "success" });
    }
});