declare global {
  type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
  type VirtualMachineType = "L1X" | "EVM" | "NON-EVM";
  type L1XAccounts = {
    [key in VirtualMachineType]: IXWalletAccount[];
  } & {
    ACTIVE: IXWalletAccount | null;
  };
  interface Window {
    L1X: XWalletAPI;
  }

  interface IVirtualMachineItem {
    id: number;
    name: VirtualMachineType;
    icon: string;
  }

  interface IXWalletAccount {
    privateKey: string;
    publicKey: string;
    accountName: string;
    type: VirtualMachineType;
    createdAt: number;
    icon: string;
  }

  interface IConnectedSite {
    url: string;
    favIcon: string;
    connectedAt: number;
    permissions: [];
    l1xProviderConfig: {
      clusterType: string;
      endpoint: string;
    };
    accounts: string[];
  }

  interface IExtensionStorage {
    wallets: L1XAccounts;
    mnemonic: string;
    lastWalletUnlocked: number;
    activeNetwork: IVMChain;
    activeEnvironment: string;
    login: { email: string; password: string };
    transactions: Transaction[];
    pendingTransactions: Transaction[];
    connectedSites: IConnectedSite[];
    payloadToSign: ISignRequestProps;
  }

  interface IApplicationStorage {
    l1XTokens: IToken[];
    [k: `token-${string}-${string}-${string}`]: IToken[]; // for imported token list; format - token-publickey-chainSymbol-rpc
    [k: `nft-${string}-${string}-${string}`]: { [k: string]: INFTCollection }; // for imported token list; format - nft-publickey-chainSymbol-rpc
  }

  interface IVMChain {
    icon: string;
    name: string;
    symbol: string;
    rpc: string;
    chainId: number;
    nativeToken: IToken;
    exploreruri: string;
    environment: {
      Mainnet: {
        rpc: string;
        exploreruri: string;
      };
      [name: string]: {
        rpc: string;
        exploreruri: string;
      };
    };
  }

  interface IToken {
    name: string;
    symbol: string;
    decimals: number;
    total_supply: number;
    balance: number;
    tokenAddress: string;
    icon: string;
    isNative: boolean;
    usdRate: number;
  }

  interface INFTCollection {
    contractAddress: string;
    name: string;
    icon: string;
    symbol: string;
    nftList: INFT[];
  }

  interface INFT {
    name: string;
    icon: string;
    collectionAddress: string;
    tokenId: string;
  }

  interface IFeeEstimateTransaction {
    type: "TOKEN" | "TRASFER" | "NFT";
    [k: string]: any;
  }

  interface ISignRequestProps {
    url: string;
    favIcon: string;
    requestId: string;
    appName: string;
    clusterType: string;
    endpoint: string;
    payload: string | object;
    from: string;
  }
  interface IVirtualMachine {
    networkType: VirtualMachineType;
    getProvider(
      providerAttrib?: any
    ): JsonRpcProvider | L1XProvider | Connection;
    icon: string;
    chains: IVMChain[];
    activeNetwork: IVMChain;
    convertToDecimals(value: number, decimals?: number): string;
    formatDecimals(value: number, decimals?: number): string;
    changeActiveNetwork(network: IVMChain): Promise<void>;
    createAccount(accountName: string): Promise<boolean>;
    updateAccountName(account: IXWalletAccount): Promise<void>;
    importPrivateKey(privateKey: string, accountName: string): Promise<boolean>;
    importToken(_tokenAddress: string): Promise<boolean>;
    importNFT(
      _collectionAddress: string,
      _tokenId: string,
      _walletAddress: string
    ): Promise<boolean>;
    listToken(): Promise<IToken[]>;
    listNFT(): Promise<INFT[]>;
    getNativeTokenDetails(providerAttrib?: any): Promise<IToken>;
    getTokenDetails(
      _tokenAddress: string,
      providerAttrib?: any
    ): Promise<IToken>;
    getNFTDetails(
      collectionAddress: string,
      tokenId: string,
      providerAttrib?: any
    ): Promise<INFT>;
    isOwnedNFT(
      collectionAddress: string,
      tokenId: string,
      walletAddress: string,
      providerAttrib?: any
    ): Promise<boolean>;
    transferNativeToken(
      receiverAddress: string,
      amount: number,
      privateKey: string,
      providerAttrib?: any,
      feeLimit?: string,
      nonce?: string
    ): Promise<{ hash: string }>;
    transferToken(
      tokenAddress: string,
      receiverAddress: string,
      amount: number,
      privateKey: string,
      providerAttrib?: any,
      feeLimit?: string,
      nonce?: string
    ): Promise<{ hash: string }>;
    approveNFTTransfer(
      collectionAddress: string,
      tokenId: string,
      privateKey: string,
      providerAttrib?: any,
      feeLimit?: number
    ): Promise<boolean>;
    transferNFT(
      collectionAddress: string,
      tokenId: string,
      receiverAddress: string,
      privateKey: string,
      providerAttrib?: any,
      feeLimit?: string,
      nonce?: string
    ): Promise<{ hash: string }>;
    initiateTransaction(transaction: Transaction): Promise<void>;
    addTransaction(transaction: Transaction, rpc?: string): Promise<boolean>;
    removePendingTransaction(id: string): Promise<boolean>;
    listTransactions(): Promise<Transaction[]>;
    getTransactionReceipt(
      hash: string
    ): Promise<TransactionReceipt | GetTransactionReceiptResponse>;
    getEstimateFee(
      providerAttrib?: any,
      transactionAttr?: IFeeEstimateTransaction
    ): Promise<string>;
    getCurrentNonce(providerAttrib?: any): Promise<string>;
    signMessage(message: string, providerAttrib?: any): Promise<string>;
    clone(): IVirtualMachine;
  }
}
export {};
