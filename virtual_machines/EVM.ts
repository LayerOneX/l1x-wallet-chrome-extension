import VirtualMachine from "./VirtualMachine";
import ethIcon from "@assets/images/ethereum.svg";
import maticIcon from "@assets/images/matic.svg";
import bscIcon from "@assets/images/binance.svg";
import avaxIcon from "@assets/images/avalanche.svg";
import opmIcon from "@assets/images/optimism.svg";
import arbIcon from "@assets/images/arbitrum.png";
import baseIcon from "@assets/images/base.svg";
import l1xIcon from "@assets/images/L1X_icon.png";

import { ApplicationStorage } from "@util/ApplicationStorage.util";
import { ethers, JsonRpcProvider, Contract, Interface } from "ethers";
import ERC20ABI from "@abi/ERC20.json";
import ERC721ABI from "@abi/ERC721.json";
import { Config } from "@util/Config.util";
import evmIcon from "@assets/images/evm.svg";
import { Logger } from "@util/Logger.util";
import { Util } from "@util/Util";
import { ExtensionStorage } from "@util/ExtensionStorage.util";
import { Buffer } from "buffer";

const TW_CDN = "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains";

// Map chainId → TrustWallet CDN chain folder name
// Using chainId avoids symbol collisions (e.g. Base and Ethereum both use "ETH")
const TW_CHAIN_MAP: Record<number, string> = {
  // ✅ Your existing entries
  1: "ethereum",
  56: "smartchain",
  137: "polygon",
  43114: "avalanchec",
  10: "optimism",
  8453: "base",
  42161: "arbitrum",
  250: "fantom",
  100: "xdai",
  25: "cronos",
  1284: "moonbeam",
  1285: "moonriver",

  // 🔴 Mainnets to add
  42220: "celo",
  1666600000: "harmony",
  1088: "metis",
  1101: "polygonzkevm",
  324: "zksync",
  59144: "linea",
  534352: "scroll",
  5000: "mantle",
  204: "opbnb",
  1116: "coredao",
  7700: "canto",
  2222: "kava",
  1313161554: "aurora",  // Aurora (NEAR EVM)
  1234: "step",
  40: "telos",
  2000: "dogechain",
  288: "boba",
  1818: "cube",
  66: "okxchain",
  128: "heco",           // Huobi ECO Chain
  321: "kcc",            // KuCoin Chain
  88: "tomochain",
  19: "songbird",
  14: "flare",
  9001: "evmos",
  2001: "milkomeda",
  106: "velas",
  820: "callisto",
  70: "hoo",
  32659: "fusion",

  // 🟠 Testnets
  5: "goerli",
  11155111: "sepolia",
  80001: "mumbai",       // Polygon Mumbai
  97: "bsctestnet",
  421613: "arbitrumgoerli",
  420: "optimismgoerli",
  43113: "fuji",         // Avalanche Fuji (fixed duplicate)
  84531: "basegoerli",
  59140: "lineagoerli",
  1442: "polygonzkevmtestnet",
};

function getTrustWalletIcon(chainId: number, checksumAddress: string): string {
  const twChain = TW_CHAIN_MAP[chainId];
  if (!twChain) return "";
  return `${TW_CDN}/${twChain}/assets/${checksumAddress}/logo.png`;
}

// ── listToken() in-memory cache (30s TTL) ──
const LIST_TOKEN_CACHE = new Map<string, { tokens: IToken[]; expiresAt: number }>();
const LIST_TOKEN_CACHE_TTL = 60_000; // 60s — balances refresh on visibility change

export function clearListTokenCache() {
  LIST_TOKEN_CACHE.clear();
}

export const EVM_CHAINS: IVMChain[] = [
  {
    name: "Layer One X",
    symbol: "L1X",
    icon: l1xIcon,
    rpc: Config.rpc.l1x,
    chainId: Config.chainId.l1x,
    exploreruri: Config.explorer.l1x,
    nativeToken: {
      name: "Layer One X",
      symbol: "L1X",
      decimals: 18,
      total_supply: 0,
      balance: 0,
      tokenAddress: "",
      icon: l1xIcon,
      isNative: true,
      usdRate: 0,
    },
    environment: {
      Mainnet: {
        rpc: Config.rpc.l1x,
        exploreruri: Config.explorer.l1x
      }
    }
  },
  {
    name: "Ethereum",
    symbol: "ETH",
    icon: ethIcon,
    rpc: Config.rpc.ethereum,
    chainId: Config.chainId.ethereum,
    exploreruri: "https://etherscan.io/tx/",
    nativeToken: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
      total_supply: 0,
      balance: 0,
      tokenAddress: "",
      icon: ethIcon,
      isNative: true,
      usdRate: 0,
    },
    environment: {
      Mainnet: {
        rpc: Config.rpc.ethereum,
        exploreruri: "https://etherscan.io/tx/"
      }
    }
  },
  {
    name: "Polygon",
    symbol: "MATIC",
    icon: maticIcon,
    rpc: Config.rpc.polygon,
    chainId: Config.chainId.polygon,
    exploreruri: "https://polygonscan.com/tx/",
    nativeToken: {
      name: "Polygon",
      symbol: "MATIC",
      decimals: 18,
      total_supply: 0,
      balance: 0,
      tokenAddress: "",
      icon: maticIcon,
      isNative: true,
      usdRate: 0,
    },
    environment: {
      Mainnet: {
        rpc: Config.rpc.polygon,
        exploreruri: "https://polygonscan.com/tx/"
      }
    }
  },
  {
    name: "Binance",
    symbol: "BNB",
    icon: bscIcon,
    rpc: Config.rpc.binance,
    chainId: Config.chainId.binance,
    exploreruri: "https://bscscan.com/tx/",
    nativeToken: {
      name: "Binance",
      symbol: "BNB",
      decimals: 18,
      total_supply: 0,
      balance: 0,
      tokenAddress: "",
      icon: bscIcon,
      isNative: true,
      usdRate: 0,
    },
    environment: {
      Mainnet: {
        rpc: Config.rpc.binance,
        exploreruri: "https://bscscan.com/tx/"
      }
    }
  },
  {
    name: "Avalanche",
    symbol: "AVAX",
    icon: avaxIcon,
    rpc: Config.rpc.avalanche,
    chainId: Config.chainId.avalanche,
    exploreruri: "https://snowtrace.io/tx/",
    nativeToken: {
      name: "Avalanche",
      symbol: "AVAX",
      decimals: 18,
      total_supply: 0,
      balance: 0,
      tokenAddress: "",
      icon: avaxIcon,
      isNative: true,
      usdRate: 0,
    },
    environment: {
      Mainnet: {
        rpc: Config.rpc.avalanche,
        exploreruri: "https://snowtrace.io/tx/"
      }
    }
  },
  {
    name: "Optimism",
    symbol: "OP",
    icon: opmIcon,
    rpc: Config.rpc.optimisim,
    chainId: Config.chainId.optimisim,
    exploreruri: "https://optimistic.etherscan.io/tx/",
    nativeToken: {
      name: "Optimism",
      symbol: "OP",
      decimals: 18,
      total_supply: 0,
      balance: 0,
      tokenAddress: "",
      icon: opmIcon,
      isNative: true,
      usdRate: 0,
    },
    environment: {
      Mainnet: {
        rpc: Config.rpc.optimisim,
        exploreruri: "https://optimistic.etherscan.io/tx/"
      }
    }
  },
  {
    name: "Arbitrum One",
    symbol: "ARB",
    icon: arbIcon,
    rpc: Config.rpc.arbitrum,
    chainId: Config.chainId.arbitrum,
    exploreruri: "https://arbiscan.io/tx/",
    nativeToken: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
      total_supply: 0,
      balance: 0,
      tokenAddress: "",
      icon: arbIcon,
      isNative: true,
      usdRate: 0,
    },
    environment: {
      Mainnet: {
        rpc: Config.rpc.arbitrum,
        exploreruri: "https://arbiscan.io/tx/"
      }
    }
  },
  {
    name: "Base",
    symbol: "BASE",
    icon: baseIcon,
    rpc: Config.rpc.base,
    chainId: Config.chainId.base,
    exploreruri: "https://basescan.org/tx/",
    nativeToken: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
      total_supply: 0,
      balance: 0,
      tokenAddress: "",
      icon: baseIcon,
      isNative: true,
      usdRate: 0,
    },
    environment: {
      Mainnet: {
        rpc: Config.rpc.base,
        exploreruri: "https://basescan.org/tx/"
      }
    }
  },
];

// ── Custom networks + RPC overrides support ──
let _customChains: IVMChain[] = [];
let _rpcOverrides: Record<number, { rpc: string; exploreruri: string }> = {};

function applyOverrides(chains: IVMChain[]): IVMChain[] {
  if (!Object.keys(_rpcOverrides).length) return chains;
  return chains.map((c) => {
    const ov = _rpcOverrides[c.chainId];
    if (!ov) return c;
    return {
      ...c,
      rpc: ov.rpc,
      exploreruri: ov.exploreruri || c.exploreruri,
      environment: {
        ...c.environment,
        Mainnet: { rpc: ov.rpc, exploreruri: ov.exploreruri || c.environment.Mainnet.exploreruri },
      },
    };
  });
}

export function getAllEVMChains(): IVMChain[] {
  return [...applyOverrides(EVM_CHAINS), ..._customChains];
}

export async function loadCustomChains(): Promise<IVMChain[]> {
  _customChains = (await ExtensionStorage.get("customNetworks")) ?? [];
  _rpcOverrides = (await ExtensionStorage.get("networkRpcOverrides")) ?? {};
  return getAllEVMChains();
}

export function setCustomChains(chains: IVMChain[]) {
  _customChains = chains;
}

export function setRpcOverrides(overrides: Record<number, { rpc: string; exploreruri: string }>) {
  _rpcOverrides = overrides;
}

export default class EVM extends VirtualMachine {
  publicKey: string;
  icon: string = evmIcon;
  getProvider(_providerAttrib?: any) {
    // Use staticNetwork to skip auto-detection (avoids extra RPC calls + infinite retries on failure)
    const network = ethers.Network.from(this.activeNetwork.chainId);
    return new JsonRpcProvider(this.activeNetwork.rpc, network, {
      staticNetwork: network,
    });
  }
  constructor(
    networkType: VirtualMachineType,
    publicKey: string,
    chainId: string,
  ) {
    const allChains = getAllEVMChains();
    const activeChain =
      allChains.find((el) => el.chainId.toString() == chainId.toString()) ??
      allChains[0];
    super(networkType, allChains, activeChain);
    this.publicKey = publicKey;
  }

  async changeActiveNetwork(network: IVMChain) {
    this.chains = getAllEVMChains(); // refresh with latest RPC overrides
    return super.changeActiveNetwork(network);
  }

  async #validateNewAccount(
    wallets: L1XAccounts,
    accountName: string,
    publicKey: string,
    source: 'create' | 'import'
  ) {
    // do not import if name exists
    if (
      wallets.EVM.findIndex(
        (account) =>
          accountName.trim() && account.accountName == accountName.trim()
      ) >= 0
    ) {
      throw {
        errorMessage:
          "Account name already exist. Please try with different account name.",
      };
    }

    // do not import if wallet present
    const accountIndex = wallets.EVM.findIndex(
      (account) =>
        Util.removePrefixOx(account.publicKey.trim()) ==
        Util.removePrefixOx(publicKey.trim())
    )
    if (accountIndex >= 0) {
      if (source == 'create') {
        wallets.EVM[accountIndex].createdFromSeed = true;
        await this.updateAccount(wallets.EVM[accountIndex]);
      }
      throw {
        errorMessage:
          "Account already exist. Please try with different private key.",
      };
    }

    return true;
  }

  async importPrivateKey(
    privateKey: string,
    accountName: string,
    createdFromSeed?: boolean
  ): Promise<boolean> {
    try {
      if (!accountName) {
        throw {
          errormessage:
            "Invalid account name. Please try with valid account name.",
        };
      }
      const wallets: L1XAccounts = (await ExtensionStorage.get("wallets")) ?? {
        L1X: [],
        EVM: [],
        "NON-EVM": [],
        ACTIVE: null,
      };
      const evmWallet = new ethers.Wallet(privateKey);

      await this.#validateNewAccount(wallets, accountName, evmWallet.address, 'import');

      const newWallet: IXWalletAccount = {
        privateKey: privateKey,
        publicKey: evmWallet.address,
        accountName,
        type: "EVM",
        createdAt: Date.now(),
        icon: this.icon,
        createdFromSeed: createdFromSeed ?? false
      };
      wallets.EVM.push(newWallet);
      // set imported wallet as active wallet
      wallets.ACTIVE = newWallet;
      // save native token
      await this.saveNativeToken(evmWallet.address);
      // update wallets
      await ExtensionStorage.set("wallets", wallets);
      // update last login
      await ExtensionStorage.set("lastWalletUnlocked", Date.now());
      return true;
    } catch (error: any) {
      Logger.error(error);
      throw {
        errorMessage:
          error?.errorMessage ??
          "Invalid private key. Please try with valid private key.",
      };
    }
  }

  async createAccount(accountName: string): Promise<boolean> {
    try {
      window.Buffer = Buffer;
      const wallets: L1XAccounts = (await ExtensionStorage.get("wallets")) ?? {
        L1X: [],
        EVM: [],
        "NON-EVM": [],
        ACTIVE: null,
      };
      const pharse = await ExtensionStorage.get("mnemonic");
      if (pharse === null) {
        throw {
          body: { errorMessage: "Unable to create wallet. Invalid mnemonic." },
        };
      }
      const standardPath = "m/44'/60'/0'/0";
      const path = `${standardPath}/${wallets.EVM.filter(el => el.createdFromSeed == true).length}`;
      const hdNode = ethers.HDNodeWallet.fromPhrase(pharse);
      if (!hdNode || !hdNode.mnemonic) {
        throw { errorMessage: "Failed to create HD node wallet." };
      }
      const etherWallet = ethers.HDNodeWallet.fromMnemonic(
        hdNode.mnemonic,
        path
      );

      await this.#validateNewAccount(wallets, accountName, etherWallet.address, 'create');

      const newWallet: IXWalletAccount = {
        privateKey: etherWallet.privateKey,
        publicKey: etherWallet.address,
        accountName,
        type: "EVM",
        createdAt: Date.now(),
        icon: this.icon,
        createdFromSeed: true
      };
      // update class instance public key
      this.publicKey = etherWallet.address;
      // add new wallet
      wallets.EVM.push(newWallet);
      // change active wallet
      wallets.ACTIVE = newWallet;
      // save native tokens
      await this.saveNativeToken(this.publicKey);
      // update wallet accounts
      await ExtensionStorage.set("wallets", wallets);
      // update last account unlocked
      await ExtensionStorage.set("lastWalletUnlocked", Date.now());
      return true;
    } catch (error: any) {
      throw {
        errorMessage:
          error?.errorMessage ??
          "Invalid private key. Please try with valid private key.",
      };
    }
  }

  async importToken(tokenAddress: string) {
    try {
      console.log(" In EVM importToken tokenTableName", this.tokenTableName);
      let tokens = (await ApplicationStorage.get(this.tokenTableName)) ?? [];
      if (tokens.findIndex((el) => el.tokenAddress == tokenAddress) >= 0) {
        return true;
      }
      const contract = new ethers.Contract(
        tokenAddress,
        ERC20ABI.abi,
        this.getProvider()
      );
      // Use TrustWallet CDN for icon (no API call, no rate limits)
      let checksumAddr: string;
      try { checksumAddr = ethers.getAddress(tokenAddress); } catch { checksumAddr = tokenAddress; }
      const twIcon = getTrustWalletIcon(this.activeNetwork.chainId, checksumAddr);
      const token: IToken = {
        name: await contract.name(),
        symbol: await contract.symbol(),
        decimals: Number(await contract.decimals()),
        total_supply: Number(await contract.totalSupply()),
        balance: 0,
        tokenAddress,
        icon: twIcon || this.activeNetwork?.icon,
        isNative: false,
        usdRate: 0,
      };

      tokens.splice(1, 0, token);

      const tokenSaved = await ApplicationStorage.set(
        this.tokenTableName,
        tokens
      );
      return tokenSaved;
    } catch (error: any) {
      Logger.log(error);
      throw new Error(
        error?.customMsg ??
        "Failed to import token. Please enter valid token address."
      );
    }
  }

  async isOwnedNFT(
    collectionAddress: string,
    tokenId: string,
    walletAddress: string
  ) {
    try {
      const collectionContract = new ethers.Contract(
        collectionAddress,
        ERC721ABI.abi,
        this.getProvider()
      );
      const nftOwner = await collectionContract.ownerOf(tokenId);
      if (
        Util.removePrefixOx(nftOwner).toLowerCase() !=
        Util.removePrefixOx(walletAddress).toLowerCase()
      ) {
        return false;
      }
      return true;
    } catch (error) {
      Logger.error(error);
      throw {
        errorMessage: "Invalid owner. Please enter valid NFT details.",
      };
    }
  }

  async #fetch(uri: string) {
    return (await fetch(uri)).json();
  }

  async getNFTDetails(
    collectionAddress: string,
    tokenId: string
  ): Promise<INFT> {
    try {
      const collectionContract = new ethers.Contract(
        collectionAddress,
        ERC721ABI.abi,
        this.getProvider()
      );
      const tokenURI = await collectionContract.tokenURI(tokenId);
      // fetch metadata
      const nftMetadata = await this.#fetch(
        Util.filterIPFS(tokenURI)
      );
      return {
        name: nftMetadata?.name ?? "",
        icon: Util.filterIPFS(nftMetadata?.image) ?? "",
        collectionAddress,
        tokenId,
      };
    } catch (error: any) {
      Logger.error(error);
      throw {
        errorMessage:
          error?.errormessage ?? "Failed to get NFT details. Please try again.",
      };
    }
  }

  async importNFT(
    collectionAddress: string,
    tokenId: string,
    walletAddress: string
  ): Promise<boolean> {
    try {
      walletAddress = Util.add0xToString(walletAddress);
      const collectionContract = new ethers.Contract(
        collectionAddress,
        ERC721ABI.abi,
        this.getProvider()
      );
      const collectionList =
        (await ApplicationStorage.get(this.nftTableName)) ?? {};
      let collection = collectionList[collectionAddress];

      // check if nft already imported
      if (
        collection &&
        (collection.nftList || []).findIndex((nft) => nft.tokenId == tokenId) >=
        0
      ) {
        return true;
      }

      // validate nft
      const isnftowner = await this.isOwnedNFT(
        collectionAddress,
        tokenId,
        this.publicKey
      );
      if (!isnftowner) {
        throw {
          errorMessage: "Invalid nft owner. Please try with valid nft owner.",
        };
      }

      // add collection details if collection not present
      if (!collection) {
        collection = {
          contractAddress: collectionAddress,
          name: await collectionContract.name(),
          symbol: await collectionContract.symbol(),
          icon: evmIcon,
          nftList: [],
        };
      }
      // fetch nft details
      const nft = await this.getNFTDetails(collectionAddress, tokenId);
      // update active collection's nft list
      collection.nftList = [nft, ...collection.nftList];
      // update active collection
      collectionList[collectionAddress] = collection;
      return ApplicationStorage.set(this.nftTableName, collectionList);
    } catch (error: any) {
      Logger.error(error);
      throw {
        errorMessage:
          error?.errorMessage ?? "Failed to retrieve collection details.",
      };
    }
  }

  // Multicall3 is deployed at the same address on all major EVM chains
  static MULTICALL3 = "0xcA11bde05977b3631167028862bE2a173976CA11";
  static MULTICALL3_ABI = [
    "function aggregate3((address target, bool allowFailure, bytes callData)[] calls) view returns ((bool success, bytes returnData)[])",
    "function getEthBalance(address addr) view returns (uint256 balance)",
  ];
  static #multicallUnsupported = new Set<number>();

  async #batchFetchBalances(tokens: IToken[]): Promise<Map<string, number>> {
    const result = new Map<string, number>();
    const chainId = this.activeNetwork.chainId;

    // Skip multicall for chains known to not support it
    if (typeof chainId === "number" && EVM.#multicallUnsupported.has(chainId)) {
      return this.#fetchBalancesIndividually(tokens, result);
    }

    try {
      const provider = this.getProvider();
      const mc = new Contract(EVM.MULTICALL3, EVM.MULTICALL3_ABI, provider);
      const erc20Iface = new Interface(ERC20ABI.abi);

      const calls: { target: string; allowFailure: boolean; callData: string }[] = [];
      const tokenKeys: string[] = [];

      for (const token of tokens) {
        if (token.isNative) {
          calls.push({
            target: EVM.MULTICALL3,
            allowFailure: true,
            callData: mc.interface.encodeFunctionData("getEthBalance", [this.publicKey]),
          });
          tokenKeys.push("__native__");
        } else if (token.tokenAddress) {
          // Normalize address to valid checksum to prevent ethers v6 checksum errors
          let addr: string;
          try { addr = ethers.getAddress(token.tokenAddress); } catch { continue; }
          calls.push({
            target: addr,
            allowFailure: true,
            callData: erc20Iface.encodeFunctionData("balanceOf", [this.publicKey]),
          });
          tokenKeys.push(token.tokenAddress.toLowerCase());
        }
      }

      if (calls.length === 0) return result;

      console.log(`[Multicall3] chain=${chainId} batching ${calls.length} calls into 1 RPC call`);
      const results: { success: boolean; returnData: string }[] = await mc.aggregate3.staticCall(calls);

      for (let i = 0; i < results.length; i++) {
        const { success, returnData } = results[i];
        if (!success || returnData === "0x") {
          result.set(tokenKeys[i], 0);
          continue;
        }
        const token = tokens.find(
          (t) => t.isNative ? tokenKeys[i] === "__native__" : t.tokenAddress?.toLowerCase() === tokenKeys[i]
        );
        const decimals = token?.decimals && token.decimals > 0 ? token.decimals : 18;
        const balance = parseFloat(ethers.formatUnits(returnData, decimals));
        result.set(tokenKeys[i], balance);
      }

      return result;
    } catch (error) {
      // Mark this chain as unsupported for multicall and fallback
      if (typeof chainId === "number") {
        EVM.#multicallUnsupported.add(chainId);
      }
      console.warn(`[Multicall3] FAILED on chain=${chainId}, falling back to ${tokens.length} individual calls:`, error);
      return this.#fetchBalancesIndividually(tokens, result);
    }
  }

  async #fetchBalancesIndividually(tokens: IToken[], result: Map<string, number>): Promise<Map<string, number>> {
    await Promise.all(
      tokens.map(async (token) => {
        const key = token.isNative ? "__native__" : (token.tokenAddress?.toLowerCase() || "");
        const balance = token.isNative
          ? await this.#getNativeTokenBalance()
          : await this.#fetchTokenBalance(token.tokenAddress);
        result.set(key, balance);
      })
    );
    return result;
  }

  async #getNativeTokenBalance() {
    try {
      const balance = await this.getProvider().getBalance(this.publicKey);
      return +ethers.formatEther(balance);
    } catch (error) {
      return 0;
    }
  }

  async #fetchTokenBalance(tokenAddress: string) {
    try {
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ERC20ABI.abi,
        this.getProvider()
      );
      const balance = await tokenContract.balanceOf(this.publicKey);

      // Use cached decimals from stored tokens (constant metadata) — avoids 1 RPC call
      const storedTokens: IToken[] = (await ApplicationStorage.get(this.tokenTableName)) ?? [];
      const stored = storedTokens.find(
        (t) => t.tokenAddress?.toLowerCase() === tokenAddress.toLowerCase()
      );
      let decimals = stored?.decimals && stored.decimals > 0 ? stored.decimals : 0;
      if (!decimals) decimals = Number(await tokenContract.decimals());

      return parseFloat(ethers.formatUnits(balance, decimals));
    } catch (error) {
      return 0;
    }
  }

  // async listToken(): Promise<IToken[]> {
  //   let tokens = (await ApplicationStorage.get(this.tokenTableName)) ?? [];
  //   tokens = await Promise.all(
  //     tokens.map(async (token) => {
  //       const balance = token.isNative
  //         ? await this.#getNativeTokenBalance()
  //         : await this.#fetchTokenBalance(token.tokenAddress);
  //       const usdRate = await this.getTokenRate(token.symbol);
  //       return {
  //         ...token,
  //         balance: balance,
  //         usdRate: usdRate,
  //       };
  //     })
  //   );
  //   return tokens;
  // }

  async listToken(): Promise<IToken[]> {
    const cacheKey = this.tokenTableName;
    const cached = LIST_TOKEN_CACHE.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.tokens;
    }

    console.log(`[EVM.listToken] tableName=${this.tokenTableName} chain=${this.activeNetwork.name} chainId=${this.activeNetwork.chainId} rpc=${this.activeNetwork.rpc}`);
    let tokens = (await ApplicationStorage.get(this.tokenTableName)) ?? [];
    console.log(`[EVM.listToken] stored tokens=${tokens.length}`);

    // Ensure native token is present for this network
    if (!tokens.length) {
      await this.saveNativeToken(this.publicKey);
      tokens = (await ApplicationStorage.get(this.tokenTableName)) ?? [];
      console.log(`[EVM.listToken] after saveNativeToken tokens=${tokens.length}`);
    }

    // Seed default tokens only for built-in networks — custom networks show native token only
    // const isCustomNetwork = !EVM_CHAINS.some((c) => c.chainId === this.activeNetwork.chainId);
    // const defaultTokens = isCustomNetwork ? undefined : DEFAULT_TOKENS[this.activeNetwork.chainId];

    // // For custom networks: remove any previously auto-seeded ETH-mainnet default tokens from storage
    // if (isCustomNetwork) {
    //   const ethMainnetAddresses = new Set(
    //     (DEFAULT_TOKENS[1] ?? []).map((t) => t.address.toLowerCase())
    //   );
    //   const cleaned = tokens.filter(
    //     (t) => t.isNative || !ethMainnetAddresses.has(t.tokenAddress?.toLowerCase?.() ?? "")
    //   );
    //   if (cleaned.length !== tokens.length) {
    //     tokens = cleaned;
    //     await ApplicationStorage.set(this.tokenTableName, tokens);
    //   }
    // }

    // if (defaultTokens) {
    //   const existingAddresses = new Set(
    //     tokens
    //       .map((t) => t.tokenAddress?.toLowerCase?.())
    //       .filter((addr): addr is string => !!addr)
    //   );

    //   let changed = false;
    //   for (const dt of defaultTokens) {
    //     // Normalize address to valid checksum
    //     let checksumAddr: string;
    //     try { checksumAddr = ethers.getAddress(dt.address); } catch { continue; }
    //     const normalized = checksumAddr.toLowerCase();
    //     if (!existingAddresses.has(normalized)) {
    //       tokens.push({
    //         name: dt.name,
    //         symbol: dt.symbol,
    //         decimals: dt.decimals,
    //         tokenAddress: checksumAddr,
    //         icon: dt.icon,
    //         isNative: false,
    //         balance: 0,
    //         usdRate: 0,
    //         total_supply: 0,
    //       });
    //       existingAddresses.add(normalized);
    //       changed = true;
    //     } else {
    //       // Backfill decimals for existing tokens missing them
    //       const existing = tokens.find(
    //         (t) => t.tokenAddress?.toLowerCase() === normalized
    //       );
    //       if (existing && (!existing.decimals || existing.decimals <= 0)) {
    //         existing.decimals = dt.decimals;
    //         changed = true;
    //       }
    //     }
    //   }

    //   if (changed) {
    //     await ApplicationStorage.set(this.tokenTableName, tokens);
    //   }
    // }

    // Batch fetch all balances via Multicall3 (1 RPC call per chain)
    console.log(`[EVM.listToken] chain=${this.activeNetwork.symbol} tokens=${tokens.length} calling batchFetchBalances`);
    const balanceMap = await this.#batchFetchBalances(tokens);

    // Batch fetch all USD rates from price proxy (1 HTTP call, includes L1X/WL1X)
    const symbols = tokens.map((t) => t.symbol);
    const rateMap = await this.getTokenRatesBatch(symbols);

    tokens = tokens.map((token) => {
      const key = token.isNative ? "__native__" : (token.tokenAddress?.toLowerCase() || "");
      return {
        ...token,
        balance: balanceMap.get(key) ?? token.balance ?? 0,
        usdRate: rateMap[token.symbol.toUpperCase()] ?? 0,
      };
    });

    // Cache result
    LIST_TOKEN_CACHE.set(cacheKey, { tokens, expiresAt: Date.now() + LIST_TOKEN_CACHE_TTL });
    return tokens;
  }

  async listNFT(): Promise<INFT[]> {
    const collectionList =
      (await ApplicationStorage.get(this.nftTableName)) ?? {};
    return Object.values(collectionList)
      .map((collection) => collection.nftList)
      .flat();
  }

  async getNativeTokenDetails(): Promise<IToken> {
    const usdRate = await this.getTokenRate(
      this.activeNetwork.nativeToken.symbol
    );
    const balance = await this.#getNativeTokenBalance();
    return {
      ...this.activeNetwork.nativeToken,
      balance: balance,
      usdRate: usdRate,
    };
  }

  async getTokenDetails(tokenAddress: string): Promise<IToken> {
    try {
      const normalized = tokenAddress.toLowerCase();

      // Check stored tokens first — metadata (name, symbol, decimals, icon) is constant
      const storedTokens: IToken[] = (await ApplicationStorage.get(this.tokenTableName)) ?? [];
      const cached = storedTokens.find(
        (t) => t.tokenAddress?.toLowerCase() === normalized
      );

      if (cached && cached.symbol && cached.decimals && cached.decimals > 0) {
        // Only refresh balance and rate — skip 5 RPC calls for metadata
        const [balance, usdRate] = await Promise.all([
          this.#fetchTokenBalance(tokenAddress),
          this.getTokenRate(cached.symbol),
        ]);
        return { ...cached, balance, usdRate };
      }

      // Not in storage — fetch metadata from RPC (first time only)
      const contract = new ethers.Contract(
        tokenAddress,
        ERC20ABI.abi,
        this.getProvider()
      );
      const [symbol, name, decimals, totalSupply, balance] = await Promise.all([
        contract.symbol(),
        contract.name(),
        contract.decimals(),
        contract.totalSupply(),
        this.#fetchTokenBalance(tokenAddress),
      ]);
      const usdRate = await this.getTokenRate(symbol);
      // Use TrustWallet CDN for icon (no API call)
      let checksumAddr2: string;
      try { checksumAddr2 = ethers.getAddress(tokenAddress); } catch { checksumAddr2 = tokenAddress; }
      const twIcon2 = getTrustWalletIcon(this.activeNetwork.chainId, checksumAddr2);
      const tokenDetails: IToken = {
        name,
        symbol,
        decimals: Number(decimals),
        total_supply: Number(totalSupply),
        balance,
        tokenAddress,
        icon: twIcon2 || this.activeNetwork?.icon,
        isNative: false,
        usdRate,
      };

      return tokenDetails;
    } catch (error) {
      Logger.error(error);
      return {
        name: "",
        symbol: "",
        decimals: 0,
        total_supply: 0,
        balance: 0,
        tokenAddress: "",
        icon: "",
        isNative: false,
        usdRate: 0,
      };
    }
  }

  clone(): VirtualMachine {
    return new EVM(
      this.networkType,
      this.publicKey,
      this.activeNetwork.chainId.toString()
    );
  }

  async transferNativeToken(
    receiverAddress: string,
    amountInWei: number, // value must me in decimal places
    privateKey: string,
    providerAttrib: any
  ) {
    try {
      const wallet = new ethers.Wallet(
        privateKey,
        this.getProvider(providerAttrib)
      );
      const provider = this.getProvider(providerAttrib);
      const feeData = await provider.getFeeData();
      const nonce = await provider.getTransactionCount(this.publicKey, "latest");
      const estimatedGas = await provider.estimateGas({
        from: this.publicKey,
        to: receiverAddress,
        value: amountInWei.toString(),
      });
      const tx = {
        to: receiverAddress,
        value: amountInWei.toString(),
        gasLimit: estimatedGas,
        maxFeePerGas: feeData.maxFeePerGas,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
        nonce,
      };
      const transaction = await wallet.sendTransaction(tx);
      await transaction.wait();
      return {
        hash: transaction.hash,
      };
    } catch (error: any) {
      Logger.error(error);
      throw {
        errorMessage:
          error?.errorMessage ?? EVM.parseRpcError(error, "Failed to transfer token. Please try again."),
      };
    }
  }

  /**
   * Extract a user-friendly message from an Ethers.js / RPC error.
   * Falls back to `fallback` when the error shape is unrecognised.
   */
  static parseRpcError(error: any, fallback: string): string {
    if (!error) return fallback;
    // Ethers v6 wraps RPC errors
    const reason: string | undefined =
      error.shortMessage ?? error.reason ?? error.message;
    if (reason) {
      const lower = reason.toLowerCase();
      if (lower.includes("insufficient funds") || lower.includes("exceeds balance")) {
        return "Insufficient balance.";
      }
      if (lower.includes("nonce") && lower.includes("too low")) {
        return "Transaction nonce conflict. Please try again.";
      }
      if (
        lower.includes("could not detect network") ||
        lower.includes("failed to fetch") ||
        lower.includes("network error") ||
        lower.includes("econnrefused") ||
        lower.includes("timeout") ||
        lower.includes("enotfound") ||
        lower.includes("502") ||
        lower.includes("503")
      ) {
        return "RPC connection failed. Consider switching the RPC in Settings > Networks.";
      }
      if (lower.includes("execution reverted")) {
        return "Transaction reverted by contract. Please verify the transaction details.";
      }
      if (lower.includes("replacement fee too low") || lower.includes("underpriced")) {
        return "Gas fee too low. Please try again with higher gas.";
      }
    }
    return fallback;
  }

  async transferToken(
    tokenAddress: string,
    receiverAddress: string,
    amountInWei: number, // value must me in decimal places
    privateKey: string,
    _providerAttrib: any,
    feeLimit?: string,
    nonce?: string
  ) {
    try {
      const tokenDetails = await this.getTokenDetails(tokenAddress);
      if (!tokenDetails || !tokenDetails.symbol) {
        throw {
          errorMessage:
            "Invalid token address. Please try with valid token address.",
        };
      }
      const amount = amountInWei / 10 ** tokenDetails.decimals;
      if (tokenDetails.balance < amount) {
        throw {
          errorMessage: "Insufficient balance.",
        };
      }
      const signer = new ethers.Wallet(
        privateKey,
        this.getProvider(_providerAttrib)
      );
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ERC20ABI.abi,
        signer
      );
      const data = tokenContract.interface.encodeFunctionData("transfer", [
        receiverAddress,
        amountInWei.toString(),
      ]);
      const txParams: any = {
        to: tokenContract,
        data: data,
        from: signer.address,
        nonce: nonce ? +nonce : undefined,
      };
      if (feeLimit) {
        txParams.gasLimit = +feeLimit;
      }
      const tx = await signer.sendTransaction(txParams);
      await tx.wait();
      return {
        hash: tx.hash,
      };
    } catch (error: any) {
      Logger.error(error);
      throw {
        errorMessage:
          error?.errorMessage ?? EVM.parseRpcError(error, "Failed to transfer token. Please try again."),
      };
    }
  }

  async transferNFT(
    collectionAddress: string,
    tokenId: string,
    receiverAddress: string,
    privateKey: string
  ): Promise<{ hash: string }> {
    try {
      // create wallet instance
      const wallet = new ethers.Wallet(privateKey, this.getProvider());
      // validate nft
      const isnftowner = await this.isOwnedNFT(
        collectionAddress,
        tokenId,
        this.publicKey
      );
      if (!isnftowner) {
        throw {
          errorMessage: "Invalid nft owner. Please try with valid nft owner.",
        };
      }

      // transfer nft
      const contract = new ethers.Contract(
        collectionAddress,
        ERC721ABI.abi,
        wallet
      );
      const transferTx = await contract.safeTransferFrom(
        this.publicKey,
        receiverAddress,
        tokenId.toLowerCase()
      );
      await transferTx.wait();

      // validate nft owner
      const ownnft = await this.isOwnedNFT(
        collectionAddress,
        tokenId,
        this.publicKey
      );
      if (ownnft) {
        throw {
          errorMessage: "Failed to transfer nft. Please try again.",
        };
      }

      // remove nft from collection
      this.removeNFT(collectionAddress, tokenId);
      return {
        hash: transferTx.hash,
      };
    } catch (error: any) {
      throw {
        errorMessage:
          error?.errorMessage ?? EVM.parseRpcError(error, "Failed to transfer NFT. Please try again."),
      };
    }
  }
  async approveNFTTransfer(
    _collectionAddress: string,
    _tokenId: string,
    _privateKey: string
  ): Promise<boolean> {
    return true;
  }

  // async getTransactionReceipt(hash: string) {
  //   const provider = this.getProvider();
  //   const receipt = await provider.getTransactionReceipt(hash);

  //   if (!receipt) return;

  //   const tx = await provider.getTransaction(hash);
  //   const block = await provider.getBlock(receipt.blockNumber);

  //   const amount = tx?.value;

  //   return {
  //     ...receipt,
  //     amount: this.formatDecimals(Number(amount), 18),
  //     timestamp: block?.timestamp,
  //   } as any;
  // }

  async getTransactionReceipt(hash: string): Promise<any> {
    const provider = this.getProvider();

    const receipt = await provider.getTransactionReceipt(hash);
    if (!receipt) return;
    const tx = await provider.getTransaction(hash);
    const block = await provider.getBlock(receipt.blockNumber);

    let isNative = true;
    let amount: string | null = null;
    let tokenAddress: string | null = null;
    let decimals = 18; // default for native
    let symbol = this.activeNetwork.nativeToken.symbol;
    let from = tx?.from || "";
    let to = tx?.to || "";

    // 🟢 Case 1: Native transfer
    if (tx && tx.value && tx.value > 0n && tx.data === "0x") {
      amount = this.formatDecimals(Number(tx.value), 18);
    }

    // 🟢 Case 2: ERC20 transfer
    const TRANSFER_TOPIC =
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

    for (const log of receipt.logs) {
      if (log.topics[0] === TRANSFER_TOPIC) {
        tokenAddress = log.address;


        const erc20Interface = new Interface([
          "event Transfer(address indexed from, address indexed to, uint256 value)"
        ]);

        const parsed = erc20Interface.parseLog(log);
        if (parsed?.name === "Transfer") {
          from = parsed.args.from;
          to = parsed.args.to;
        }
        // Use cached metadata from stored tokens — avoids 2 RPC calls per receipt
        const storedTokens: IToken[] = (await ApplicationStorage.get(this.tokenTableName)) ?? [];
        const stored = storedTokens.find(
          (t) => t.tokenAddress?.toLowerCase() === tokenAddress!.toLowerCase()
        );

        if (stored?.decimals && stored.decimals > 0 && stored.symbol) {
          decimals = stored.decimals;
          symbol = stored.symbol;
        } else {
          const tokenContract = new Contract(
            tokenAddress,
            [
              "function decimals() view returns (uint8)",
              "function symbol() view returns (string)"
            ],
            provider
          );
          decimals = await tokenContract.decimals();
          symbol = await tokenContract.symbol();
        }
        const rawAmount = BigInt(log.data);
        amount = this.formatDecimals(Number(rawAmount), Number(decimals));
        isNative = false;
        break; // first transfer only
      }
    }

    return {
      ...receipt,
      amount,
      tokenAddress,
      symbol: symbol,
      decimals: decimals,
      timestamp: block?.timestamp,
      isNative: isNative,
      from: from,
      to: to,
    };
  }

  convertToDecimals(value: number, decimals = 18): any {
    return ethers.parseUnits(value.toString(), decimals).toString();
  }

  formatDecimals(value: number, decimals = 18): any {
    return ethers.formatUnits(value.toString(), decimals).toString();
  }

  async getCurrentNonce(_providerAttrib?: any): Promise<string> {
    try {
      const nonce = await this.getProvider(_providerAttrib).getTransactionCount(
        this.publicKey
      );
      return nonce.toString();
    } catch (error: any) {
      throw {
        errorMessage: EVM.parseRpcError(
          error,
          "Unable to fetch nonce. Check your network connection."
        ),
      };
    }
  }

  async getEstimateFee(
    _providerAttrib?: any,
    transaction?: IFeeEstimateTransaction
  ): Promise<string> {
    const provider = this.getProvider(_providerAttrib);
    // Add 20% buffer to gas estimates (like MetaMask)
    const addBuffer = (gas: bigint) => ((gas * 120n) / 100n).toString();

    // Helper: encode ERC20 transfer calldata
    const encodeTokenTransfer = (
      tokenAddress: string,
      to: string,
      amount: string | bigint
    ) => {
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ERC20ABI.abi,
        provider
      );
      return tokenContract.interface.encodeFunctionData("transfer", [
        to,
        amount,
      ]);
    };

    try {
      switch (transaction?.type) {
        case "TOKEN": {
          const transferData = encodeTokenTransfer(
            transaction.tokenAddress,
            transaction.to,
            transaction.amount
          );
          try {
            const estimateGas = await provider.estimateGas({
              from: this.publicKey,
              to: transaction.tokenAddress,
              data: transferData,
            });
            return addBuffer(estimateGas);
          } catch {
            // If estimation fails (e.g. "BEP20: transfer amount exceeds balance"),
            // retry with a minimal amount (1 wei). Gas cost for ERC20 transfers is
            // the same regardless of amount, so this gives an accurate estimate.
            const minimalData = encodeTokenTransfer(
              transaction.tokenAddress,
              transaction.to,
              "1"
            );
            const estimateGas = await provider.estimateGas({
              from: this.publicKey,
              to: transaction.tokenAddress,
              data: minimalData,
            });
            return addBuffer(estimateGas);
          }
        }

        case "TRASFER": {
          try {
            const estimateGas = await provider.estimateGas({
              from: this.publicKey,
              to: transaction.to,
              value: transaction.amount,
            });
            return addBuffer(estimateGas);
          } catch {
            // Retry with zero value if balance is insufficient for simulation
            const estimateGas = await provider.estimateGas({
              from: this.publicKey,
              to: transaction.to,
              value: 0,
            });
            return addBuffer(estimateGas);
          }
        }

        case "NFT": {
          const nftContract = new ethers.Contract(
            transaction.collectionAddress,
            ERC721ABI.abi,
            provider
          );
          const transferData = nftContract.interface.encodeFunctionData(
            "transferFrom",
            [this.publicKey, transaction.to, transaction.tokenId]
          );
          const estimateGas = await provider.estimateGas({
            from: this.publicKey,
            to: transaction.collectionAddress,
            data: transferData,
          });
          return addBuffer(estimateGas);
        }

        default:
          return "21000"; // fallback: standard ETH transfer gas
      }
    } catch (error) {
      console.warn("[EVM] Gas estimation failed, using fallback:", error);
      // Fallback gas limits when estimation fails
      switch (transaction?.type) {
        case "TOKEN":
          return "65000";
        case "TRASFER":
          return "21000";
        case "NFT":
          return "100000";
        default:
          return "21000";
      }
    }
  }

  async signMessage(
    message: string,
    privateKey: string,
    _providerAttrib?: any
  ): Promise<string> {
    try {
      const wallet = new ethers.Wallet(privateKey);
      const signedMessage = await wallet.signMessage(message);
      return signedMessage;
    } catch (error) {
      throw error;
    }
  }
}
