import React, { useContext, useEffect, useRef, useState } from "react";
import NetworkFilterButton, { ALL_NETWORK_ID, readSelectedNetwork } from "@features/wallet/components/NetworkFilterButton";
import tokenFallback from "@assets/images/token-fallback.svg";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../../Auth.guard";
import Skeleton from "react-loading-skeleton";
import Swal from "sweetalert2";
import { XCircleIconHtml } from "@components/XCircleIconHtml";
import { RefreshCw, PlusCircle } from "react-feather";
import VirtualMachineFactory from "@factory/VirtualMachine.factory";
import { ExtensionStorage } from "@util/ExtensionStorage.util";
import { getAllEVMChains, EVM_CHAINS, clearListTokenCache } from "@virtual_machines/EVM";
import { fetchPortfolio, filterPortfolioByChain, clearPortfolioCache } from "@util/PortfolioApi.service";
import { fetchAndCacheL1XPrice } from "@util/PriceCache.util";


const Assets = ({ onBalanceChange }: { onBalanceChange?: (balance: number) => void }) => {
  const navigate = useNavigate();
  const appContext = useContext(AppContext);
  const [assetList, setAssetList] = useState<IToken[]>([]);
  const [loader, setLoader] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const activeNetworkId = readSelectedNetwork();
  const lastFetchRef = useRef(0);
  const isManualRefresh = useRef(false);
  // Build a lookup map of networkSymbol → chain icon for badge display
  const chainIconMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of getAllEVMChains()) {
      map[c.symbol.toUpperCase()] = c.icon || "";
    }
    return map;
  }, []);
  const isAllNetworks = activeNetworkId === ALL_NETWORK_ID;

  useEffect(() => {
    setAssetList([]);
    clearPortfolioCache(); // Clear stale data from previous account
    if (appContext?.virtualMachine) {
      const networkId = readSelectedNetwork();
      let timeoutid = setTimeout(() => {
        fetchAssetsList(networkId);
      }, 500);
      return () => clearTimeout(timeoutid);
    }
  }, [appContext?.virtualMachine, appContext?.publicKey,activeNetworkId]);

  // Auto-refresh when popup regains focus (debounced 30s)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && appContext?.virtualMachine) {
        if (Date.now() - lastFetchRef.current < 30_000) return;
        fetchAssetsList(activeNetworkId);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [appContext?.virtualMachine, activeNetworkId]);

  async function resolveEvmPublicKeyFromStorage(): Promise<string> {
    let evmPublicKey = appContext?.publicKey || "";
    if (appContext?.type !== "EVM") {
      const storage = await ExtensionStorage.get("wallets");
      const l1xAcc = storage?.L1X?.find(
        (w: any) => w.publicKey === appContext?.publicKey,
      );
      if (l1xAcc) {
        const evmAcc = storage?.EVM?.find(
          (w: any) => w.privateKey?.trim() === l1xAcc.privateKey?.trim(),
        );
        if (evmAcc) evmPublicKey = evmAcc.publicKey;
      }
    }
    return evmPublicKey;
  }

  function pushBalance(tokens: IToken[]) {
    const total = tokens.reduce(
      (sum, t) => sum + (t.balance || 0) * (t.usdRate || 0),
      0
    );
    onBalanceChange?.(+total.toFixed(4));
  }

  function sortByUsdValue(tokens: IToken[]): IToken[] {
    return [...tokens]
      .filter((t) => (t.balance || 0) > 0)
      .sort(
        (a, b) => ((b.balance || 0) * (b.usdRate || 0)) - ((a.balance || 0) * (a.usdRate || 0))
      );
  }

  async function fetchAssetsList(networkId?: string) {
    lastFetchRef.current = Date.now();
    try {
      setLoader(true);

      if (networkId === ALL_NETWORK_ID) {
        await fetchAllNetworkAssets();
        return;
      }

      // networkId is now chainId (e.g. "1", "56", "42161")
      const chain = getAllEVMChains().find(
        (c) => c.chainId.toString() === networkId
      );
      const networkSymbol = chain?.symbol?.toUpperCase() || networkId?.toUpperCase() || "";

      if (networkSymbol === "L1X") {
        await fetchL1XNetworkAssets();
        return;
      }

      // Portfolio API first, RPC fallback only if API is unavailable
      await fetchSingleNetworkFromPortfolio(networkSymbol, chain);
    } catch (error: any) {
      Swal.fire({
        iconHtml: XCircleIconHtml,
        title: "Failed",
        text: error?.errorMessage || "Failed to load asset list. Please try again.",
        customClass: { icon: "no-border" },
      });
    } finally {
      setLoader(false);
    }
  }

  async function fetchL1XNetworkAssets() {
    // Fetch L1X price early so getTokenRate("L1X") works when listToken() runs
    fetchAndCacheL1XPrice();
    const evmPublicKey = await resolveEvmPublicKeyFromStorage();
    const WL1X_TOKEN_ADDRESS = import.meta.env.VITE_WL1X_TOKEN_ADDRESS?.toLowerCase();
    const l1xChain = getAllEVMChains().find((c) => c.symbol.toUpperCase() === "L1X");
    let evmTokens: IToken[] = [];
    if (l1xChain) {
      const evmVm = VirtualMachineFactory.createVirtualMachine("EVM", evmPublicKey, l1xChain.chainId?.toString() || "");
      const tokenList = (await evmVm.listToken()) || [];
      console.log("[L1X] EVM listToken returned:", tokenList.length, "tokens:", tokenList.map((t: IToken) => `${t.symbol}(${t.tokenAddress})`));
      evmTokens = tokenList.map((t: IToken) => ({ ...t, origin: "EVM" as const, networkSymbol: "L1X" }));
    }

    const l1xTokens = await fetchL1XTokens();
    console.log("[L1X] L1X native tokens:", l1xTokens.length, "tokens:", l1xTokens.map((t: IToken) => `${t.symbol}(bal:${t.balance})`));

    const merged = [...evmTokens, ...l1xTokens];

    // WL1X is not in listToken() — fetch it directly from chain and add to list
    if (WL1X_TOKEN_ADDRESS) {
      try {
        const wl1xDetails = await appContext?.virtualMachine?.getTokenDetails(WL1X_TOKEN_ADDRESS);
        if (wl1xDetails && (wl1xDetails.balance || 0) > 0) {
          merged.push({
            ...wl1xDetails,
            tokenAddress: WL1X_TOKEN_ADDRESS,
            origin: "L1X",
            networkSymbol: "L1X",
          } as any);
        }
      } catch { /* WL1X not available on this chain */ }
    }

    const unique = merged.filter((t, i, self) =>
      i === self.findIndex((t2) => t2.tokenAddress?.toLowerCase() === t.tokenAddress?.toLowerCase())
    );
    console.log("[L1X] after dedup:", unique.length, "after sortByUsdValue:", sortByUsdValue(unique).length);

    setAssetList(sortByUsdValue(unique));
    pushBalance(unique);
  }

  async function fetchSingleNetworkByChain(chain: IVMChain | undefined, networkSymbol: string) {
    const evmPublicKey = await resolveEvmPublicKeyFromStorage();
    const vm = chain
      ? VirtualMachineFactory.createVirtualMachine("EVM", evmPublicKey, chain.chainId?.toString() || "")
      : appContext?.virtualMachine;
    const tokenList = (await vm?.listToken()) || [];
    const tokens = tokenList.map((t: IToken) => ({
      ...t,
      origin: "EVM" as const,
      networkSymbol,
    }));
    setAssetList(sortByUsdValue(tokens));
    pushBalance(tokens);
  }

  async function fetchSingleNetworkFromPortfolio(networkSymbol: string, resolvedChain?: IVMChain) {
    const evmPublicKey = await resolveEvmPublicKeyFromStorage();

    // For custom networks (no portfolio data), fall straight to RPC
    const isCustomNetwork = resolvedChain
      ? !EVM_CHAINS.some((c) => c.chainId === resolvedChain.chainId)
      : false;

    if (!isCustomNetwork) {
      try {
        const allTokens = await fetchPortfolio(evmPublicKey, isManualRefresh.current);
        if (allTokens.length > 0) {
          const filtered = filterPortfolioByChain(allTokens, networkSymbol);
          // const defaults = getDefaultITokensForChain(networkSymbol);
          // const seen = new Set(filtered.map((t) => `${(t.tokenAddress || "").toLowerCase()}`));
          // const missing = defaults.filter((d) => !seen.has((d.tokenAddress || "").toLowerCase()));
          const merged = [...filtered];
          setAssetList(sortByUsdValue(merged));
          pushBalance(merged);
          return;
        }
      } catch {
        // Portfolio API unavailable — fall through to RPC
      }
    }

    // Use the already-resolved chain (by chainId) — avoids symbol collision (e.g. BASE vs ETH both use "ETH")
    await fetchSingleNetworkByChain(resolvedChain, networkSymbol);
  }

  async function fetchL1XTokens(): Promise<IToken[]> {
    try {
      // Resolve the L1X public key — if current account is EVM, find the matching L1X wallet
      let l1xPublicKey = appContext?.publicKey || "";
      if (appContext?.type === "EVM") {
        const storage = await ExtensionStorage.get("wallets");
        const evmAcc = storage?.EVM?.find(
          (w: any) => w.publicKey === appContext?.publicKey,
        );
        if (evmAcc) {
          const l1xAcc = storage?.L1X?.find(
            (w: any) => w.privateKey?.trim() === evmAcc.privateKey?.trim(),
          );
          if (l1xAcc) l1xPublicKey = l1xAcc.publicKey;
        }
      }
      const L1XVm = VirtualMachineFactory.createVirtualMachine("L1X", l1xPublicKey);
      const list = await L1XVm.listToken();
      return (list || []).map((t: IToken) => ({
        ...t,
        origin: "L1X" as const,
        networkSymbol: "L1X",
      }));
    } catch {
      return [];
    }
  }

  async function fetchEvmTokensFallback(evmPublicKey: string): Promise<IToken[]> {
    const evmResults = await Promise.allSettled(
      getAllEVMChains().filter((c) => c.symbol !== "L1X").map(async (chain) => {
        const evmVm = VirtualMachineFactory.createVirtualMachine(
          "EVM",
          evmPublicKey,
          chain.chainId?.toString() || "",
        );
        const list = await evmVm.listToken();
        return (list || []).map((t) => ({
          ...t,
          origin: "EVM" as const,
          networkSymbol: chain.symbol,
        }));
      }),
    );
    return evmResults
      .filter((r) => r.status === "fulfilled")
      .flatMap((r) => (r as any).value as IToken[]);
  }

  async function fetchAllNetworkAssets() {
    try {
      // Fetch L1X price early so getTokenRate("L1X") works when listToken() runs
      fetchAndCacheL1XPrice();
      const evmPublicKey = await resolveEvmPublicKeyFromStorage();
      const WL1X_TOKEN_ADDRESS =
        import.meta.env.VITE_WL1X_TOKEN_ADDRESS?.toLowerCase();

      // Fetch L1X tokens in parallel (Portfolio API is EVM-only)
      // L1X native tokens (from L1XVM)
      const l1xPromise = fetchL1XTokens();
      // EVM tokens on L1X chain (imported tokens via EVM VM)
      const l1xEvmPromise = (async (): Promise<IToken[]> => {
        try {
          const l1xChain = getAllEVMChains().find((c) => c.symbol.toUpperCase() === "L1X");
          console.log("[AllNetworks] l1xChain:", l1xChain?.symbol, "chainId:", l1xChain?.chainId);
          if (!l1xChain) return [];
          const evmVm = VirtualMachineFactory.createVirtualMachine("EVM", evmPublicKey, l1xChain.chainId?.toString() || "");
          const list = (await evmVm.listToken()) || [];
          console.log("[AllNetworks] L1X EVM tokens:", list.length, list.map((t: IToken) => `${t.symbol}(bal:${t.balance})`));
          return list.map((t: IToken) => ({ ...t, origin: "EVM" as const, networkSymbol: "L1X" }));
        } catch (e) { console.log("[AllNetworks] L1X EVM error:", e); return []; }
      })();

      // Try Portfolio API first (single call for all EVM chains), fall back to multi-RPC
      let evmTokens: IToken[];
      try {
        const portfolioTokens = await fetchPortfolio(evmPublicKey, isManualRefresh.current);
        evmTokens = portfolioTokens.length > 0
          ? portfolioTokens
          : await fetchEvmTokensFallback(evmPublicKey);
      } catch {
        evmTokens = await fetchEvmTokensFallback(evmPublicKey);
      }

      const [l1xTokens, l1xEvmTokens] = await Promise.all([l1xPromise, l1xEvmPromise]);
      const allTokens = [...evmTokens, ...l1xTokens, ...l1xEvmTokens];

      // WL1X is not in listToken() or Portfolio API — fetch directly and add
      if (WL1X_TOKEN_ADDRESS) {
        const alreadyHasWl1x = allTokens.some(
          (t) => t.tokenAddress?.toLowerCase() === WL1X_TOKEN_ADDRESS
        );
        if (!alreadyHasWl1x) {
          try {
            const wl1xDetails = await appContext?.virtualMachine?.getTokenDetails(WL1X_TOKEN_ADDRESS);
            if (wl1xDetails && (wl1xDetails.balance || 0) > 0) {
              allTokens.push({
                ...wl1xDetails,
                tokenAddress: WL1X_TOKEN_ADDRESS,
                origin: "L1X",
                networkSymbol: "L1X",
              } as any);
            }
          } catch { /* WL1X not available */ }
        }
      }

      // Faster deduplication (O(n))
      const seen = new Set();
      const unique = allTokens.filter((t: IToken) => {
        const key =
          `${t.tokenAddress?.toLowerCase()}_${(t as any).networkSymbol}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setAssetList(sortByUsdValue(unique));
      pushBalance(unique);
    } catch (error: any) {
      Swal.fire({
        iconHtml: XCircleIconHtml,
        title: "Failed",
        text: error?.errorMessage || "Failed to fetch token list. Please try again.",
        customClass: { icon: "no-border" },
      });
    } finally {
      setLoader(false);
      isManualRefresh.current = false;
    }
  }

  return (
    <React.Fragment>
      {/* Filter row */}
      <div className="flex items-center justify-between mb-3">
        <NetworkFilterButton onSelect={(networkId: string) => {
          // Network switch via changeActiveNetwork triggers useEffect → fetchAssetsList
          // For "all" network, we need to manually fetch since no VM change occurs
          if (networkId === ALL_NETWORK_ID) {
            setAssetList([]);
            fetchAssetsList(networkId);
          }
        }} />
        <div className="flex items-center gap-2">
          {/* Refresh button */}
          <button
            type="button"
            className="h-8 w-8 rounded-full border border-dark-border bg-dark-card text-txt-secondary hover:text-white hover:bg-dark-surface flex items-center justify-center transition-colors disabled:opacity-40"
            disabled={isRefreshing}
            onClick={async () => {
              setIsRefreshing(true);
              isManualRefresh.current = true;
              clearListTokenCache();
              clearPortfolioCache();
              await fetchAssetsList(activeNetworkId);
              setIsRefreshing(false);
            }}
            aria-label="Refresh balance"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
          </button>
          {/* Import token button */}
          <button
            type="button"
            className="h-8 w-8 rounded-full border border-dark-border bg-dark-card text-txt-secondary hover:text-white hover:bg-dark-surface flex items-center justify-center transition-colors"
            onClick={() => navigate("/import-token")}
            aria-label="Import token"
          >
            <PlusCircle size={14} />
          </button>
        </div>
      </div>

      {/* Token list */}
      <div className="space-y-2">
        {assetList.map((token: any) => {
          const tokenChainIcon = chainIconMap[token.networkSymbol?.toUpperCase()] || "";
          const badgeIcon = tokenChainIcon || token.icon || tokenFallback;
          // Show chain name in "All networks" view to distinguish same-symbol tokens (e.g. ETH on Ethereum vs Arbitrum)
          const chainObj = isAllNetworks
            ? getAllEVMChains().find((c) => c.symbol.toUpperCase() === token.networkSymbol?.toUpperCase())
            : null;
          const chainLabel = chainObj?.name || (token.networkSymbol === "L1X" ? "LayerOneX" : "");
          return (
            <button
              key={`${token.tokenAddress || token.symbol}_${token.networkSymbol || ""}`}
              className="w-full flex items-center justify-between p-3  border border-dark-border rounded-2xl hover:bg-dark-surface"
              onClick={() => {
                sessionStorage.setItem("sendTokenData", JSON.stringify(token));
                navigate(`/send-token?symbol=${token.symbol}&origin=${token?.origin?.toString() || "EVM"}&network=${token?.networkSymbol || ""}&tokenAddress=${token?.tokenAddress || ""}`);
              }}
            >
              <div className="flex items-center gap-3">
                <div className="relative w-9 h-9">
                  {/* Main token icon */}
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-dark-surface flex items-center justify-center">
                    <img
                      src={token.icon || tokenFallback}
                      className="w-full h-full object-cover"
                      alt={token.symbol}
                      onError={(e) => { (e.target as HTMLImageElement).src = tokenFallback; }}
                    />
                  </div>
                  {/* Chain badge (bottom-right) — shows token's actual network */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-dark-card border border-dark-border overflow-hidden flex items-center justify-center">
                    <img
                      src={badgeIcon}
                      className="w-3 h-3 object-contain"
                      alt={token.networkSymbol}
                      onError={(e) => { (e.target as HTMLImageElement).src = tokenFallback; }}
                    />
                  </div>
                </div>

                <div className="text-left">
                  <p className="text-white text-sm font-medium">{token.symbol}</p>
                  {isAllNetworks && chainLabel && (
                    <p className="text-txt-muted text-[10px] leading-tight">{chainLabel}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-white text-sm font-medium">
                  $
                  {(+(token.balance * token.usdRate).toFixed(2)).toLocaleString(
                    "en-US",
                    { minimumFractionDigits: 2 }
                  )}
                </p>
                <p className="text-txt-muted text-xs">
                  {(+token.balance.toFixed(4)).toLocaleString()} {token.symbol}
                </p>
              </div>
            </button>
          )
        })}

        {loader &&
          new Array(3)
            .fill(1)
            .map((_, i) => (
              <Skeleton
                key={i}
                height={60}
                borderRadius={12}
                baseColor="#1a1d26"
                highlightColor="#22252e"
              />
            ))}

        {!loader && assetList.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-txt-muted text-sm">No tokens found</p>
            <p className="text-txt-muted/60 text-xs mt-1">
              Tokens with balance will appear here
            </p>
          </div>
        )}
      </div>
    </React.Fragment>
  );
};

export default Assets;
