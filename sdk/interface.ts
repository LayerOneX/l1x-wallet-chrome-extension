import { GetAccountStateResponse, ProviderAttrib } from "@l1x/l1x-wallet-sdk";
import { IServiceWorkerResponse } from "../service_worker/index.interface";

/**
 * Enum for wallet events.
 */
export const XWalletEvent = {
  CONNECT: "CONNECT",
  DISCONNECT: "DISCONNECT",
  ACCOUNT_CHANGED: "ACCOUNT_CHANGED",
  UNINSTALL: "UNINSTALL",
};

/**
 * Interface for SDK transaction configuration.
 */
export interface ISDKTransactionConfig {
  /**
   * @description Fee limit should be in decimal format. e.g. 1 L1X = 1000000000000000000
   */
  feeLimit?: string;

  /**
   * @description Custom nonce value
   */
  nonce?: string;
}

/**
 * Interface for SDK request call.
 */
export interface ISDKRequestCall extends ISDKTransactionConfig {
  /**
   * @description L1X VM contract address
   */
  contractAddress: string;

  /**
   * @description Function name to call
   */
  functionName: string;

  /**
   * @description Arguments for the function call
   */
  args: any;
}

/**
 * Interface for SDK send transaction.
 */
export interface ISDKSendTransaction extends ISDKTransactionConfig {
  /**
   * The user's active address.
   */
  from: string;

  /**
   * @description L1X VM contract address
   */
  contractAddress: string;

  /**
   * @description Function name to call
   */
  functionName: string;

  /**
   * @description Arguments for the function call
   */
  args: any;
}

/**
 * Interface for SDK initialize contract.
 */
export interface ISDKInitContract extends ISDKTransactionConfig {
  /**
   * The user's active address.
   */
  from: string;

  /**
   * @description L1X VM base contract address
   */
  baseContractAddress: string;

  /**
   * @description Arguments for the function call
   */
  args: any;
}

/**
 * Interface for SDK sign message.
 */
export interface ISDKSignMessage {
  /**
   * @description The user's active address.
   */
  from?: string;

  /**
   * @description Message to be signed.
   */
  message: string;
}

/**
 * Interface for SDK sign payload.
 */
export interface ISDKSignPayload {
  /**
   * @description The user's active address.
   */
  from?: string;

  /**
   * @description Payload to be signed.
   */
  payload: string;
}

/**
 * Interface for SDK transfer.
 */
export interface ISDKTransfer extends ISDKTransactionConfig {
  /**
   * @description Receiver address
   */
  receiver: string;

  /**
   * @description Amount in decimalized units
   */
  value: number;

  /**
   * The user's active address.
   */
  from: string;

  /**
   * If present then transaction will return sign payload for transfer
   */
  responseType?: "SIGNATURE";
}

/**
 * Interface for SDK transfer token.
 */
export interface ISDKTransferToken extends ISDKTransactionConfig {
  /**
   * The user's active address.
   */
  from: string;

  /**
   * @description Fungible token contract address
   */
  tokenAddress: string;

  /**
   * @description Receiver address
   */
  receiver: string;

  /**
   * @description Decimalized value to be transferred
   */
  value: number;
}

/**
 * Interface for SDK transfer NFT.
 */
export interface ISDKTransferNFT extends ISDKTransactionConfig {
  /**
   * The user's active address.
   */
  from: string;

  /**
   * @description Collection contract address for non-fungible token
   */
  collectionAddress: string;

  /**
   * @description Token ID
   */
  tokenId: string;

  /**
   * @description Receiver address
   */
  receiver: string;

  /**
   * @description Decimalized value
   */
  value: number;
}

/**
 * Interface for XWallet API.
 */
export interface IXWalletAPI {
  extensionId: string;

  /**
   * Returns web app connection status with the wallet
   * @returns {Promise<IServiceWorkerResponse>} Promise that resolves with the connection status.
   */
  isConnected(): Promise<IServiceWorkerResponse>;

  /**
   * @description Send connect request to the wallet.
   * @param providerAttrib Provider attributes
   * @returns {Promise<IServiceWorkerResponse>} Promise that resolves connection status
   */
  connect(providerAttrib: ProviderAttrib): Promise<IServiceWorkerResponse>;

  /**
   * @description Disconnect site from wallet
   * @returns {@link Promise<IServiceWorkerResponse>} Promise that resolves the disconnection status.
   */
  disconnect(): Promise<IServiceWorkerResponse>;

  /**
   * @description Transfer L1X coin to the address
   * @param transaction Transfer transaction details
   * @returns {@link Promise<IServiceWorkerResponse>} Promise that resolves status of transaction
   */
  transfer(transaction: ISDKTransfer): Promise<IServiceWorkerResponse>;

  /**
   * @description Transfer fungible token to the address
   * @param transaction Transfer token transaction details
   * @returns {@link Promise<IServiceWorkerResponse>} Promise that resolves status of transaction
   */
  transferTokens(
    transaction: ISDKTransferToken
  ): Promise<IServiceWorkerResponse>;

  /**
   * @description Transfer non-fungible token to address
   * @param transaction Transfer NFT transaction details
   * @returns {@link Promise<IServiceWorkerResponse>} Promise that resolves status of transaction
   */
  transferNFT(transaction: ISDKTransferNFT): Promise<IServiceWorkerResponse>;

  /**
   * @description Make read contract call to the L1X virtual machine
   * @param transaction Request call transaction details
   * @returns {@link Promise<any>} Promise that resolves smart contract response
   */
  makeRequestCall(transaction: ISDKRequestCall): Promise<any>;

  /**
   * @description Returns balance of active account of wallet
   * @returns {@link Promise<GetAccountStateResponse>} Promise that resolves with the account state.
   */
  getConnectedAccounts(): Promise<GetAccountStateResponse>;

  /**
   * Send transaction to the L1X virtual machine
   * @param transaction Send transaction details
   * @returns {Promise<IServiceWorkerResponse<{ hash: string }>>} Promise that resolves transaction response
   */
  sendTransaction(
    transaction: ISDKSendTransaction
  ): Promise<IServiceWorkerResponse<{ hash: string }>>;

  /**
   * Initialize contract on the L1X virtual machine
   * @param transaction Initialize contract transaction details
   * @returns {Promise<IServiceWorkerResponse<{ contractAddress: string; hash: string }>>} Promise that resolves contract initialization response
   */
  initContract(
    transaction: ISDKInitContract
  ): Promise<IServiceWorkerResponse<{ contractAddress: string; hash: string }>>;

  /**
   * @description Updates the extension ID after script loads. Not accessible from BOM.
   * @returns {Promise<IServiceWorkerResponse>} Promise that resolves the status.
   */
  getProviderConfig(): Promise<IServiceWorkerResponse>;

  /**
   * @description Set L1XProvider configuration
   * @param config Provider attributes
   * @returns {@link Promise<IServiceWorkerResponse>} Promise that resolves status
   */
  setProviderConfig(config: ProviderAttrib): Promise<IServiceWorkerResponse>;

  /**
   * Sign message with the wallet
   * @param payload Sign message payload
   * @returns {Promise<string>} Promise that resolves signed message
   */
  signMessage(payload: ISDKSignMessage): Promise<string>;

  /**
   * Sign payload with the wallet
   * @param payload Sign payload
   * @returns {Promise<string>} Promise that resolves signed payload
   */
  signPayload(payload: ISDKSignPayload): Promise<string>;

  /**
   * Add event listener
   * @param event Event name.
   * @param listener Event listener function.
   */
  addEventListener(event: string, listener: () => void): void;

  /**
   * remove event listener
   * @param event Event name.
   * @param listener Event listener function.
   */
  removeEventListener(event: string, listener: () => void): void;

  /**
   * remove all xwallet event listeners
   */
  removeAllEventListener(): void;

  /**
   * return account balance for connected address
   * @param args
   */
  getAccountState(args: {
    from: string;
  }): Promise<IServiceWorkerResponse<GetAccountStateResponse>>;
}
