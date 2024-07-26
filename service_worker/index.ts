import { Logger } from "@util/Logger.util";
import { ExternalMessageListener } from "./ExternalMessageListener";
import { IInternalMessage, IServiceWorkerResponse } from "./index.interface";
import { ServiceWorkerMessageAction } from "./Actions.type";
import { TransactionHandler } from "./TransactionHandler";
import { ExtensionEventEmitter } from "./EventEmitter";

class ExtensionServiceWorker extends ExternalMessageListener {
  #eventEmitter: ExtensionEventEmitter;
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

          case ServiceWorkerMessageAction.SCREEN_WIDTH:
            this.transactionHandler.screenWidth = _message.data?.width;
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
    this.#listenMessages();
    this.listenExternalMessages();
    this.transactionHandler.listenWindowClose();
    this.#eventEmitter.init();
    Logger.log("Service worker started successfully...");
  }
}

const extensionServiceWorker = new ExtensionServiceWorker();
extensionServiceWorker.init();
