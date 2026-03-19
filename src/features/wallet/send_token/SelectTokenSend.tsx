import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../../Auth.guard";
import { Search } from "react-feather";
import PageHeader from "@ui/PageHeader";
import Skeleton from "react-loading-skeleton";
import Swal from "sweetalert2";
import { XCircleIconHtml } from "@components/XCircleIconHtml";
import { TokenImage } from "@ui/index";
import NetworkFilterButton from "@features/wallet/components/NetworkFilterButton";

const SelectTokenSend = () => {
  const appContext = useContext(AppContext);
  const navigate = useNavigate();
  const [tokenList, setTokenList] = useState<IToken[]>([]);
  const [loader, setLoader] = useState(true);
  const [search, setSearch] = useState("");

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

  const filtered = useMemo(
    () =>
      tokenList.filter(
        (t) =>
          t.symbol.toLowerCase().includes(search.toLowerCase()) ||
          t.name?.toLowerCase().includes(search.toLowerCase())
      ),
    [tokenList, search]
  );

  const prioritizedTokens = useMemo(() => {
    const scoreToken = (token: IToken) => {
      const symbol = token.symbol?.toUpperCase?.() || "";
      if (token.isNative) return 3;
      if (symbol === "USDT" || symbol === "USDC") return 2;
      return 1;
    };

    return [...filtered].sort((a, b) => scoreToken(b) - scoreToken(a));
  }, [filtered]);

  return (
    <div className="app-frame mx-auto bg-dark-bg flex flex-col">
      <PageHeader title="Select token to send" />

      <div className="px-5 flex-1 overflow-y-auto pb-4">
        {/* Search */}
        <div className="relative mb-3">
          <input
            type="text"
            placeholder="Search token or assets to send"
            className="w-full bg-dark-card border border-dark-border rounded-xl px-4 py-3 pr-10 text-white text-sm placeholder:text-txt-muted outline-none focus:border-txt-muted"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-txt-muted"
          />
        </div>

        {/* Network filter */}
        <div className="mb-3">
          <NetworkFilterButton variant="full" />
        </div>

        {/* Token list */}
        <div className="space-y-2">
          {prioritizedTokens.map((token) => (
            <button
              key={token.tokenAddress || token.symbol}
              className="w-full flex items-center justify-between p-3 bg-dark-card border border-dark-border rounded-2xl hover:bg-dark-surface"
              onClick={() => navigate(`/send-token?symbol=${token.symbol}`)}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-dark-surface flex items-center justify-center">
                  <TokenImage
                    src={token.icon}
                    alt={token.symbol}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-left">
                  <p className="text-white text-sm font-medium">
                    {token.symbol}
                  </p>
                  <p className="text-txt-muted text-xs">
                    {token.name || token.symbol}
                  </p>
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

export default SelectTokenSend;
