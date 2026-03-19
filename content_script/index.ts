// element to inject script
const extensionId = chrome.runtime.id;
// Use documentElement (always available, even at document_start)
const docElement = document.documentElement;

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

function injectEthereumSdk() {
  let script = document.createElement("script");
  script.src = chrome.runtime.getURL("ethereum_sdk/index.js");
  // Intentionally NOT type="module" — must execute eagerly so EIP-6963 announces
  // before page scripts run their provider discovery
  script.setAttribute("data-x-wallet-extension-id", extensionId);
  // Do NOT remove script on load — the extension ID attribute must remain in DOM
  // for the provider to read it (eagerly cached at module init, but keep as safety net)
  docElement.appendChild(script);
}

// ── EARLY window.ethereum claim ──
// Must run synchronously BEFORE any external scripts load.
// This prevents MetaMask from claiming window.ethereum on l1xapp.com.
(function earlyEthereumClaim() {
  const host = location.hostname;
  const isL1X = host === "l1xapp.com" || host.endsWith(".l1xapp.com") || host === "localhost";
  if (isL1X) {
    // Create a temporary proxy that stores calls until the real provider loads
    const earlyProxy = new Proxy({} as any, {
      get(_target, prop) {
        if (prop === "isXWallet") return true;
        if (prop === "isMetaMask") return true; // Spoof so dApps treat us like MetaMask
        // Return a no-op function for any method call before provider is ready
        return (..._args: any[]) =>
          new Promise((_resolve, _reject) => {
            // Queue calls — they'll be handled once real provider loads
            const check = setInterval(() => {
              if ((window as any)._xwalletEthProvider) {
                clearInterval(check);
                const fn = (window as any)._xwalletEthProvider[prop];
                if (typeof fn === "function") {
                  _resolve(fn.call((window as any)._xwalletEthProvider, ..._args));
                } else {
                  _resolve(fn);
                }
              }
            }, 50);
            // Timeout after 10s
            setTimeout(() => { clearInterval(check); _reject(new Error("XWallet provider timeout")); }, 10000);
          });
      },
    });

    try {
      Object.defineProperty(window, "ethereum", {
        get: () => (window as any)._xwalletEthProvider || earlyProxy,
        set: () => true, // Block MetaMask from overwriting
        configurable: false,
      });
    } catch {
      // Already defined — try to overwrite
      (window as any).ethereum = earlyProxy;
    }
  }
})();

injectsdk();
injectEthereumSdk();

const ALLOWED_EVENTS = ["DISCONNECT", "UNINSTALL", "ACCOUNTS_CHANGED", "CHAIN_CHANGED"];

chrome.runtime.onMessage.addListener((message) => {
  if (message?.event && ALLOWED_EVENTS.includes(message.event.toUpperCase())) {
    // Relay L1X events
    window.postMessage({
      ...message,
      source: extensionId,
    }, window.location.origin);

    // Also relay as ethereum provider events
    if (message.event === "ACCOUNTS_CHANGED") {
      window.postMessage({
        source: "xwallet-ethereum-provider",
        type: "accountsChanged",
        payload: message.data,
      }, window.location.origin);
    } else if (message.event === "CHAIN_CHANGED") {
      window.postMessage({
        source: "xwallet-ethereum-provider",
        type: "chainChanged",
        payload: message.data,
      }, window.location.origin);
    } else if (message.event === "DISCONNECT") {
      window.postMessage({
        source: "xwallet-ethereum-provider",
        type: "disconnect",
        payload: null,
      }, window.location.origin);
    }
  }
});

chrome.runtime.sendMessage({
  action: "SCREEN_WIDTH",
  data: {
    width: screen.width,
  },
}).catch(() => {
  // Service worker may be idle — ignore
});

// ── Deferred Response Relay ──
// Service worker writes popup responses to chrome.storage.local under "evm_response_<requestId>".
// We listen for those changes and relay the response to the page via postMessage,
// then clean up the storage key.
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") return;
  for (const key of Object.keys(changes)) {
    if (!key.startsWith("evm_response_")) continue;
    const requestId = key.replace("evm_response_", "");
    const response = changes[key].newValue;
    console.log("[ContentScript] Deferred response detected, key:", key, "requestId:", requestId, "response:", response);
    if (!response) continue;
    // Relay to page
    window.postMessage(
      {
        source: "xwallet-evm-response",
        requestId,
        response,
      },
      window.location.origin
    );
    console.log("[ContentScript] Posted to page, source: xwallet-evm-response");
    // Clean up storage
    chrome.storage.local.remove(key);
  }
});

// ── RPC Relay ──
// Relay JSON-RPC fetch requests from the injected SDK (page context)
// through the content script (extension context) to bypass page CSP restrictions.
window.addEventListener("message", async (event) => {
  if (event.source !== window) return;
  if (event.data?.source !== "xwallet-sdk-rpc") return;

  const { callbackId, rpcUrl, body } = event.data;
  if (!callbackId || !rpcUrl || !body) return;

  try {
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      window.postMessage(
        {
          source: "xwallet-content-rpc",
          callbackId,
          error: {
            code: -32603,
            message: `RPC request failed: ${response.status} ${response.statusText}`,
          },
        },
        window.location.origin
      );
      return;
    }

    const json = await response.json();

    if (json.error) {
      window.postMessage(
        {
          source: "xwallet-content-rpc",
          callbackId,
          error: json.error,
        },
        window.location.origin
      );
    } else {
      window.postMessage(
        {
          source: "xwallet-content-rpc",
          callbackId,
          result: json.result,
        },
        window.location.origin
      );
    }
  } catch (err: any) {
    window.postMessage(
      {
        source: "xwallet-content-rpc",
        callbackId,
        error: {
          code: -32603,
          message: err?.message ?? "Content script RPC relay failed",
        },
      },
      window.location.origin
    );
  }
});
