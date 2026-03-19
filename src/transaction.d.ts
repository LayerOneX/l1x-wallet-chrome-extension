interface ITransaction {
  id: string;
  timestamp: number;
  source: "extension" | "dapp";
  type:
    | "transfer-native-token"
    | "transfer-token"
    | "transfer-nft"
    | "state-change-call"
    | "init-contract"
    | "sign-tx-payload"
    | "evm-dapp-transaction";
  site?: string;
  siteFavIcon?: string;
  hash?: string;
  requestId?: string;
  networkType: IXWalletAccount["type"];
  feeLimit?: string;
  nonce?: string;
  from: string;
  chainId: string;
  rpc: string;
  txStatus?: "pending" | "confirmed" | "failed";
}

interface ITransferNativeToken extends ITransaction {
  type: "transfer-native-token";
  to: string;
  amount: string;
  symbol: string;
  decimals?: number;
  responseType?: "SIGNATURE";
}

interface ITransferToken extends ITransaction {
  type: "transfer-token";
  to: string;
  amount: string;
  tokenAddress: string;
  symbol?: string;
  decimals?: number;
}

interface ITransferNFT extends ITransaction {
  type: "transfer-nft";
  to: string;
  collectionAddress: string;
  tokenId: string;
  amount: number;
}

interface IStateChangeCall extends ITransaction {
  type: "state-change-call";
  contractAddress: string;
  functionName: string;
  arguments: any;
}

interface IInitContract extends ITransaction {
  type: "init-contract";
  baseContractAddress: string;
  arguments: any;
}

interface IEVMDappTransaction extends ITransaction {
  type: "evm-dapp-transaction";
  to: string;
  value: string;
  data: string;
  gas?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  chainId: string;
  rpcUrl: string;
  sdkRequestId?: string;
}

type Transaction =
  | IStateChangeCall
  | ITransferNFT
  | ITransferToken
  | ITransferNativeToken
  | IInitContract
  | IEVMDappTransaction;
