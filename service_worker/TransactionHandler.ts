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
    const platform = await chrome.runtime.getPlatformInfo();
    const width = platform.os == "win" ? 391 : 375;
    const heigth = platform.os == "win" ? 639 : 600;

    // Create the popup window
    chrome.windows.create(
      {
        url: chrome.runtime.getURL(url),
        type: "popup",
        width: width,
        height: heigth,
        left: this.screenWidth ? this.screenWidth - width - 20 : 10,
        top: 20,
        focused: true,
      },
      (tab: chrome.windows.Window | undefined) => {
        if (tab && tab.tabs) {
          this.#callbacks[requestId] = {
            sendRequest: _sendResponse,
            windowId: tab.tabs[0].windowId,
          };
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
      request?.sendRequest(message);
      chrome.windows.remove(request.windowId);
      delete this.#callbacks[requestId];
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
        }
      });
    });
  }
}
