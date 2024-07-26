import { ExtensionStorage } from "@util/ExtensionStorage.util";
import { Logger } from "@util/Logger.util";
import { ExternalMessageAction } from "./Actions.type";
import { IExternalMessage, IServiceWorkerResponse } from "./index.interface";
import { TransactionHandler } from "./TransactionHandler";
import { L1XMessageHandler } from "./L1XMessageHandler";
import { accountConnected } from "@util/Account.util";
import { Config } from "@util/Config.util";

export class ExternalMessageListener {
  #allowedMethods: ExternalMessageAction[] = [
    ExternalMessageAction.CONNECT,
    ExternalMessageAction.IS_CONNECTED,
    ExternalMessageAction.DISCONNECT,
    ExternalMessageAction.SIGN_MESSAGE,
    ExternalMessageAction.LIST_ACCOUNTS,
  ];
  #l1XMessageHandler: L1XMessageHandler;

  constructor(protected transactionHandler: TransactionHandler) {
    this.#l1XMessageHandler = new L1XMessageHandler(transactionHandler);
  }

  async #isConnected(
    _message: any,
    _sender: chrome.runtime.MessageSender,
    _sendResponse: (response: IServiceWorkerResponse) => void
  ) {
    try {
      const connectedSites =
        (await ExtensionStorage.get("connectedSites")) ?? [];
      return _sendResponse({
        status: "success",
        errorMessage: "",
        data: {
          isConnected:
            connectedSites?.findIndex(
              (site) =>
                site.url &&
                site.url === _sender.origin &&
                site?.accounts?.length > 0
            ) >= 0,
        },
      });
    } catch (error: any) {
      Logger.error(error);
      return _sendResponse({
        status: "failure",
        errorMessage: error?.message,
        data: null,
      });
    }
  }

  #connect(
    _message: any,
    _sender: chrome.runtime.MessageSender,
    _sendResponse: (response: IServiceWorkerResponse) => void
  ) {
    try {
      const requestId = Date.now();
      const url = `notification.html#connect?data=${encodeURIComponent(
        JSON.stringify({
          url: _sender.origin,
          favIcon: _sender.tab?.favIconUrl,
          appName: _sender.tab?.title,
          requestId,
          clusterType: _message?.clusterType,
          endpoint: _message?.endpoint,
        })
      )}`;
      this.transactionHandler.openNotification(
        url,
        requestId as any,
        _sendResponse
      );
    } catch (error: any) {
      Logger.error(error);
      return _sendResponse({
        status: "failure",
        errorMessage: error?.message,
        data: null,
      });
    }
  }

  async #listConnectedAccounts(
    _message: any,
    _sender: chrome.runtime.MessageSender,
    _sendResponse: (response: IServiceWorkerResponse) => void
  ) {
    try {
      let sites = (await ExtensionStorage.get("connectedSites")) ?? [];
      const site = sites.find((el) => el.url && el.url == _sender.origin);
      return _sendResponse({
        status: "success",
        errorMessage: "",
        data: site?.accounts ?? [],
      });
    } catch (error: any) {
      Logger.error(error);
      return _sendResponse({
        status: "failure",
        errorMessage: error?.message,
        data: null,
      });
    }
  }

  async #handleDisconnect(
    _message: any,
    _sender: chrome.runtime.MessageSender,
    _sendResponse: (response: IServiceWorkerResponse) => void
  ) {
    try {
      let sites = (await ExtensionStorage.get("connectedSites")) ?? [];
      sites = sites.filter((el) => el.url != _sender.origin);
      await ExtensionStorage.set("connectedSites", sites);
      return _sendResponse({
        status: "success",
        errorMessage: "",
        data: null,
      });
    } catch (error: any) {
      Logger.error(error);
      return _sendResponse({
        status: "failure",
        errorMessage: error?.message,
        data: null,
      });
    }
  }

  private async auth(
    _message: ExternalMessageAction,
    _sender: chrome.runtime.MessageSender,
    _sendResponse: (response: IServiceWorkerResponse) => void
  ) {
    try {
      const connectedSites =
        (await ExtensionStorage.get("connectedSites")) ?? [];
      const connected = connectedSites.find(
        (site) => site.url && site.url == _sender.origin
      );
      const allowedMethod = this.#allowedMethods.find(
        (method) => method == _message
      );
      const activeAccount = (await ExtensionStorage.get("wallets"))?.ACTIVE;
      return {
        allowed:
          typeof connected != "undefined" ||
          typeof allowedMethod != "undefined",
        l1xProviderConfig: connected?.l1xProviderConfig,
        activeAccount,
      };
    } catch (error: any) {
      Logger.error(error);
      return {
        allowed: false,
        l1xProviderConfig: null,
      };
    }
  }

  protected listenExternalMessages() {
    chrome.runtime.onMessageExternal.addListener(
      async (
        _message: IExternalMessage,
        _sender,
        _sendResponse: (response: IServiceWorkerResponse) => void
      ) => {
        const connection = await this.auth(
          _message.action,
          _sender,
          _sendResponse
        );
        if (!connection.allowed) {
          return _sendResponse({
            status: "failure",
            errorMessage: "Site is not connected. Please try after connection.",
            data: null,
          });
        }
        switch (_message.action) {
          case ExternalMessageAction.IS_CONNECTED:
            this.#isConnected(_message.data, _sender, _sendResponse);
            break;

          case ExternalMessageAction.CONNECT:
            this.#connect(_message.data, _sender, _sendResponse);
            break;

          case ExternalMessageAction.SEND_TRANSACTION:
            if (
              !(await accountConnected(
                _message.data.from,
                _sender.origin ?? ""
              ))
            ) {
              return _sendResponse({
                status: "failure",
                errorMessage: "Invalid sender address.",
                data: null,
              });
            }
            this.#l1XMessageHandler.sendTransaction(
              _message.data,
              _sender,
              _sendResponse,
              connection.l1xProviderConfig?.endpoint ?? Config.rpc.l1x
            );
            break;

          case ExternalMessageAction.INIT_CONTRACT:
            if (
              !(await accountConnected(
                _message.data.from,
                _sender.origin ?? ""
              ))
            ) {
              return _sendResponse({
                status: "failure",
                errorMessage: "Invalid sender address.",
                data: null,
              });
            }
            this.#l1XMessageHandler.initContract(
              _message.data,
              _sender,
              _sendResponse,
              connection.l1xProviderConfig?.endpoint ?? Config.rpc.l1x
            );
            break;

          case ExternalMessageAction.LIST_ACCOUNTS:
            this.#listConnectedAccounts(_message.data, _sender, _sendResponse);
            break;

          case ExternalMessageAction.CALL_REQUEST:
            this.#l1XMessageHandler.makeRequestCall(
              _message.data,
              _sender,
              _sendResponse,
              connection.l1xProviderConfig as any
            );
            break;

          case ExternalMessageAction.DISCONNECT:
            this.#handleDisconnect(_message.data, _sender, _sendResponse);
            break;

          case ExternalMessageAction.TRANSFER_NATIVE_TOKEN:
            if (
              !(await accountConnected(
                _message.data.from,
                _sender.origin ?? ""
              ))
            ) {
              return _sendResponse({
                status: "failure",
                errorMessage: "Invalid sender address.",
                data: null,
              });
            }
            this.#l1XMessageHandler.transferNativeToken(
              _message.data,
              _sender,
              _sendResponse,
              connection.l1xProviderConfig?.endpoint ?? Config.rpc.l1x
            );
            break;

          case ExternalMessageAction.TRANSFER_TOKEN:
            if (
              !(await accountConnected(
                _message.data.from,
                _sender.origin ?? ""
              ))
            ) {
              return _sendResponse({
                status: "failure",
                errorMessage: "Invalid sender address.",
                data: null,
              });
            }
            this.#l1XMessageHandler.transferTokens(
              _message.data,
              _sender,
              _sendResponse,
              connection.l1xProviderConfig?.endpoint ?? Config.rpc.l1x
            );
            break;

          case ExternalMessageAction.TRANSFER_NFT:
            if (
              !(await accountConnected(
                _message.data.from,
                _sender.origin ?? ""
              ))
            ) {
              return _sendResponse({
                status: "failure",
                errorMessage: "Invalid sender address.",
                data: null,
              });
            }
            this.#l1XMessageHandler.transferNFT(
              _message.data,
              _sender,
              _sendResponse,
              connection.l1xProviderConfig?.endpoint ?? Config.rpc.l1x
            );
            break;

          case ExternalMessageAction.SIGN_MESSAGE:
            this.#l1XMessageHandler.signMessage(
              _message.data,
              _sender,
              _sendResponse
            );
            break;

          case ExternalMessageAction.SIGN_PAYLOAD:
            if (
              !(await accountConnected(
                _message.data.from,
                _sender.origin ?? ""
              ))
            ) {
              return _sendResponse({
                status: "failure",
                errorMessage: "Invalid sender address.",
                data: null,
              });
            }
            this.#l1XMessageHandler.signPayload(
              _message.data,
              _sender,
              _sendResponse
            );
            break;

          case ExternalMessageAction.GET_L1X_PROVIDER_CONFIG:
            return _sendResponse({
              status: "success",
              errorMessage: "",
              data: connection.l1xProviderConfig,
            });

          case ExternalMessageAction.SET_L1X_PROVIDER_CONFIG:
            this.#l1XMessageHandler.setL1XProvider(
              _message.data,
              _sender,
              _sendResponse
            );
            break;

          case ExternalMessageAction.ACCOUNT_STATE:
            if (
              !(await accountConnected(
                _message.data.from,
                _sender.origin ?? ""
              ))
            ) {
              return _sendResponse({
                status: "failure",
                errorMessage: "Invalid sender address.",
                data: null,
              });
            }
            const accountState = await this.#l1XMessageHandler.getAccountState(
              _message.data.from,
              connection.l1xProviderConfig as any
            );
            return _sendResponse({
              status: "success",
              errorMessage: "",
              data: accountState,
            });

          default:
            _sendResponse({
              status: "failure",
              errorMessage: `Invalid action ${_message.action}.`,
              data: null,
            });
            break;
        }

        return true;
      }
    );
  }
}
