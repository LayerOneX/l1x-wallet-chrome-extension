import { ExtensionStorage } from "@util/ExtensionStorage.util";
import {
  ISDKInitContract,
  ISDKRequestCall,
  ISDKSendTransaction,
  ISDKTransfer,
  ISDKTransferNFT,
  ISDKTransferToken,
} from "../sdk/interface";
import { TransactionHandler } from "./TransactionHandler";
import { IServiceWorkerResponse } from "./index.interface";
import { v4 as uuidv4 } from "uuid";
import { Logger } from "@util/Logger.util";
import {
  EstimateFeelimitArg,
  L1XProvider,
  L1XVMTransaction,
  ProviderAttrib,
} from "@l1x/l1x-wallet-sdk";
import { Util } from "@util/Util";

export class L1XMessageHandler {
  constructor(private transactionHandler: TransactionHandler) {}

  async sendTransaction(
    _message: ISDKSendTransaction,
    _sender: chrome.runtime.MessageSender,
    _sendResponse: (response: IServiceWorkerResponse) => void,
    rpc: string
  ) {
    try {
      const from = _message.from || "";
      const functionName = _message.functionName || "";
      const contractAddress = _message.contractAddress || "";
      const args = _message.args;
      const requestId = Date.now();

      if (!functionName || !contractAddress || !from) {
        throw new Error(
          `Missing required parameters.` +
            (!functionName ? " functionName" : "") +
            (!contractAddress ? " contractAddress" : "") +
            (!from ? " from" : "")
        );
      }
      const transaction: IStateChangeCall = {
        type: "state-change-call",
        functionName: functionName,
        contractAddress: contractAddress,
        arguments: args,
        source: "dapp",
        site: _sender.origin,
        siteFavIcon: _sender.tab?.favIconUrl,
        id: uuidv4(),
        from: from || "",
        timestamp: Date.now(),
        requestId: requestId as any,
        networkType: "L1X",
        feeLimit: _message?.feeLimit,
        nonce: _message?.nonce,
        chainId: "1",
        rpc,
      };

      this.transactionHandler.initiateTransaction(
        requestId as any,
        transaction,
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

  async initContract(
    _message: ISDKInitContract,
    _sender: chrome.runtime.MessageSender,
    _sendResponse: (response: IServiceWorkerResponse) => void,
    rpc: string
  ) {
    try {
      const from = _message.from || "";
      const baseContractAddress = _message.baseContractAddress || "";
      const args = _message.args;
      const requestId = Date.now();

      if (!baseContractAddress) {
        throw new Error(
          `Missing required parameters.` +
            (!baseContractAddress ? " baseContractAddress" : "") +
            (!from ? " from" : "")
        );
      }
      const transaction: IInitContract = {
        type: "init-contract",
        baseContractAddress: baseContractAddress,
        arguments: args,
        source: "dapp",
        site: _sender.origin,
        siteFavIcon: _sender.tab?.favIconUrl,
        id: uuidv4(),
        from: from || "",
        timestamp: Date.now(),
        requestId: requestId as any,
        networkType: "L1X",
        feeLimit: _message?.feeLimit,
        nonce: _message?.nonce,
        chainId: "1",
        rpc,
      };

      this.transactionHandler.initiateTransaction(
        requestId as any,
        transaction,
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

  async makeRequestCall(
    _message: ISDKRequestCall,
    _sender: chrome.runtime.MessageSender,
    _sendResponse: (response: IServiceWorkerResponse) => void,
    providerAttrib: ProviderAttrib = {
      clusterType: "mainnet",
      endpoint: "https://v2-mainnet-rpc.l1x.foundation",
    }
  ) {
    try {
      const provider = new L1XProvider(providerAttrib);
      const response = await provider.vm.makeReadOnlyCall({
        attrib: {
          contract_address: _message.contractAddress,
          function: _message.functionName,
          arguments: _message.args,
        },
      });
      return _sendResponse({
        status: "success",
        errorMessage: "",
        data: response,
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

  async transferNativeToken(
    _message: ISDKTransfer,
    _sender: chrome.runtime.MessageSender,
    _sendResponse: (response: IServiceWorkerResponse) => void,
    rpc: string
  ) {
    try {
      const receiver = _message?.receiver || "";
      const amount = _message?.value || 0;
      if (!receiver || !amount) {
        throw new Error(
          `Missing required parameters.` +
            (!receiver ? " receiver" : "") +
            (!amount ? " amount" : "")
        );
      }
      const requestId = Date.now();
      const account = await ExtensionStorage.get("wallets");

      const transaction: ITransferNativeToken = {
        id: uuidv4(),
        timestamp: Date.now(),
        type: "transfer-native-token",
        from: account?.ACTIVE?.publicKey || "",
        to: receiver,
        amount: amount?.toString() || "",
        source: "dapp",
        symbol: "L1X",
        requestId: requestId as any,
        networkType: "L1X",
        site: _sender.origin,
        feeLimit: _message?.feeLimit,
        nonce: _message?.nonce,
        responseType: _message?.responseType,
        chainId: "1",
        rpc,
      };

      this.transactionHandler.initiateTransaction(
        requestId as any,
        transaction,
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

  async transferTokens(
    _message: ISDKTransferToken,
    _sender: chrome.runtime.MessageSender,
    _sendResponse: (response: IServiceWorkerResponse) => void,
    rpc: string
  ) {
    try {
      const receiver = _message?.receiver || "";
      const amount = _message?.value || 0;
      const tokenAddress = _message?.tokenAddress || "";
      if (!receiver || !amount || !tokenAddress) {
        throw new Error(
          `Missing required parameters.` +
            (!receiver ? " receiver" : "") +
            (!amount ? " amount" : "") +
            (!tokenAddress ? " tokenAddress" : "")
        );
      }
      const requestId = Date.now();
      const account = await ExtensionStorage.get("wallets");

      const transaction: ITransferToken = {
        id: uuidv4(),
        timestamp: Date.now(),
        type: "transfer-token",
        from: account?.ACTIVE?.publicKey || "",
        to: receiver,
        tokenAddress: tokenAddress || "",
        amount: amount?.toString() || "",
        source: "dapp",
        requestId: requestId as any,
        networkType: "L1X",
        site: _sender.origin,
        feeLimit: _message?.feeLimit,
        nonce: _message?.nonce,
        chainId: "1",
        rpc,
      };

      this.transactionHandler.initiateTransaction(
        requestId as any,
        transaction,
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

  async transferNFT(
    _message: ISDKTransferNFT,
    _sender: chrome.runtime.MessageSender,
    _sendResponse: (response: IServiceWorkerResponse) => void,
    rpc: string
  ) {
    try {
      const receiver = _message?.receiver || "";
      const amount = _message?.value || 0;
      const collectionAddress = _message?.collectionAddress || "";
      const tokenId = _message?.tokenId || "";
      const account = await ExtensionStorage.get("wallets");
      const requestId = Date.now();
      if (!receiver || !amount || !collectionAddress || !tokenId) {
        throw new Error(
          `Missing required parameters.` +
            (!receiver ? " receiver" : "") +
            (!amount ? " amount" : "") +
            (!collectionAddress ? " collectionAddress" : "") +
            (!tokenId ? " tokenId" : "")
        );
      }

      const transaction: ITransferNFT = {
        id: uuidv4(),
        timestamp: Date.now(),
        type: "transfer-nft",
        from: account?.ACTIVE?.publicKey || "",
        to: receiver,
        amount: amount,
        source: "dapp",
        collectionAddress: collectionAddress,
        tokenId: tokenId,
        requestId: requestId as any,
        networkType: "L1X",
        site: _sender.origin,
        feeLimit: _message?.feeLimit,
        nonce: _message?.nonce,
        chainId: "1",
        rpc,
      };

      this.transactionHandler.initiateTransaction(
        requestId as any,
        transaction,
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

  async setL1XProvider(
    _message: ProviderAttrib,
    _sender: chrome.runtime.MessageSender,
    _sendResponse: (response: IServiceWorkerResponse) => void
  ) {
    try {
      const connectedSites =
        (await ExtensionStorage.get("connectedSites")) || [];
      const siteIndex = connectedSites.findIndex(
        (site) => site.url && site.url == _sender.origin
      );
      if (siteIndex >= 0) {
        connectedSites[siteIndex] = {
          ...connectedSites[siteIndex],
          l1xProviderConfig: {
            clusterType:
              _message.clusterType ||
              connectedSites[siteIndex].l1xProviderConfig.clusterType,
            endpoint:
              _message.endpoint ||
              connectedSites[siteIndex].l1xProviderConfig.endpoint,
          },
        };
        await ExtensionStorage.set("connectedSites", connectedSites);
      }
      return _sendResponse({
        status: "success",
        errorMessage: "",
        data: null,
      });
    } catch (error: any) {
      Logger.error(error);
      return {
        allowed: false,
        l1xProviderConfig: null,
      };
    }
  }

  signMessage(
    _message: any,
    _sender: chrome.runtime.MessageSender,
    _sendResponse: (response: IServiceWorkerResponse) => void
  ) {
    try {
      const requestId = Date.now();
      const url = `notification.html#sign-message?data=${encodeURIComponent(
        JSON.stringify({
          url: _sender.origin,
          favIcon: _sender.tab?.favIconUrl,
          appName: _sender.tab?.title,
          requestId,
          from: _message?.from,
          message: _message?.message,
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

  async signPayload(
    _message: ISignRequestProps,
    _sender: chrome.runtime.MessageSender,
    _sendResponse: (response: IServiceWorkerResponse) => void
  ) {
    try {
      const requestId = Date.now();
      await ExtensionStorage.set("payloadToSign", {
        url: _sender.origin || "",
        favIcon: _sender.tab?.favIconUrl || "",
        appName: _sender.tab?.title || "",
        requestId: requestId as any,
        from: _message?.from,
        payload: _message?.payload,
        clusterType: _message?.clusterType,
        endpoint: _message?.endpoint,
        message: _message?.message
      });
      const url = `notification.html#sign-payload`;
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

  async getAccountState(
    from: string,
    providerAttrib: ProviderAttrib = {
      clusterType: "mainnet",
      endpoint: "https://v2-mainnet-rpc.l1x.foundation",
    }
  ) {
    try {
      const provider = new L1XProvider(providerAttrib);
      const accountState = await provider.core.getAccountState({
        address: Util.removePrefixOx(from),
      });
      return accountState;
    } catch (error: any) {
      throw error;
    }
  }

  async estimateFee<K extends keyof L1XVMTransaction>(
    transaction: EstimateFeelimitArg<K>,
    providerAttrib: ProviderAttrib = {
      clusterType: "mainnet",
      endpoint: "https://v2-mainnet-rpc.l1x.foundation",
    }
  ) {
    const provider = new L1XProvider(providerAttrib);
    const estimatedFee = await provider.core.estimateFeelimit(transaction);
    return estimatedFee;
  }
}
