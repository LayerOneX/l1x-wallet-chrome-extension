// Shared price cache — no imports from virtual_machines to avoid circular deps.
// PortfolioApi.service writes prices here; VirtualMachine reads them.

let _priceMap: Record<string, number> = {};

/** Called by PortfolioApi.service after fetching portfolio data. */
export function setPriceCacheFromTokens(tokens: { symbol: string; usdRate?: number }[]) {
  const map: Record<string, number> = {};
  for (const t of tokens) {
    const upper = t.symbol.toUpperCase();
    if (t.usdRate != null && t.usdRate > 0) {
      map[upper] = t.usdRate;
    }
  }
  _priceMap = map;
}

/** Look up a single token price (no network call). */
export function getCachedTokenRate(symbol: string): number {
  return _priceMap[symbol?.toUpperCase()] ?? 0;
}

/** Look up multiple token prices (no network call). */
export function getCachedTokenRatesBatch(symbols: string[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const sym of symbols) {
    const upper = sym.toUpperCase();
    if (_priceMap[upper] !== undefined) {
      result[upper] = _priceMap[upper];
    }
  }
  return result;
}

export function clearPriceCache() {
  _priceMap = {};
}

// ── L1X / WL1X price (not covered by Portfolio API) ──
const L1X_PRICE_API = "https://v2-api.l1xapp.com/api/v2/price/l1x_getL1XCoinMarketPrice";
let _l1xPricePromise: Promise<number> | null = null;

/** Fetch L1X price from official API and cache as both L1X and WL1X. */
export async function fetchAndCacheL1XPrice(): Promise<number> {
  if (_priceMap["L1X"] > 0) return _priceMap["L1X"];
  if (_l1xPricePromise) return _l1xPricePromise;
  _l1xPricePromise = (async () => {
    try {
      const res = await fetch(L1X_PRICE_API);
      const json = await res.json();
      const price = Number(json?.data ?? 0);
      if (!isNaN(price) && price > 0) {
        _priceMap["L1X"] = price;
        _priceMap["WL1X"] = price;
      }
      return price;
    } catch {
      return 0;
    } finally {
      _l1xPricePromise = null;
    }
  })();
  return _l1xPricePromise;
}
