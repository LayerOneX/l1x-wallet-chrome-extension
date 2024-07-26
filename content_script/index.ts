// element to inject script
const extensionId = chrome.runtime.id;
const docElement = document.head ?? document.documentElement;

function injectsdk() {
  // prepare script to inject L1X BOM
  let script = document.createElement("script");
  script.src = chrome.runtime.getURL("sdk/index.js");
  script.type = "module";
  script.setAttribute("data-x-wallet-extension-id", extensionId);
  script.onload = function () {
    // clean up script
    docElement.removeChild(script);
  };

  // inject script
  docElement.appendChild(script);
}

injectsdk();

// listen events
chrome.runtime.onMessage.addListener((message) => {
  window.postMessage({
    ...message,
    source: extensionId,
  });
});

chrome.runtime.sendMessage({
  action: "SCREEN_WIDTH",
  data: {
    width: screen.width,
  },
});
