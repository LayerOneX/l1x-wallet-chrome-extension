import { ExtensionStorage } from "@util/ExtensionStorage.util";
import {
  ICallback,
  IInternalMessage,
  IServiceWorkerResponse,
} from "./index.interface";
import { removeTransactionRequest } from "@util/Transaction.util";

export class TransactionHandler {
  #callbacks: ICallback = {};
  screenWidth = null;
  constructor() {}

  async openNotification(
    url: string,
    requestId: string,
    _sendResponse: (response: IServiceWorkerResponse) => void
  ) {
    console.log("[TransactionHandler] openNotification called, url:", url, "requestId:", requestId);

    // Start keep-alive BEFORE creating the window so the service worker
    // stays alive long enough for chrome.windows.create callback to fire
    await this.#startKeepAlive();

    const platform = await chrome.runtime.getPlatformInfo();
    const width = platform.os == "win" ? 391 : 375;
    const heigth = platform.os == "win" ? 639 : 600;

    // Position popup at top-right of the active browser window
    let left = 10;
    let top = 20;
    try {
      // Get the window that contains the active tab — more reliable than getLastFocused
      const [activeTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      const browserWindow = activeTab?.windowId
        ? await chrome.windows.get(activeTab.windowId)
        : await chrome.windows.getLastFocused({ windowTypes: ["normal"] });

      if (
        browserWindow &&
        browserWindow.left != null &&
        browserWindow.width != null &&
        browserWindow.top != null
      ) {
        left = browserWindow.left + browserWindow.width - width - 10;
        top = browserWindow.top;
      }
    } catch {
      // Fallback to screenWidth if available
      if (this.screenWidth) {
        left = this.screenWidth - width - 20;
      }
    }

    // Create the popup window
    chrome.windows.create(
      {
        url: chrome.runtime.getURL(url),
        type: "popup",
        width: width,
        height: heigth,
        left,
        top,
        focused: true,
      },
      (tab: chrome.windows.Window | undefined) => {
        console.log("[TransactionHandler] chrome.windows.create callback, tab:", tab);
        if (tab && tab.tabs) {
          this.#callbacks[requestId] = {
            sendRequest: _sendResponse,
            windowId: tab.tabs[0].windowId,
          };
        } else {
          console.error("[TransactionHandler] Failed to create popup window, tab is:", tab);
        }
      }
    );
  }

  async initiateTransaction(
    requestId: string,
    transaction: Transaction,
    _sendResponse: (response: IServiceWorkerResponse) => void
  ) {
    const pendingTransactions =
      (await ExtensionStorage.get("pendingTransactions")) || [];

    await ExtensionStorage.set("pendingTransactions", [
      transaction,
      ...pendingTransactions,
    ]);

    this.openNotification(`notification.html`, requestId, _sendResponse);
  }

  /**
   * Send response to dApp WITHOUT closing the popup window.
   * Used when we want to relay the tx hash immediately but keep
   * showing a "Transaction Submitted" screen.
   */
  async respondToDapp(
    _message: IInternalMessage,
    _sender: chrome.runtime.MessageSender,
    _sendResponse: (response: IServiceWorkerResponse) => void
  ) {
    const message = { ..._message, action: undefined, event: undefined };
    const requestId = message?.requestId || "";
    const request = this.#callbacks[requestId];
    if (request) {
      delete message?.requestId;
      await request?.sendRequest(message);
      // Don't close window or delete callback — popup stays open.
      // The callback will be cleaned up when the user manually closes
      // the popup (listenWindowClose handles that).
      // But remove from callbacks so listenWindowClose doesn't send
      // a duplicate "failure" response when the user finally closes.
      delete this.#callbacks[requestId];
    }
  }

  async closeWindow(
    _message: IInternalMessage,
    _sender: chrome.runtime.MessageSender,
    _sendResponse: (response: IServiceWorkerResponse) => void
  ) {
    const message = { ..._message, action: undefined, event: undefined };
    const requestId = message?.requestId || "";
    const request = this.#callbacks[requestId];
    if (request) {
      delete message?.requestId;
      await request?.sendRequest(message);
      chrome.windows.remove(request.windowId);
      delete this.#callbacks[requestId];
      this.#stopKeepAlive();
    }
  }

  listenWindowClose() {
    chrome.windows.onRemoved.addListener((windowId) => {
      Object.entries(this.#callbacks).forEach(([requestId, callback]) => {
        if (callback.windowId == windowId) {
          callback.sendRequest({
            status: "failure",
            errorMessage: "Window closed by user.",
            data: null,
          });
          removeTransactionRequest(requestId);
          delete this.#callbacks[requestId];
        }
      });
      this.#stopKeepAlive();
    });
  }

  async #startKeepAlive() {
    try {
      const existing = await chrome.offscreen.hasDocument();
      if (!existing) {
        await chrome.offscreen.createDocument({
          url: "offscreen.html",
          reasons: [chrome.offscreen.Reason.BLOBS],
          justification: "Keep service worker alive during popup approval",
        });
      }
    } catch {
      // Offscreen doc may already exist or API unavailable
    }
  }

  async #stopKeepAlive() {
    // Only stop if no more pending callbacks
    if (Object.keys(this.#callbacks).length === 0) {
      try {
        const existing = await chrome.offscreen.hasDocument();
        if (existing) {
          await chrome.offscreen.closeDocument();
        }
      } catch {
        // Ignore — doc may already be closed
      }
    }
  }
}
