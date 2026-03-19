import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "react-feather";
import Skeleton from "react-loading-skeleton";
import Swal from "sweetalert2";
import PageHeader from "@ui/PageHeader";
import { AppContext } from "../../Auth.guard";
import { XCircleIconHtml } from "@components/XCircleIconHtml";
import { TokenImage } from "@ui/index";
import NetworkFilterButton, {
  ALL_NETWORK_ID,
  getNetworks,
  readSelectedNetwork,
} from "@features/wallet/components/NetworkFilterButton";

const STORAGE_KEY = "nlo_deposit_token";

const SelectDepositToken = () => {
  const appContext = useContext(AppContext);
  const navigate = useNavigate();
  const [tokenList, setTokenList] = useState<IToken[]>([]);
  const [loader, setLoader] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState<string>(
    readSelectedNetwork()
  );

  useEffect(() => {
    if (appContext?.virtualMachine) {
      fetchTokenList();
    }
  }, [appContext?.virtualMachine]);

  async function fetchTokenList() {
    try {
      setLoader(true);
      const list = await appContext?.virtualMachine.listToken();
      setTokenList(list || []);
    } catch (error: any) {
      Swal.fire({
        iconHtml: XCircleIconHtml,
        title: "Failed",
        text: error?.errorMessage || "Failed to fetch token list.",
        customClass: { icon: "no-border" },
      });
    } finally {
      setLoader(false);
    }
  }

  const filtered = tokenList.filter(
    (t) =>
      t.symbol.toLowerCase().includes(search.toLowerCase()) ||
      t.name?.toLowerCase().includes(search.toLowerCase())
  );

  const activeNetwork = useMemo(() => {
    if (selectedNetwork === ALL_NETWORK_ID) return null;
    return getNetworks().find((n) => n.id === selectedNetwork);
  }, [selectedNetwork]);

  const networkLabel =
    activeNetwork?.label ||
    appContext?.virtualMachine?.activeNetwork?.name ||
    "All networks";
  const networkIcon =
    activeNetwork?.icon || appContext?.virtualMachine?.activeNetwork?.icon;

  function handleSelect(token: IToken) {
    const payload = {
      symbol: token.symbol,
      name: token.name,
      icon: token.icon || "",
      balance: token.balance,
      usdRate: token.usdRate,
      networkId: selectedNetwork,
      networkLabel,
      networkIcon,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    navigate("/new-position");
  }

  return (
    <div className="app-frame mx-auto bg-dark-bg flex flex-col">
      <PageHeader title="Select token to deposit" />

      <div className="px-5 flex-1 overflow-y-auto pb-4">
        <div className="relative mb-3">
          <input
            type="text"
            placeholder="Search token or assets to deposit"
            className="w-full bg-dark-card border border-dark-border rounded-xl px-4 py-3 pr-10 text-white text-sm placeholder:text-txt-muted outline-none focus:border-txt-muted"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-txt-muted"
          />
        </div>

        <div className="mb-3">
          <NetworkFilterButton
            variant="full"
            onSelect={(id) => setSelectedNetwork(id)}
          />
        </div>

        <div className="space-y-2">
          {filtered.map((token) => (
            <button
              key={token.tokenAddress || token.symbol}
              className="w-full flex items-center justify-between p-3 bg-dark-card border border-dark-border rounded-2xl hover:bg-dark-surface"
              onClick={() => handleSelect(token)}
            >
              <div className="flex items-center gap-3">
                <div className="relative w-9 h-9 rounded-full bg-dark-surface flex items-center justify-center">
                  <TokenImage
                    src={token.icon}
                    alt={token.symbol}
                    className="w-full h-full object-cover rounded-full"
                  />
                  {networkIcon && (
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-dark-card border border-dark-border flex items-center justify-center">
                      <img
                        src={networkIcon}
                        alt={networkLabel}
                        className="w-3 h-3 object-contain"
                      />
                    </span>
                  )}
                </div>
                <div className="text-left">
                  <p className="text-white text-sm font-medium">
                    {token.symbol}
                  </p>
                  <p className="text-txt-muted text-xs">{networkLabel}</p>
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
          ))}

          {!loader && filtered.length === 0 && (
            <div className="text-center text-txt-muted text-sm py-10">
              No tokens found
            </div>
          )}

          {loader &&
            new Array(5).fill(1).map((_, i) => (
              <Skeleton
                key={i}
                height={60}
                borderRadius={12}
                baseColor="#1a1d26"
                highlightColor="#22252e"
              />
            ))}
        </div>
      </div>
    </div>
  );
};

export default SelectDepositToken;
