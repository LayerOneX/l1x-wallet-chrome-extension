// EIP-1193 Provider Types
// https://eips.ethereum.org/EIPS/eip-1193

export interface EIP1193RequestArgs {
  method: string;
  params?: any[] | Record<string, any>;
}

export interface EIP1193Provider {
  request(args: EIP1193RequestArgs): Promise<any>;
  on(event: string, listener: (...args: any[]) => void): void;
  removeListener(event: string, listener: (...args: any[]) => void): void;
}

// EIP-1193 Error Codes
export enum EIP1193ErrorCode {
  USER_REJECTED = 4001,
  UNAUTHORIZED = 4100,
  UNSUPPORTED_METHOD = 4200,
  DISCONNECTED = 4900,
  CHAIN_DISCONNECTED = 4901,
  UNRECOGNIZED_CHAIN = 4902,
}

export class ProviderRpcError extends Error {
  code: number;
  data?: any;

  constructor(code: number, message: string, data?: any) {
    super(message);
    this.code = code;
    this.data = data;
    this.name = "ProviderRpcError";
  }
}

// EIP-6963: Multi Injected Provider Discovery
// https://eips.ethereum.org/EIPS/eip-6963

export interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

export interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: EIP1193Provider;
}

// JSON-RPC types
export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: number;
  method: string;
  params?: any[];
}

export interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

// Sensitive methods that require service worker / popup approval
export const SENSITIVE_METHODS = new Set([
  "eth_requestAccounts",
  "eth_sendTransaction",
  "personal_sign",
  // "eth_sign" — DISABLED for security (blind signing risk)
  "eth_signTypedData",
  "eth_signTypedData_v3",
  "eth_signTypedData_v4",
  "wallet_switchEthereumChain",
  "wallet_addEthereumChain",
  "wallet_requestPermissions",
  "wallet_revokePermissions",
]);

// Methods handled locally by the provider (no RPC or service worker call)
export const LOCAL_METHODS = new Set([
  "eth_accounts",
  "eth_coinbase",
  "eth_chainId",
  "net_version",
  "net_listening",
  "net_peerCount",
  "web3_clientVersion",
  "eth_syncing",
  "eth_mining",
  "wallet_getPermissions",
  "wallet_getSnaps",
  "eth_sendRawTransaction",
]);

// EVM Chain configuration
export interface EVMChainConfig {
  chainId: string; // hex
  chainIdDecimal: number;
  name: string;
  symbol: string;
  rpcUrl: string;
  explorerUrl: string;
  icon?: string;
}

// Default supported chains
export const EVM_CHAINS: Record<string, EVMChainConfig> = {
  "0x1": {
    chainId: "0x1",
    chainIdDecimal: 1,
    name: "Ethereum",
    symbol: "ETH",
    rpcUrl: "https://eth.api.onfinality.io/public",
    explorerUrl: "https://etherscan.io",
  },
  "0x89": {
    chainId: "0x89",
    chainIdDecimal: 137,
    name: "Polygon",
    symbol: "MATIC",
    rpcUrl: "https://rpc-mainnet.matic.quiknode.pro",
    explorerUrl: "https://polygonscan.com",
  },
  "0x38": {
    chainId: "0x38",
    chainIdDecimal: 56,
    name: "BNB Smart Chain",
    symbol: "BNB",
    rpcUrl: "https://bsc-dataseed.bnbchain.org",
    explorerUrl: "https://bscscan.com",
  },
  "0xa86a": {
    chainId: "0xa86a",
    chainIdDecimal: 43114,
    name: "Avalanche",
    symbol: "AVAX",
    rpcUrl: "https://api.avax.network/ext/bc/C/rpc",
    explorerUrl: "https://snowtrace.io",
  },
  "0xa": {
    chainId: "0xa",
    chainIdDecimal: 10,
    name: "Optimism",
    symbol: "ETH",
    rpcUrl: "https://mainnet.optimism.io/",
    explorerUrl: "https://optimistic.etherscan.io",
  },
  "0x42a": {
    chainId: "0x42a",
    chainIdDecimal: 1066,
    name: "L1X Mainnet",
    symbol: "L1X",
    rpcUrl: "https://v2-mainnet-rpc.l1x.foundation",
    explorerUrl: "https://explorer.l1xapp.com/tx/",
  },
};
