import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Search } from "react-feather";
import { getAllEVMChains } from "@virtual_machines/EVM";
import { AppContext } from "../../../Auth.guard";

type Variant = "compact" | "full";

export const NETWORK_FILTER_STORAGE_KEY = "wallet_network_filter";
export const ALL_NETWORK_ID = "all";

interface NetworkOption {
  id: string; // chainId as string — unique per network
  label: string;
  symbol: string;
  icon: string;
  chainId: number;
}

function buildNetworkList() {
  const allChains = getAllEVMChains();
  const idToChainId: Record<string, number> = {};
  const networks: NetworkOption[] = [];

  for (const chain of allChains) {
    const id = chain.chainId.toString();
    idToChainId[id] = chain.chainId;
    networks.push({
      id,
      label: chain.name,
      symbol: chain.symbol,
      icon: chain.icon,
      chainId: chain.chainId,
    });
  }

  return { idToChainId, networks };
}

/** Map chainId-string → symbol for external consumers (Assets.tsx) */
export function getIdToSymbol(): Record<string, string> {
  const { networks } = buildNetworkList();
  const map: Record<string, string> = {};
  for (const n of networks) map[n.id] = n.symbol;
  return map;
}

export function getNetworks() {
  return buildNetworkList().networks;
}

export const readSelectedNetwork = () => {
  try {
    const raw = sessionStorage.getItem(NETWORK_FILTER_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as string) : "";
    if (!parsed || parsed === ALL_NETWORK_ID) return ALL_NETWORK_ID;
    const { networks } = buildNetworkList();
    const ids = new Set(networks.map((n) => n.id));
    return ids.has(parsed) ? parsed : ALL_NETWORK_ID;
  } catch {
    return ALL_NETWORK_ID;
  }
};

const NetworkFilterButton = ({
  variant = "compact",
  onSelect,
}: {
  variant?: Variant;
  onSelect?: (networkId: string) => void;
}) => {
  const appContext = useContext(AppContext);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string>(readSelectedNetwork);

  useEffect(() => {
    sessionStorage.setItem(
      NETWORK_FILTER_STORAGE_KEY,
      JSON.stringify(selected)
    );
  }, [selected]);

  useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  const { networks } = useMemo(() => buildNetworkList(), [open]);
  const networksById = useMemo(() => new Map(networks.map((n) => [n.id, n])), [networks]);

  const label = useMemo(() => {
    if (selected === ALL_NETWORK_ID) return "All popular networks";
    return networksById.get(selected)?.label || "All popular networks";
  }, [selected, networksById]);

  const filteredNetworks = useMemo(() => {
    const q = search.toLowerCase();
    return networks.filter((n) => n.label.toLowerCase().includes(q));
  }, [search, networks]);

  const selectNetwork = useCallback(
    (id: string) => {
      setSelected(id);
      setOpen(false);
      // Write to sessionStorage synchronously so Assets.tsx reads the correct value
      // when useEffect fires after changeActiveNetwork
      sessionStorage.setItem(NETWORK_FILTER_STORAGE_KEY, JSON.stringify(id));
      onSelect?.(id);

      // When an EVM account is active, also switch the active network
      if (appContext?.type === "EVM" && id !== ALL_NETWORK_ID) {
        const allChains = getAllEVMChains();
        const targetChain = allChains.find(
          (chain) => chain.chainId.toString() === id
        );

        if (targetChain) {
          appContext.changeActiveNetwork(targetChain);
        }
      }
    },
    [appContext, onSelect]
  );

  // Only render EVM networks when the active account type is EVM
  if (appContext?.type !== "EVM") {
    return (
      <button className="flex items-center justify-between bg-dark-card border border-dark-border rounded-xl px-4 py-3 text-white text-[13px] font-medium">
        <span>L1X Network</span>
      </button>
    );
  }

  return (
    <>
      {variant === "compact" ? (
        <button
          className="flex items-center gap-2 text-white text-[13px] font-medium bg-dark-card border border-dark-border rounded-xl px-4 py-2.5"
          onClick={() => setOpen(true)}
        >
          {label}
          <ChevronDown size={14} className="text-txt-muted" />
        </button>
      ) : (
        <button
          className="w-full flex items-center justify-between bg-dark-card border border-dark-border rounded-xl px-4 py-3 text-white text-[13px] font-medium"
          onClick={() => setOpen(true)}
        >
          <span>{label}</span>
          <ChevronDown size={16} className="text-txt-muted" />
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50">
          <button
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
            aria-label="Close"
          />

          <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[400px]">
            <div
              className="sheet-enter bg-dark-card border border-dark-border rounded-t-[28px] px-5 pt-3 pb-6 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 rounded-full bg-dark-border mx-auto mb-4" />

              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-white text-sm font-semibold">Select Networks</p>
                </div>
              </div>

              <div className="relative mb-3">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search networks"
                  className="w-full bg-dark-surface border border-dark-border rounded-xl px-4 py-2.5 pr-9 text-white text-[12px] outline-none placeholder:text-txt-muted"
                />
                <Search
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-txt-muted"
                />
              </div>

              <div className="space-y-2">
                <button
                  className={`w-full flex items-center justify-between bg-dark-surface border rounded-2xl px-4 py-2 text-left ${selected === ALL_NETWORK_ID
                      ? "border-accent-blue/40"
                      : "border-dark-border"
                    }`}
                  onClick={() => selectNetwork(ALL_NETWORK_ID)}
                >
                  <span className="text-white text-sm font-medium">
                    All popular networks
                  </span>
                  {selected === ALL_NETWORK_ID && (
                    <span className="w-6 h-6 rounded-full bg-accent-blue/15 flex items-center justify-center">
                      <Check size={14} className="text-accent-blue" />
                    </span>
                  )}
                </button>

                {filteredNetworks.map((network) => {
                  const active = selected === network.id;
                  return (
                    <button
                      key={network.id}
                      className={`w-full flex items-center justify-between bg-dark-surface border rounded-2xl px-4 py-2 text-left ${active ? "border-accent-blue/40" : "border-dark-border"
                        }`}
                      onClick={() => selectNetwork(network.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-dark-card border border-dark-border overflow-hidden flex items-center justify-center">
                          {network.icon ? (
                            <img
                              src={network.icon}
                              alt={network.label}
                              className="w-5 h-5 object-contain"
                            />
                          ) : (
                            <span className="text-white text-[11px] font-bold">
                              {network.label.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className="text-white text-sm font-medium">
                          {network.label}
                        </span>
                      </div>
                      {active && (
                        <span className="w-6 h-6 rounded-full bg-accent-blue/15 flex items-center justify-center">
                          <Check size={14} className="text-accent-blue" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NetworkFilterButton;
