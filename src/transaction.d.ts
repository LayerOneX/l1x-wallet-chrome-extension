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
    | "sign-tx-payload";
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
}

interface ITransferNativeToken extends ITransaction {
  type: "transfer-native-token";
  to: string;
  amount: string;
  symbol: string;
  responseType?: "SIGNATURE";
}

interface ITransferToken extends ITransaction {
  type: "transfer-token";
  to: string;
  amount: string;
  tokenAddress: string;
  symbol?: string;
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

type Transaction =
  | IStateChangeCall
  | ITransferNFT
  | ITransferToken
  | ITransferNativeToken
  | IInitContract;
