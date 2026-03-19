import { ethers } from "ethers";
import { setPriceCacheFromTokens, fetchAndCacheL1XPrice } from "@util/PriceCache.util";

const PORTFOLIO_API = "https://nlo.finance/api/portfolio";
const CACHE_TTL = 300_000; // 5 min (match server cache)
const RATE_LIMIT_MS = 10_000; // 1 req per 10s per wallet
const FETCH_TIMEOUT = 15_000; // 15s abort (Ankr can be slow for multi-chain queries)

// Portfolio API chain names → wallet chain symbols
const CHAIN_MAP: Record<string, { symbol: string; chainId: number }> = {
  eth: { symbol: "ETH", chainId: 1 },
  bsc: { symbol: "BNB", chainId: 56 },
  polygon: { symbol: "MATIC", chainId: 137 },
  optimism: { symbol: "OP", chainId: 10 },
  avalanche: { symbol: "AVAX", chainId: 43114 },
  arbitrum: { symbol: "ARB", chainId: 42161 },
  base: { symbol: "BASE", chainId: 8453 },
};

// TrustWallet CDN fallback for missing token logos
const TW_CDN = "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains";
const TW_CHAIN_MAP: Record<string, string> = {
  ETH: "ethereum",
  BNB: "smartchain",
  MATIC: "polygon",
  AVAX: "avalanchec",
  OP: "optimism",
  ARB: "arbitrum",
  BASE: "base",
};

function getTrustWalletIcon(networkSymbol: string, contractAddress: string): string {
  const twChain = TW_CHAIN_MAP[networkSymbol.toUpperCase()];
  if (!twChain || !contractAddress) return "";
  try {
    const checksumAddr = ethers.getAddress(contractAddress);
    return `${TW_CDN}/${twChain}/assets/${checksumAddr}/logo.png`;
  } catch {
    return "";
  }
}

// Supported symbols derived from CHAIN_MAP (no EVM import needed)
const SUPPORTED_SYMBOLS = new Set(Object.values(CHAIN_MAP).map((m) => m.symbol));

interface PortfolioAsset {
  chain: string;
  symbol: string;
  name: string;
  type: "NATIVE" | "ERC20";
  contractAddress: string | null;
  decimals: number;
  balance: string;
  balanceRaw: string;
  balanceUsd: number;
  tokenPrice: number;
  logo: string | null;
}

interface PortfolioApiResponse {
  success: boolean;
  data: {
    walletAddress: string;
    totalBalanceUsd: number;
    totalTokens: number;
    assets: PortfolioAsset[];
  };
  error: string | null;
  meta: {
    provider: string;
    chainsWithHoldings: string[];
  };
}

// Client-side cache
let _cache: { wallet: string; tokens: IToken[]; expiresAt: number } | null = null;
let _lastRequestAt: Record<string, number> = {};
let _inflightPromise: Promise<IToken[]> | null = null;

function mapAssetToIToken(asset: PortfolioAsset): (IToken & { networkSymbol: string; origin: "EVM" }) | null {
  const mapping = CHAIN_MAP[asset.chain];
  if (!mapping || !SUPPORTED_SYMBOLS.has(mapping.symbol)) return null;

  const icon = asset.logo
    || (asset.contractAddress ? getTrustWalletIcon(mapping.symbol, asset.contractAddress) : "");

  console.log("[PortfolioApi] mapAssetToIToken", asset.symbol, {
    contractAddress: asset.contractAddress,
    mappedTokenAddress: asset.contractAddress || "",
    logo: asset.logo,
    icon,
    chain: asset.chain,
  });

  return {
    symbol: asset.symbol,
    name: asset.name,
    icon,
    tokenAddress: asset.contractAddress || "",
    balance: parseFloat(asset.balance) || 0,
    usdRate: asset.tokenPrice || 0,
    decimals: asset.decimals,
    total_supply: 0,
    isNative: asset.type === "NATIVE",
    networkSymbol: mapping.symbol,
    origin: "EVM" as const,
  };
}


export async function fetchPortfolio(
  wallet: string,
  refresh = false,
): Promise<IToken[]> {
  // Return cache if valid and not forcing refresh
  if (!refresh && _cache && _cache.wallet === wallet.toLowerCase() && Date.now() < _cache.expiresAt) {
    return _cache.tokens;
  }

  // In-flight dedup
  if (_inflightPromise) return _inflightPromise;

  // Rate limit guard
  const walletKey = wallet.toLowerCase();
  const lastReq = _lastRequestAt[walletKey] || 0;
  if (Date.now() - lastReq < RATE_LIMIT_MS) {
    // Return stale cache if available, otherwise empty
    return _cache?.tokens ?? [];
  }

  _inflightPromise = (async () => {
    try {
      _lastRequestAt[walletKey] = Date.now();

      const url = new URL(PORTFOLIO_API);
      url.searchParams.set("wallet", wallet);
      if (refresh) url.searchParams.set("refresh", "true");

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

      const res = await fetch(url.toString(), { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) return _cache?.tokens ?? [];

      const json: PortfolioApiResponse = await res.json();
      if (!json.success || !json.data?.assets) return _cache?.tokens ?? [];

      const apiTokens = json.data.assets
        .map(mapAssetToIToken)
        .filter((t): t is IToken & { networkSymbol: string; origin: "EVM" } => t !== null);

      const tokens = apiTokens;

      _cache = { wallet: walletKey, tokens, expiresAt: Date.now() + CACHE_TTL };
      setPriceCacheFromTokens(tokens);
      fetchAndCacheL1XPrice(); // L1X/WL1X not in Portfolio API — fetch separately
      return tokens;
    } catch {
      return _cache?.tokens ?? [];
    } finally {
      _inflightPromise = null;
    }
  })();

  return _inflightPromise;
}

export function filterPortfolioByChain(
  tokens: IToken[],
  networkSymbol: string,
): IToken[] {
  const upper = networkSymbol.toUpperCase();
  return tokens.filter((t: any) => t.networkSymbol?.toUpperCase() === upper);
}

export function clearPortfolioCache() {
  _cache = null;
  _inflightPromise = null;
  _lastRequestAt = {};
}

