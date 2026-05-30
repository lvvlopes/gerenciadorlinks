// background.js - Service worker da extensão

chrome.runtime.onInstalled.addListener(() => {
  console.log("LinkVault Saver instalado!");
});

// Escuta mensagens do popup para injetar o content script em abas que não o tem
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "injectAndExtract") {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const tab = tabs[0];
      try {
        // Injeta o content script caso ainda não esteja rodando
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["src/content.js"],
        });

        // Pequeno delay para o script carregar
        setTimeout(() => {
          chrome.tabs.sendMessage(tab.id, { action: "extractContent" }, (response) => {
            sendResponse(response);
          });
        }, 100);
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    });
    return true;
  }
});
