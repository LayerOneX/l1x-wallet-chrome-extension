import {
  ISDKInitContract,
  ISDKRequestCall,
  ISDKSendTransaction,
  ISDKSignMessage,
  ISDKSignPayload,
  ISDKTransfer,
  ISDKTransferNFT,
  ISDKTransferToken,
  IXWalletAPI,
} from "./interface";
import { ExternalMessageAction } from "../service_worker/Actions.type";
import {
  IExternalMessage,
  IServiceWorkerResponse,
} from "../service_worker/index.interface";
import { GetAccountStateResponse, ProviderAttrib } from "@l1x/l1x-wallet-sdk";

class CustomError extends Error {
  status: string;
  data: any;
  constructor({ status, errorMessage, data }: any) {
    super(errorMessage);
    this.status = status;
    this.data = data;
  }
}

/**
 * Class implementing the IXWalletAPI interface for interacting with the XWallet extension.
 */
class XWalletAPI implements IXWalletAPI {
  extensionId = chrome.runtime.id;

  /**
   * Sends a message to the Chrome runtime and handles the response.
   * @param data The message data to send.
   * @param resolve The resolve function for the Promise.
   * @param reject The reject function for the Promise.
   */
  protected sendMessage(
    data: IExternalMessage,
    resolve: Function,
    reject: Function
  ) {
    chrome.runtime.sendMessage(
      this.extensionId,
      data,
      (response: IServiceWorkerResponse) =>
        response?.status == "success" ? resolve(response) : reject(response)
    );
  }

  /**
   * Checks if the wallet is connected.
   * @returns {Promise<IServiceWorkerResponse>} Promise that resolves the connection status.
   */
  isConnected() {
    return new Promise<IServiceWorkerResponse>((resolve, reject) => {
      this.sendMessage(
        {
          action: ExternalMessageAction.IS_CONNECTED,
          data: null,
        },
        resolve,
        reject
      );
    });
  }

  /**
   * Sends a connect request to the wallet.
   * @param providerAttrib Provider attributes for the connection.
   * @returns {Promise<IServiceWorkerResponse>} Promise that resolves the connection status.
   */
  connect(providerAttrib: ProviderAttrib): Promise<IServiceWorkerResponse> {
    return new Promise<IServiceWorkerResponse>((resolve, reject) => {
      this.isConnected()
        .then((res) => {
          if (!res.data?.isConnected) {
            this.sendMessage(
              {
                action: ExternalMessageAction.CONNECT,
                data: providerAttrib,
              },
              resolve,
              reject
            );
          } else {
            resolve({
              status: "success",
              errorMessage: "",
              data: {
                isConnected: true,
              },
            });
          }
        })
        .catch((err) =>
          reject(
            new CustomError({
              status: "failure",
              errorMessage: err,
              data: null,
            })
          )
        );
    });
  }

  /**
   * Disconnects the site from the wallet.
   * @returns {Promise<IServiceWorkerResponse>} Promise that resolves the disconnection status.
   */
  disconnect(): Promise<IServiceWorkerResponse> {
    return new Promise<any>((resolve, reject) => {
      this.sendMessage(
        {
          action: ExternalMessageAction.DISCONNECT,
          data: null,
        },
        resolve,
        reject
      );
    });
  }

  /**
   * Retrieves the connected accounts.
   * @returns {Promise<GetAccountStateResponse>} Promise that resolves the account state.
   */
  getConnectedAccounts(): Promise<GetAccountStateResponse> {
    return new Promise<any>((resolve, reject) => {
      this.sendMessage(
        {
          action: ExternalMessageAction.LIST_ACCOUNTS,
          data: null,
        },
        resolve,
        reject
      );
    });
  }

  /**
   * Makes a read contract call to the L1X virtual machine.
   * @param transaction The request call transaction details.
   * @returns {Promise<any>} Promise that resolves the smart contract response.
   */
  makeRequestCall(transaction: ISDKRequestCall): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this.sendMessage(
        {
          action: ExternalMessageAction.CALL_REQUEST,
          data: transaction,
        },
        resolve,
        reject
      );
    });
  }

  /**
   * Sends a transaction to the L1X virtual machine.
   *@param {ISDKSendTransaction} transaction - The send transaction details.
   * @returns {Promise<IServiceWorkerResponse>} Promise that resolves the transaction response.
   */
  sendTransaction(
    transaction: ISDKSendTransaction
  ): Promise<IServiceWorkerResponse> {
    return new Promise<any>((resolve, reject) => {
      this.sendMessage(
        {
          action: ExternalMessageAction.SEND_TRANSACTION,
          data: transaction,
        },
        resolve,
        reject
      );
    });
  }

  /**
   * Initializes a contract on the L1X virtual machine.
   * @param {ISDKInitContract} transaction - The initialize contract transaction details.
   * @returns {Promise<IServiceWorkerResponse<{ contractAddress: string; hash: string }>>} Promise that resolves the contract initialization response.
   */
  initContract(
    transaction: ISDKInitContract
  ): Promise<
    IServiceWorkerResponse<{ contractAddress: string; hash: string }>
  > {
    return new Promise((resolve, reject) => {
      this.sendMessage(
        {
          action: ExternalMessageAction.INIT_CONTRACT,
          data: transaction,
        },
        resolve,
        reject
      );
    });
  }

  /**
   * Transfers L1X coin to an address.
   * @param {ISDKTransfer} transaction - The transfer transaction details.
   * @returns {Promise<IServiceWorkerResponse>} Promise that resolves the transaction status.
   */
  transfer(transaction: ISDKTransfer): Promise<IServiceWorkerResponse> {
    return new Promise<any>((resolve, reject) => {
      this.sendMessage(
        {
          action: ExternalMessageAction.TRANSFER_NATIVE_TOKEN,
          data: transaction,
        },
        resolve,
        reject
      );
    });
  }

  /**
   * Transfers fungible tokens to an address.
   * @param {ISDKTransferToken} transaction - The transfer token transaction details.
   * @returns {Promise<IServiceWorkerResponse>} Promise that resolves the transaction status.
   */
  transferTokens(
    transaction: ISDKTransferToken
  ): Promise<IServiceWorkerResponse> {
    return new Promise<any>((resolve, reject) => {
      this.sendMessage(
        {
          action: ExternalMessageAction.TRANSFER_TOKEN,
          data: transaction,
        },
        resolve,
        reject
      );
    });
  }

  /**
   * Transfers a non-fungible token to an address.
   * @param {ISDKTransferNFT} transaction - The transfer NFT transaction details.
   * @returns {Promise<IServiceWorkerResponse>} Promise that resolves the transaction status.
   */
  transferNFT(transaction: ISDKTransferNFT): Promise<IServiceWorkerResponse> {
    return new Promise<any>((resolve, reject) => {
      this.sendMessage(
        {
          action: ExternalMessageAction.TRANSFER_NFT,
          data: transaction,
        },
        resolve,
        reject
      );
    });
  }

  /**
   * Sets the extension ID from a script element attribute.
   */
  setExtensionId() {
    const scriptElement = document.querySelector(
      "script[data-x-wallet-extension-id]"
    );
    if (scriptElement) {
      const extensionId = scriptElement.getAttribute(
        "data-x-wallet-extension-id"
      );
      if (extensionId) {
        this.extensionId = extensionId;
      }
    }
  }

  /**
   * Sets the L1XProvider configuration.
   * @param {ProviderAttrib} config - The provider attributes.
   * @returns {Promise<IServiceWorkerResponse>} Promise that resolves the status.
   */
  async setProviderConfig(
    config: ProviderAttrib
  ): Promise<IServiceWorkerResponse> {
    if (!config?.clusterType || !config?.endpoint) {
      return {
        status: "failure",
        errorMessage: `Missing require argument. ${
          !config?.clusterType ? "clusterType" : ""
        } ${!config?.endpoint ? "endpoint" : ""}`,
        data: "",
      };
    }
    return new Promise<any>((resolve, reject) => {
      this.sendMessage(
        {
          action: ExternalMessageAction.SET_L1X_PROVIDER_CONFIG,
          data: config,
        },
        resolve,
        reject
      );
    });
  }

  /**
   * @description Returns the active L1X provider configuration.
   * @returns {Promise<IServiceWorkerResponse>} Promise that resolves the configuration.
   */
  async getProviderConfig(): Promise<IServiceWorkerResponse> {
    return new Promise<any>((resolve, reject) => {
      this.sendMessage(
        {
          action: ExternalMessageAction.GET_L1X_PROVIDER_CONFIG,
          data: null,
        },
        resolve,
        reject
      );
    });
  }

  /**
   * Signs a message with the wallet.
   * @param {ISDKSignMessage} payload - The sign message payload.
   * @returns {Promise<string>} Promise that resolves the signed message.
   */
  async signMessage(payload: ISDKSignMessage): Promise<string> {
    return new Promise<any>((resolve, reject) => {
      this.sendMessage(
        {
          action: ExternalMessageAction.SIGN_MESSAGE,
          data: payload,
        },
        resolve,
        reject
      );
    });
  }

  /**
   * Signs a payload with the wallet.
   * @param {ISDKSignPayload} payload - The sign payload.
   * @returns {Promise<string>} Promise that resolves the signed payload.
   */
  async signPayload(payload: ISDKSignPayload): Promise<string> {
    return new Promise<any>((resolve, reject) => {
      this.sendMessage(
        {
          action: ExternalMessageAction.SIGN_PAYLOAD,
          data: payload,
        },
        resolve,
        reject
      );
    });
  }

  /**
   * Adds an event listener for specified event.
   * @param {string} event - The event to listen for.
   * @param {Function} listener - The event listener function.
   */
  addEventListener(event: string, listener: () => void) {
    xwalletEvents[event.toUpperCase()]?.length
      ? xwalletEvents[event.toUpperCase()].push(listener)
      : (xwalletEvents[event.toUpperCase()] = [listener]);
  }

  /**
   * Removes an event listener for specified event.
   * @param {string} event - The event to stop listening for.
   * @param {Function} listener - The event listener function to remove.
   */
  removeEventListener(event: string, listener: () => void) {
    if (xwalletEvents[event.toUpperCase()]?.length) {
      xwalletEvents[event.toUpperCase()] = xwalletEvents[
        event.toUpperCase()
      ].filter((el) => el != listener);
    }
  }

  /**
   * Removes all event listeners.
   */
  removeAllEventListener(): void {
    Object.keys(xwalletEvents).map((event) => {
      xwalletEvents[event.toUpperCase()] = [];
    });
  }

  /**
   * Returns account balance for connected address
   * @param args
   * @returns
   */
  getAccountState(args: {
    from: string;
  }): Promise<IServiceWorkerResponse<GetAccountStateResponse>> {
    return new Promise<any>((resolve, reject) => {
      this.sendMessage(
        {
          action: ExternalMessageAction.ACCOUNT_STATE,
          data: args,
        },
        resolve,
        reject
      );
    });
  }
}

const proxyHandler = {
  get(target: any, property: string) {
    if (typeof target[property] === "function") {
      return function (...args: any[]) {
        return target[property](...args);
      };
    }
    return target[property];
  },
  set(target: any, property: any, value: any) {
    if (
      property === "extensionId" &&
      typeof target.setExtensionId === "function"
    ) {
      target.setExtensionId();
      return true;
    } else {
      console.log(`Setting ${property} to ${value} is not allowed`);
      return false;
    }
  },
};

// Create proxy object for BOM
const xwalletAPI = new Proxy<XWalletAPI>(new XWalletAPI(), proxyHandler);

// Set extension ID
xwalletAPI.extensionId = "";

// Inject BOM
window.L1X = xwalletAPI;

const xwalletEvents: { [k: string]: ((...args: any[]) => void)[] } = {};

/**
 * Event listener for messages.
 * @param {MessageEvent} event - The message event.
 */
window.addEventListener("message", (event) => {
  if (event.origin != location.origin) {
    return;
  }
  if (
    event?.data?.event &&
    event?.data?.source &&
    event?.data?.source == window?.L1X?.extensionId
  ) {
    switch (event?.data?.event?.toUpperCase()) {
      case "UNINSTALL":
        if (xwalletEvents["UNINSTALL"]?.length) {
          xwalletEvents["UNINSTALL"]?.map((fun) => {
            if (typeof fun == "function") {
              fun(event?.data?.data);
            }
          });
        }
        xwalletAPI?.removeAllEventListener();
        break;

      case "DISCONNECT":
        if (xwalletEvents[event?.data?.event.toUpperCase()]?.length) {
          xwalletEvents[event?.data?.event.toUpperCase()].map((fun) => {
            if (typeof fun == "function") {
              fun(event?.data?.data[location.origin]);
            }
          });
        }
        break;

      default:
        break;
    }
  }
});
