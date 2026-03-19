import { EVM_CHAINS } from "@virtual_machines/EVM";


const DEBANK_BASE = "https://pro-openapi.debank.com";

export interface DebankChainEntry {
  symbol: string;
  debankId: string;
  name: string;
  chainId: number;
  icon: string;
  explorer: string;
  hasRpc: boolean;
}

const TW_ICON = (chain: string) =>
  `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${chain}/info/logo.png`;

const DEBANK_CHAIN_REGISTRY: DebankChainEntry[] = [
  // ── Chains WITH hardcoded RPC fallback ──
  { symbol: "ETH",      debankId: "eth",      name: "Ethereum",        chainId: 1,          icon: TW_ICON("ethereum"),      explorer: "https://etherscan.io/tx/",                        hasRpc: true  },
  { symbol: "MATIC",    debankId: "matic",    name: "Polygon",         chainId: 137,        icon: TW_ICON("polygon"),       explorer: "https://polygonscan.com/tx/",                     hasRpc: true  },
  { symbol: "BNB",      debankId: "bsc",      name: "BNB Chain",       chainId: 56,         icon: TW_ICON("smartchain"),    explorer: "https://bscscan.com/tx/",                         hasRpc: true  },
  { symbol: "AVAX",     debankId: "avax",     name: "Avalanche",       chainId: 43114,      icon: TW_ICON("avalanchec"),    explorer: "https://snowtrace.io/tx/",                        hasRpc: true  },
  { symbol: "OP",       debankId: "op",       name: "Optimism",        chainId: 10,         icon: TW_ICON("optimism"),      explorer: "https://optimistic.etherscan.io/tx/",             hasRpc: true  },

  // ── L1 Blockchains ──
  { symbol: "CRO",      debankId: "cro",      name: "Cronos",          chainId: 25,         icon: TW_ICON("cronos"),        explorer: "https://cronoscan.com/tx/",                       hasRpc: false },
  { symbol: "FTM",      debankId: "ftm",      name: "Fantom",          chainId: 250,        icon: TW_ICON("fantom"),        explorer: "https://ftmscan.com/tx/",                         hasRpc: false },
  { symbol: "GNOSIS",   debankId: "xdai",     name: "Gnosis",          chainId: 100,        icon: TW_ICON("xdai"),          explorer: "https://gnosisscan.io/tx/",                       hasRpc: false },
  { symbol: "GLMR",     debankId: "mobm",     name: "Moonbeam",        chainId: 1284,       icon: TW_ICON("moonbeam"),      explorer: "https://moonscan.io/tx/",                         hasRpc: false },
  { symbol: "MOVR",     debankId: "movr",     name: "Moonriver",       chainId: 1285,       icon: TW_ICON("moonriver"),     explorer: "https://moonriver.moonscan.io/tx/",               hasRpc: false },
  { symbol: "CELO",     debankId: "celo",     name: "Celo",            chainId: 42220,      icon: TW_ICON("celo"),          explorer: "https://celoscan.io/tx/",                         hasRpc: false },
  { symbol: "KAVA",     debankId: "kava",     name: "Kava",            chainId: 2222,       icon: TW_ICON("kava"),          explorer: "https://kavascan.com/tx/",                        hasRpc: false },
  { symbol: "CFX",      debankId: "cfx",      name: "Conflux",         chainId: 1030,       icon: TW_ICON("conflux"),       explorer: "https://evm.confluxscan.io/tx/",                  hasRpc: false },
  { symbol: "FUSE",     debankId: "fuse",     name: "Fuse",            chainId: 122,        icon: TW_ICON("fuse"),          explorer: "https://explorer.fuse.io/tx/",                    hasRpc: false },
  { symbol: "FLR",      debankId: "flr",      name: "Flare",           chainId: 14,         icon: TW_ICON("flare"),         explorer: "https://flare-explorer.flare.network/tx/",        hasRpc: false },
  { symbol: "RBTC",     debankId: "rsk",      name: "RSK",             chainId: 30,         icon: TW_ICON("rootstock"),     explorer: "https://explorer.rsk.co/tx/",                     hasRpc: false },
  { symbol: "TLOS",     debankId: "telos",    name: "Telos",           chainId: 40,         icon: TW_ICON("telos"),         explorer: "https://teloscan.io/tx/",                         hasRpc: false },
  { symbol: "IOTX",     debankId: "iotx",     name: "IoTeX",           chainId: 4689,       icon: TW_ICON("iotex"),         explorer: "https://iotexscan.io/tx/",                        hasRpc: false },
  { symbol: "ASTR",     debankId: "astr",     name: "Astar",           chainId: 592,        icon: TW_ICON("astar"),         explorer: "https://astar.blockscout.com/tx/",                hasRpc: false },
  { symbol: "RON",      debankId: "ron",      name: "Ronin",           chainId: 2020,       icon: TW_ICON("ronin"),         explorer: "https://app.roninchain.com/tx/",                  hasRpc: false },
  { symbol: "CHZ",      debankId: "chz",      name: "Chiliz",          chainId: 88888,      icon: TW_ICON("chiliz"),        explorer: "https://scan.chiliz.com/tx/",                     hasRpc: false },
  { symbol: "SEI",      debankId: "sei",      name: "Sei",             chainId: 1329,       icon: TW_ICON("sei"),           explorer: "https://seitrace.com/tx/",                        hasRpc: false },
  { symbol: "S",        debankId: "sonic",    name: "Sonic",           chainId: 146,        icon: TW_ICON("sonic"),         explorer: "https://sonicscan.org/tx/",                       hasRpc: false },
  { symbol: "BERA",     debankId: "bera",     name: "Berachain",       chainId: 80094,      icon: TW_ICON("berachain"),     explorer: "https://berascan.com/tx/",                        hasRpc: false },
  { symbol: "KAIA",     debankId: "klay",     name: "Kaia",            chainId: 8217,       icon: TW_ICON("klaytn"),        explorer: "https://scope.klaytn.com/tx/",                    hasRpc: false },
  { symbol: "WEMIX",    debankId: "wemix",    name: "WEMIX",           chainId: 1111,       icon: TW_ICON("wemix"),         explorer: "https://explorer.wemix.com/tx/",                  hasRpc: false },
  { symbol: "OAS",      debankId: "oasys",    name: "Oasys",           chainId: 248,        icon: TW_ICON("oasys"),         explorer: "https://scan.oasys.games/tx/",                    hasRpc: false },
  { symbol: "CANTO",    debankId: "canto",    name: "Canto",           chainId: 7700,       icon: TW_ICON("canto"),         explorer: "https://tuber.build/tx/",                         hasRpc: false },
  { symbol: "MON",      debankId: "monad",    name: "Monad",           chainId: 143,        icon: TW_ICON("monad"),         explorer: "https://explorer.monad.xyz/tx/",                  hasRpc: false },

  // ── Optimistic L2 Rollups ──
  { symbol: "ARB",      debankId: "arb",      name: "Arbitrum",        chainId: 42161,      icon: TW_ICON("arbitrum"),      explorer: "https://arbiscan.io/tx/",                         hasRpc: false },
  { symbol: "ETH",      debankId: "nova",     name: "Arbitrum Nova",   chainId: 42170,      icon: TW_ICON("arbitrum"),      explorer: "https://nova.arbiscan.io/tx/",                    hasRpc: false },
  { symbol: "ETH",      debankId: "base",     name: "Base",            chainId: 8453,       icon: TW_ICON("base"),          explorer: "https://basescan.org/tx/",                        hasRpc: false },
  { symbol: "ETH",      debankId: "blast",    name: "Blast",           chainId: 81457,      icon: TW_ICON("blast"),         explorer: "https://blastscan.io/tx/",                        hasRpc: false },
  { symbol: "MNT",      debankId: "mnt",      name: "Mantle",          chainId: 5000,       icon: TW_ICON("mantle"),        explorer: "https://mantlescan.xyz/tx/",                      hasRpc: false },
  { symbol: "ETH",      debankId: "mode",     name: "Mode",            chainId: 34443,      icon: TW_ICON("mode"),          explorer: "https://modescan.io/tx/",                         hasRpc: false },
  { symbol: "METIS",    debankId: "metis",    name: "Metis",           chainId: 1088,       icon: TW_ICON("metis"),         explorer: "https://andromeda-explorer.metis.io/tx/",         hasRpc: false },
  { symbol: "ETH",      debankId: "boba",     name: "Boba",            chainId: 288,        icon: TW_ICON("boba"),          explorer: "https://bobascan.com/tx/",                        hasRpc: false },
  { symbol: "ETH",      debankId: "zora",     name: "Zora",            chainId: 7777777,    icon: TW_ICON("zora"),          explorer: "https://explorer.zora.energy/tx/",                hasRpc: false },
  { symbol: "BNB",      debankId: "opbnb",    name: "opBNB",           chainId: 204,        icon: TW_ICON("opbnb"),         explorer: "https://opbnbscan.com/tx/",                       hasRpc: false },
  { symbol: "frxETH",   debankId: "fsn",      name: "Fraxtal",         chainId: 252,        icon: TW_ICON("fraxtal"),       explorer: "https://fraxscan.com/tx/",                        hasRpc: false },
  { symbol: "ETH",      debankId: "wc",       name: "World Chain",     chainId: 480,        icon: TW_ICON("worldchain"),    explorer: "https://worldscan.org/tx/",                       hasRpc: false },
  { symbol: "ETH",      debankId: "lisk",     name: "Lisk",            chainId: 1135,       icon: TW_ICON("lisk"),          explorer: "https://blockscout.lisk.com/tx/",                 hasRpc: false },
  { symbol: "APE",      debankId: "ape",      name: "ApeChain",        chainId: 33139,      icon: TW_ICON("apechain"),      explorer: "https://apescan.io/tx/",                          hasRpc: false },
  { symbol: "ETH",      debankId: "cyber",    name: "Cyber",           chainId: 7560,       icon: TW_ICON("cyber"),         explorer: "https://cyberscan.co/tx/",                        hasRpc: false },
  { symbol: "ETH",      debankId: "ink",      name: "Ink",             chainId: 57073,      icon: TW_ICON("ink"),           explorer: "https://explorer.inkonchain.com/tx/",             hasRpc: false },
  { symbol: "ETH",      debankId: "soneium",  name: "Soneium",         chainId: 1868,       icon: TW_ICON("soneium"),       explorer: "https://soneium.blockscout.com/tx/",              hasRpc: false },
  { symbol: "ETH",      debankId: "unichain", name: "Unichain",        chainId: 130,        icon: TW_ICON("unichain"),      explorer: "https://uniscan.xyz/tx/",                         hasRpc: false },
  { symbol: "ETH",      debankId: "hemi",     name: "Hemi",            chainId: 43111,      icon: TW_ICON("hemi"),          explorer: "https://explorer.hemi.xyz/tx/",                   hasRpc: false },
  { symbol: "ETH",      debankId: "bob",      name: "BOB",             chainId: 60808,      icon: TW_ICON("bob"),           explorer: "https://explorer.gobob.xyz/tx/",                  hasRpc: false },
  { symbol: "ETH",      debankId: "mega",     name: "MegaETH",         chainId: 4326,       icon: TW_ICON("megaeth"),       explorer: "https://megaexplorer.xyz/tx/",                    hasRpc: false },
  { symbol: "ETH",      debankId: "katana",   name: "Katana",          chainId: 747474,     icon: TW_ICON("katana"),        explorer: "https://explorer.katanarpc.com/tx/",              hasRpc: false },
  { symbol: "ETH",      debankId: "orderly",  name: "Orderly",         chainId: 291,        icon: TW_ICON("orderly"),       explorer: "https://explorer.orderly.network/tx/",            hasRpc: false },
  { symbol: "ETH",      debankId: "dbk",      name: "DBK Chain",       chainId: 20240603,   icon: TW_ICON("dbk"),           explorer: "https://scan.dbkchain.io/tx/",                    hasRpc: false },

  // ── ZK Rollups ──
  { symbol: "ETH",      debankId: "era",      name: "zkSync Era",      chainId: 324,        icon: TW_ICON("zksync"),        explorer: "https://explorer.zksync.io/tx/",                  hasRpc: false },
  { symbol: "ETH",      debankId: "linea",    name: "Linea",           chainId: 59144,      icon: TW_ICON("linea"),         explorer: "https://lineascan.build/tx/",                     hasRpc: false },
  { symbol: "ETH",      debankId: "scrl",     name: "Scroll",          chainId: 534352,     icon: TW_ICON("scroll"),        explorer: "https://scrollscan.com/tx/",                      hasRpc: false },
  { symbol: "ETH",      debankId: "manta",    name: "Manta Pacific",   chainId: 169,        icon: TW_ICON("manta"),         explorer: "https://pacific-explorer.manta.network/tx/",      hasRpc: false },
  { symbol: "ETH",      debankId: "taiko",    name: "Taiko",           chainId: 167000,     icon: TW_ICON("taiko"),         explorer: "https://taikoscan.io/tx/",                        hasRpc: false },
  { symbol: "IMX",      debankId: "imx",      name: "Immutable zkEVM", chainId: 13371,      icon: TW_ICON("immutable"),     explorer: "https://explorer.immutable.com/tx/",              hasRpc: false },
  { symbol: "zkCRO",    debankId: "czksync",  name: "Cronos zkEVM",    chainId: 388,        icon: TW_ICON("cronos"),        explorer: "https://explorer.zkevm.cronos.org/tx/",           hasRpc: false },
  { symbol: "ETH",      debankId: "zircuit",  name: "Zircuit",         chainId: 48900,      icon: TW_ICON("zircuit"),       explorer: "https://explorer.zircuit.com/tx/",                hasRpc: false },
  { symbol: "OKB",      debankId: "xlayer",   name: "X Layer",         chainId: 196,        icon: TW_ICON("xlayer"),        explorer: "https://www.okx.com/explorer/xlayer/tx/",         hasRpc: false },
  { symbol: "ETH",      debankId: "morph",    name: "Morph",           chainId: 2818,       icon: TW_ICON("morph"),         explorer: "https://explorer.morphl2.io/tx/",                 hasRpc: false },
  { symbol: "ETH",      debankId: "abs",      name: "Abstract",        chainId: 2741,       icon: TW_ICON("abstract"),      explorer: "https://abscan.org/tx/",                          hasRpc: false },
  { symbol: "SOPH",     debankId: "sophon",   name: "Sophon",          chainId: 50104,      icon: TW_ICON("sophon"),        explorer: "https://explorer.sophon.xyz/tx/",                 hasRpc: false },
  { symbol: "GHO",      debankId: "lens",     name: "Lens",            chainId: 232,        icon: TW_ICON("lens"),          explorer: "https://explorer.lens.xyz/tx/",                   hasRpc: false },

  // ── Bitcoin L2s ──
  { symbol: "BTC",      debankId: "merlin",   name: "Merlin",          chainId: 4200,       icon: TW_ICON("merlin"),        explorer: "https://scan.merlinchain.io/tx/",                 hasRpc: false },
  { symbol: "BTC",      debankId: "bitlayer", name: "Bitlayer",        chainId: 200901,     icon: TW_ICON("bitlayer"),      explorer: "https://www.btrscan.com/tx/",                     hasRpc: false },
  { symbol: "BTC",      debankId: "b2",       name: "B² Network",      chainId: 223,        icon: TW_ICON("b2"),            explorer: "https://explorer.bsquared.network/tx/",           hasRpc: false },
  { symbol: "BTC",      debankId: "botanix",  name: "Botanix",         chainId: 3637,       icon: TW_ICON("botanix"),       explorer: "https://botanixscan.io/tx/",                      hasRpc: false },
  { symbol: "BTCN",     debankId: "corn",     name: "Corn",            chainId: 21000000,   icon: TW_ICON("corn"),          explorer: "https://cornscan.io/tx/",                         hasRpc: false },

  // ── App-specific & Other ──
  { symbol: "BONE",     debankId: "shibarium",name: "Shibarium",       chainId: 109,        icon: TW_ICON("shibarium"),     explorer: "https://shibariumscan.io/tx/",                    hasRpc: false },
  { symbol: "DOGE",     debankId: "doge",     name: "Dogechain",       chainId: 2000,       icon: TW_ICON("dogechain"),     explorer: "https://explorer.dogechain.dog/tx/",              hasRpc: false },
  { symbol: "JEWEL",    debankId: "dfk",      name: "DFK Chain",       chainId: 53935,      icon: TW_ICON("dfk"),           explorer: "https://subnets.avax.network/defi-kingdoms/dfk/explorer/tx/", hasRpc: false },
  { symbol: "IP",       debankId: "story",    name: "Story",           chainId: 1514,       icon: TW_ICON("story"),         explorer: "https://storyscan.xyz/tx/",                       hasRpc: false },
  { symbol: "G",        debankId: "gravity",  name: "Gravity",         chainId: 1625,       icon: TW_ICON("gravity"),       explorer: "https://explorer.gravity.xyz/tx/",                hasRpc: false },
  { symbol: "CORE",     debankId: "core",     name: "Core",            chainId: 1116,       icon: TW_ICON("core"),          explorer: "https://scan.coredao.org/tx/",                    hasRpc: false },
  { symbol: "ZETA",     debankId: "zeta",     name: "ZetaChain",       chainId: 7000,       icon: TW_ICON("zetachain"),     explorer: "https://zetachain.blockscout.com/tx/",             hasRpc: false },
  { symbol: "ETH",      debankId: "reya",     name: "Reya",            chainId: 1729,       icon: TW_ICON("reya"),          explorer: "https://explorer.reya.network/tx/",               hasRpc: false },
  { symbol: "BB",       debankId: "bouncebit",name: "BounceBit",       chainId: 6001,       icon: TW_ICON("bouncebit"),     explorer: "https://bbscan.io/tx/",                           hasRpc: false },
  { symbol: "ETH",      debankId: "swell",    name: "SwellChain",      chainId: 1923,       icon: TW_ICON("swell"),         explorer: "https://explorer.swellnetwork.io/tx/",            hasRpc: false },
  { symbol: "ETH",      debankId: "rari",     name: "RARI Chain",      chainId: 1380012617, icon: TW_ICON("rari"),          explorer: "https://mainnet.explorer.rarichain.org/tx/",      hasRpc: false },
  { symbol: "XRP",      debankId: "xrplevm",  name: "XRPL EVM",        chainId: 1440000,    icon: TW_ICON("xrplevm"),       explorer: "https://explorer.xrplevm.org/tx/",                hasRpc: false },
  { symbol: "TON",      debankId: "duck",     name: "DuckChain",       chainId: 5545,       icon: TW_ICON("duckchain"),     explorer: "https://duckscan.io/tx/",                         hasRpc: false },
  { symbol: "HSK",      debankId: "hashkey",  name: "HashKey",         chainId: 177,        icon: TW_ICON("hashkey"),       explorer: "https://hashkeyscan.io/tx/",                      hasRpc: false },
  { symbol: "XTZ",      debankId: "etherlink",name: "Etherlink",       chainId: 42793,      icon: TW_ICON("etherlink"),     explorer: "https://explorer.etherlink.com/tx/",              hasRpc: false },
  { symbol: "PLUME",    debankId: "plume",    name: "Plume",           chainId: 98866,      icon: TW_ICON("plume"),         explorer: "https://explorer.plumenetwork.xyz/tx/",           hasRpc: false },
  { symbol: "XPL",      debankId: "plasma",   name: "Plasma",          chainId: 9745,       icon: TW_ICON("plasma"),        explorer: "https://plasmascan.io/tx/",                       hasRpc: false },
  { symbol: "TAC",      debankId: "tac",      name: "TAC",             chainId: 239,        icon: TW_ICON("tac"),           explorer: "https://explorer.tac.build/tx/",                  hasRpc: false },
  { symbol: "MITO",     debankId: "mitosis",  name: "Mitosis",         chainId: 124816,     icon: TW_ICON("mitosis"),       explorer: "https://explorer.mitosis.org/tx/",                hasRpc: false },
  { symbol: "USDT0",    debankId: "stable",   name: "Stable",          chainId: 988,        icon: TW_ICON("stable"),        explorer: "https://stablescan.io/tx/",                       hasRpc: false },
  { symbol: "G",        debankId: "0g",       name: "0G",              chainId: 166,        icon: TW_ICON("0g"),            explorer: "https://chainscan-newton.0g.ai/tx/",              hasRpc: false },
  { symbol: "HYPE",     debankId: "hype",     name: "HyperEVM",        chainId: 999,        icon: TW_ICON("hyperliquid"),   explorer: "https://purrsec.com/tx/",                         hasRpc: false },
  { symbol: "GOAT",     debankId: "goat",     name: "GOAT Chain",      chainId: 2345,       icon: TW_ICON("goat"),          explorer: "https://explorer.goat.network/tx/",               hasRpc: false },
];


const SYMBOL_TO_DEBANK_CHAIN: Record<string, string> = Object.fromEntries(
  DEBANK_CHAIN_REGISTRY.map((c) => [c.symbol, c.debankId])
);

const DEBANK_CHAIN_TO_SYMBOL: Record<string, string> = Object.fromEntries(
  DEBANK_CHAIN_REGISTRY.map((c) => [c.debankId, c.symbol])
);

const DEBANK_CHAIN_BY_SYMBOL = new Map(
  DEBANK_CHAIN_REGISTRY.map((c) => [c.symbol, c])
);

export { DEBANK_CHAIN_REGISTRY, SYMBOL_TO_DEBANK_CHAIN };

export function getDebankChainId(networkSymbol: string): string | null {
  return SYMBOL_TO_DEBANK_CHAIN[networkSymbol.toUpperCase()] ?? null;
}

export function getNetworkSymbolFromDebank(debankChain: string): string {
  return DEBANK_CHAIN_TO_SYMBOL[debankChain] ?? debankChain.toUpperCase();
}

export function getDebankChainEntry(symbol: string): DebankChainEntry | undefined {
  return DEBANK_CHAIN_BY_SYMBOL.get(symbol.toUpperCase());
}

export function getChainIcon(networkSymbol: string): string {
  const upper = (networkSymbol || "").toUpperCase();

  // Priority 1: Local SVG from hardcoded RPC chains
  const evmChain = EVM_CHAINS.find((c) => c.symbol.toUpperCase() === upper);
  if (evmChain?.icon) return evmChain.icon;

  // Priority 2: Trust Wallet CDN URL from DeBank registry
  const entry = DEBANK_CHAIN_BY_SYMBOL.get(upper);
  if (entry?.icon) return entry.icon;

  return "";
}

interface DeBankToken {
  id: string;
  chain: string;
  name: string;
  symbol: string;
  optimized_symbol: string;
  display_symbol: string | null;
  decimals: number;
  logo_url: string | null;
  price: number;
  amount: number;
  raw_amount: number;
  is_core: boolean;
  is_verified: boolean;
  is_wallet: boolean;
  time_at: number;
  protocol_id: string;
}

function mapToIToken(t: DeBankToken): IToken & { origin: "EVM"; networkSymbol: string } {
  const networkSymbol = getNetworkSymbolFromDebank(t.chain);
  const chain = EVM_CHAINS.find(
    (c) => c.symbol.toUpperCase() === networkSymbol.toUpperCase()
  );
  const registryEntry = DEBANK_CHAIN_BY_SYMBOL.get(networkSymbol);

  return {
    name: t.name || t.symbol,
    symbol: t.optimized_symbol || t.display_symbol || t.symbol,
    decimals: t.decimals,
    total_supply: 0,
    balance: t.amount ?? 0,
    tokenAddress: t.id,
    icon: t.logo_url || chain?.icon || registryEntry?.icon || "",
    isNative: !t.id.startsWith("0x"),
    usdRate: t.price ?? 0,
    origin: "EVM" as const,
    networkSymbol,
  };
}

// --------------- Rate limiter (token bucket) ---------------

const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_REFILL_MS = 1000;
let bucket = RATE_LIMIT_MAX;
let lastRefill = Date.now();
let debankHealthy = false;

function acquireToken(): boolean {
  const now = Date.now();
  const elapsed = now - lastRefill;
  if (elapsed >= RATE_LIMIT_REFILL_MS) {
    const refills = Math.floor(elapsed / RATE_LIMIT_REFILL_MS);
    bucket = Math.min(RATE_LIMIT_MAX, bucket + refills * RATE_LIMIT_MAX);
    lastRefill += refills * RATE_LIMIT_REFILL_MS;
  }
  if (bucket > 0) {
    bucket--;
    return true;
  }
  return false;
}

async function waitForToken(): Promise<void> {
  while (!acquireToken()) {
    await new Promise((r) => setTimeout(r, 100));
  }
}

// --------------- In-memory cache ---------------

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<any>>();
const DEFAULT_TTL_MS = 60_000;

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T, ttlMs = DEFAULT_TTL_MS): void {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

export function clearDebankCache(): void {
  cache.clear();
}

// --------------- Persistent Chrome Storage cache ---------------

const STORAGE_CACHE_KEY = "debank_cached_data";
const STORAGE_REFRESH_KEY = "debank_refresh_tracker";
const CACHE_TTL_MS = parseInt(import.meta.env.VITE_CACHE_TTL_MS || "3600000", 10);
const MAX_DAILY_REFRESH = parseInt(import.meta.env.VITE_MAX_DAILY_REFRESH || "5", 10);
const AUTO_REFRESH_ON_TX = import.meta.env.VITE_AUTO_REFRESH_ON_TX !== "false";

interface StoredCache {
  tokens: Record<string, { data: (IToken & { origin: "EVM"; networkSymbol: string })[]; updatedAt: number }>;
  totalBalance: { usd: number; updatedAt: number } | null;
}

interface RefreshTracker {
  date: string; // YYYY-MM-DD
  count: number;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

async function getStoredCache(): Promise<StoredCache> {
  try {
    const raw = await chrome.storage.local.get(STORAGE_CACHE_KEY);
    return raw[STORAGE_CACHE_KEY] || { tokens: {}, totalBalance: null };
  } catch {
    return { tokens: {}, totalBalance: null };
  }
}

async function setStoredCache(data: StoredCache): Promise<void> {
  try {
    await chrome.storage.local.set({ [STORAGE_CACHE_KEY]: data });
  } catch {}
}

async function getRefreshTracker(): Promise<RefreshTracker> {
  try {
    const raw = await chrome.storage.local.get(STORAGE_REFRESH_KEY);
    const tracker = raw[STORAGE_REFRESH_KEY];
    if (tracker && tracker.date === todayStr()) return tracker;
    return { date: todayStr(), count: 0 };
  } catch {
    return { date: todayStr(), count: 0 };
  }
}

async function setRefreshTracker(tracker: RefreshTracker): Promise<void> {
  try {
    await chrome.storage.local.set({ [STORAGE_REFRESH_KEY]: tracker });
  } catch {}
}

export async function canManualRefresh(): Promise<{ allowed: boolean; remaining: number }> {
  const tracker = await getRefreshTracker();
  const remaining = Math.max(0, MAX_DAILY_REFRESH - tracker.count);
  return { allowed: remaining > 0, remaining };
}

export async function consumeManualRefresh(): Promise<boolean> {
  const tracker = await getRefreshTracker();
  if (tracker.count >= MAX_DAILY_REFRESH) return false;
  tracker.count++;
  await setRefreshTracker(tracker);
  return true;
}

export function shouldAutoRefreshOnTx(): boolean {
  return AUTO_REFRESH_ON_TX;
}

export async function getCachedTokens(
  cacheKey: string
): Promise<(IToken & { origin: "EVM"; networkSymbol: string })[] | null> {
  const stored = await getStoredCache();
  const entry = stored.tokens[cacheKey];
  if (!entry) return null;
  if (Date.now() - entry.updatedAt > CACHE_TTL_MS) return null;
  return entry.data;
}

export async function setCachedTokens(
  cacheKey: string,
  tokens: (IToken & { origin: "EVM"; networkSymbol: string })[]
): Promise<void> {
  const stored = await getStoredCache();
  stored.tokens[cacheKey] = { data: tokens, updatedAt: Date.now() };
  await setStoredCache(stored);
}

export async function getCachedTotalBalance(): Promise<number | null> {
  const stored = await getStoredCache();
  if (!stored.totalBalance) return null;
  if (Date.now() - stored.totalBalance.updatedAt > CACHE_TTL_MS) return null;
  return stored.totalBalance.usd;
}

export async function setCachedTotalBalance(usd: number): Promise<void> {
  const stored = await getStoredCache();
  stored.totalBalance = { usd, updatedAt: Date.now() };
  await setStoredCache(stored);
}

export async function clearStoredCache(): Promise<void> {
  await chrome.storage.local.remove([STORAGE_CACHE_KEY]);
}

// --------------- API helpers ---------------

function getAccessKey(): string {
  return import.meta.env.VITE_DEBANK_ACCESS_KEY || "";
}

async function debankFetch<T>(path: string): Promise<T | null> {
  const key = getAccessKey();
  if (!key) {
    debankHealthy = false;
    return null;
  }

  await waitForToken();

  try {
    const res = await fetch(`${DEBANK_BASE}${path}`, {
      headers: { AccessKey: key },
    });

    if (res.status === 401 || res.status === 403 || res.status === 429) {
      debankHealthy = false;
      return null;
    }
    if (!res.ok) return null;
    debankHealthy = true;
    return res.json();
  } catch {
    debankHealthy = false;
    return null;
  }
}

export function isDebankAvailable(): boolean {
  return debankHealthy && !!getAccessKey();
}

export async function probeDebankKey(): Promise<boolean> {
  const key = getAccessKey();
  if (!key) {
    debankHealthy = false;
    return false;
  }
  try {
    const res = await fetch(`${DEBANK_BASE}/v1/chain/list`, {
      headers: { AccessKey: key },
    });
    debankHealthy = res.ok;
    return res.ok;
  } catch {
    debankHealthy = false;
    return false;
  }
}

// --------------- Public API ---------------

export async function fetchTokensForChain(
  address: string,
  networkSymbol: string,
  forceRefresh = false
): Promise<(IToken & { origin: "EVM"; networkSymbol: string })[] | null> {
  const chainId = getDebankChainId(networkSymbol);
  if (!chainId) return null;

  const cacheKey = `debank:tokens:${address.toLowerCase()}:${chainId}`;

  // 1. In-memory cache (fastest)
  if (!forceRefresh) {
    const memCached = getCached<(IToken & { origin: "EVM"; networkSymbol: string })[]>(cacheKey);
    if (memCached) return memCached;

    // 2. Persistent storage cache
    const storedCached = await getCachedTokens(cacheKey);
    if (storedCached) {
      setCache(cacheKey, storedCached); // warm in-memory
      return storedCached;
    }
  }

  // 3. Fetch from DeBank API
  const data = await debankFetch<DeBankToken[]>(
    `/v1/user/token_list?id=${address}&chain_id=${chainId}&is_all=false`
  );
  if (!data) return null;

  const tokens = data.map(mapToIToken);
  setCache(cacheKey, tokens);
  await setCachedTokens(cacheKey, tokens); // persist
  return tokens;
}

export async function fetchAllChainTokens(
  address: string,
  forceRefresh = false
): Promise<(IToken & { origin: "EVM"; networkSymbol: string })[] | null> {
  const cacheKey = `debank:all_tokens:${address.toLowerCase()}`;

  if (!forceRefresh) {
    const memCached = getCached<(IToken & { origin: "EVM"; networkSymbol: string })[]>(cacheKey);
    if (memCached) return memCached;

    const storedCached = await getCachedTokens(cacheKey);
    if (storedCached) {
      setCache(cacheKey, storedCached);
      return storedCached;
    }
  }

  const chainIds = DEBANK_CHAIN_REGISTRY.map((c) => c.debankId).join(",");
  const data = await debankFetch<DeBankToken[]>(
    `/v1/user/all_token_list?id=${address}&chain_ids=${chainIds}&is_all=false`
  );
  if (!data) return null;

  const tokens = data.map(mapToIToken);
  setCache(cacheKey, tokens);
  await setCachedTokens(cacheKey, tokens);
  return tokens;
}

export async function lookupToken(
  tokenAddress: string,
  networkSymbol: string
): Promise<IToken | null> {
  const chainId = getDebankChainId(networkSymbol);
  if (!chainId) return null;

  const data = await debankFetch<DeBankToken>(
    `/v1/token?chain_id=${chainId}&id=${tokenAddress.toLowerCase()}`
  );
  if (!data || !data.symbol) return null;

  return mapToIToken(data);
}

export async function fetchTotalBalance(
  address: string,
  forceRefresh = false
): Promise<number | null> {
  const cacheKey = `debank:balance:${address.toLowerCase()}`;

  if (!forceRefresh) {
    const memCached = getCached<number>(cacheKey);
    if (memCached !== null) return memCached;

    const storedBalance = await getCachedTotalBalance();
    if (storedBalance !== null) {
      setCache(cacheKey, storedBalance);
      return storedBalance;
    }
  }

  const chainIds = DEBANK_CHAIN_REGISTRY.map((c) => c.debankId).join(",");
  const data = await debankFetch<{ total_usd_value: number }>(
    `/v1/user/total_balance?id=${address}&chain_ids=${chainIds}`
  );
  if (!data) return null;

  const total = data.total_usd_value ?? 0;
  setCache(cacheKey, total);
  await setCachedTotalBalance(total);
  return total;
}
