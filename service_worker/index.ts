import { ExternalMessageListener } from "./ExternalMessageListener";
import { IInternalMessage, IServiceWorkerResponse } from "./index.interface";
import { ServiceWorkerMessageAction } from "./Actions.type";
import { TransactionHandler } from "./TransactionHandler";
import { ExtensionEventEmitter } from "./EventEmitter";
class ExtensionServiceWorker extends ExternalMessageListener {
  #eventEmitter: ExtensionEventEmitter;
  status = false;

  constructor() {
    super(new TransactionHandler());
    this.#eventEmitter = new ExtensionEventEmitter();
  }

  #listenMessages() {
    chrome.runtime.onMessage.addListener(
      (
        _message: IInternalMessage,
        _sender,
        _sendResponse: (response: IServiceWorkerResponse) => void
      ) => {
        switch (_message.action) {
          case ServiceWorkerMessageAction.CLOSE_WINDOW:
            this.transactionHandler.closeWindow(
              { ..._message },
              _sender,
              _sendResponse
            );
            break;

          case ServiceWorkerMessageAction.RESPOND_TO_DAPP:
            this.transactionHandler.respondToDapp(
              { ..._message },
              _sender,
              _sendResponse
            );
            break;

          case ServiceWorkerMessageAction.SCREEN_WIDTH:
            this.transactionHandler.screenWidth = _message.data?.width;
            break;

          case ServiceWorkerMessageAction.KEEP_ALIVE_PING:
            // No-op — receiving this message resets the SW idle timer
            break;

          default:
            _sendResponse({ status: "success", errorMessage: "", data: null });
            break;
        }

        return true;
      }
    );
  }


  init() {
    try {
      this.#listenMessages();
      this.listenExternalMessages();
      this.transactionHandler.listenWindowClose();
      this.#eventEmitter.init();
    } catch (error) {
    }
  }
}

try {
  const extensionServiceWorker = new ExtensionServiceWorker();
  extensionServiceWorker.init();
} catch (error) {
  console.error('[Service Worker] Error stack:', error instanceof Error ? error.stack : 'No stack');
}
