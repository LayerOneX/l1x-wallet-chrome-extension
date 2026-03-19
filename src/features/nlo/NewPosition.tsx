import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ChevronDown, ChevronUp } from "react-feather";
import PageHeader from "@ui/PageHeader";
import { mockFundDistribution } from "./mock-data";
import {
  DistItem,
  getRemainingPercent,
  normalizeDistribution,
} from "./utils/distribution";
import usdcIcon from "@assets/images/usdc-eth.png";

const STORAGE_KEY = "nlo_deposit_token";

const NewPosition = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [showDistribution, setShowDistribution] = useState(false);
  const [selectedToken, setSelectedToken] = useState({
    symbol: "USDC",
    name: "USD Coin",
    icon: usdcIcon,
    balance: 249.09,
  });
  const [distribution, setDistribution] = useState<DistItem[]>(
    mockFundDistribution.map((d) => ({ name: d.name, percent: d.defaultPercent }))
  );

  const numAmount = parseFloat(amount) || 0;
  const payableBalance = selectedToken.balance ?? 0;

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        symbol?: string;
        name?: string;
        icon?: string;
        balance?: number;
      };
      if (parsed?.symbol) {
        setSelectedToken((prev) => ({
          symbol: parsed.symbol || prev.symbol,
          name: parsed.name || prev.name,
          icon: parsed.icon || prev.icon,
          balance:
            typeof parsed.balance === "number" ? parsed.balance : prev.balance,
        }));
      }
    } catch {
      // ignore storage parsing errors
    }
  }, []);

  const remainingPercent = useMemo(
    () => getRemainingPercent(distribution),
    [distribution]
  );

  const computedDist = useMemo(() => {
    const amounts = distribution.map((d) =>
      Math.round((d.percent / 100) * numAmount)
    );
    const total = amounts.reduce((sum, amount) => sum + amount, 0);
    if (amounts.length) {
      amounts[amounts.length - 1] += Math.round(numAmount - total);
    }
    return distribution.map((d, idx) => ({
      strategy: d.name,
      amount: amounts[idx],
    }));
  }, [distribution, numAmount]);

  function updatePercent(index: number, value: number) {
    setDistribution((prev) => normalizeDistribution(prev, index, value));
  }

  return (
    <div className="app-frame mx-auto bg-dark-bg flex flex-col">
      <PageHeader title="" />

      <div className="flex-1 px-5 overflow-y-auto">
        <h1 className="text-white text-[18px] font-medium mb-4">
          New Position
        </h1>

        {/* Deposit Amount */}
        <div className="mb-6">
          <label className="text-txt-muted text-[10px] uppercase tracking-wider mb-1 block">
            Deposit Amount
          </label>
          <div className="flex items-baseline gap-1">
            <span className="text-txt-muted text-[32px] font-light">$</span>
            <input
              type="text"
              placeholder="0.00"
              className="bg-transparent text-white text-[32px] font-light outline-none w-full placeholder:text-txt-muted"
              value={amount}
              onChange={(e) => {
                if (!isNaN(e.target.value as any) || e.target.value === "") {
                  setAmount(e.target.value);
                }
              }}
            />
          </div>
        </div>

        {/* Fund Distribution */}
        <div className="app-card p-4 mb-6">
          <button
            className="w-full flex items-center justify-between mb-2"
            onClick={() => setShowDistribution(!showDistribution)}
          >
            <span className="text-white text-sm font-medium">
              Fund Distribution
            </span>
            {showDistribution ? (
              <ChevronUp size={16} className="text-txt-muted" />
            ) : (
              <ChevronDown size={16} className="text-txt-muted" />
            )}
          </button>

          {showDistribution && numAmount > 0 && (
            <div className="space-y-4 mt-3">
              {distribution.map((d, i) => (
                <div key={d.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-txt-muted text-[10px] uppercase tracking-wider">
                      {d.name}
                    </span>
                    <span className="text-white text-xs">
                      ${computedDist[i].amount}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={d.percent}
                    onChange={(e) =>
                      updatePercent(i, parseFloat(e.target.value))
                    }
                    className="nlo-slider cursor-pointer"
                    style={{
                      "--slider-color":
                        i === 0
                          ? "#2F80FF"
                          : i === 1
                            ? "#22D3EE"
                            : "#22C55E",
                      "--slider-shadow":
                        i === 0
                          ? "rgba(47, 128, 255, 0.2)"
                          : i === 1
                            ? "rgba(34, 211, 238, 0.2)"
                            : "rgba(34, 197, 94, 0.2)",
                    } as CSSProperties}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-2">
            <p className="text-txt-muted text-[10px]">
              Default allocation is balanced. You can adjust it.
            </p>
            <div className="flex items-center gap-3">
              {remainingPercent > 0 && (
                <span className="text-txt-muted text-[10px]">
                  Remaining {remainingPercent}%
                </span>
              )}
              <button
                className="text-accent-blue text-[10px] font-medium"
                onClick={() => navigate("/nlo-know-more?context=deposit")}
              >
                Know More
              </button>
            </div>
          </div>
        </div>

        {/* Token Selector */}
        <div className="mb-4">
          <label className="text-txt-muted text-[10px] uppercase tracking-wider mb-2 block">
            Select Token to Deposit From
          </label>
          <div className="flex items-center justify-between">
            <button
              className="flex items-center gap-2 bg-dark-card border border-dark-border rounded-full px-4 py-2"
              onClick={() => navigate("/nlo-select-token")}
            >
              <div className="w-6 h-6 rounded-full bg-dark-surface border border-dark-border overflow-hidden flex items-center justify-center">
                <img
                  src={selectedToken.icon}
                  alt={selectedToken.symbol}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-white text-sm font-medium">
                {selectedToken.symbol}
              </span>
              <ChevronDown size={12} className="text-txt-muted" />
            </button>
            <div className="text-right">
              <p className="text-txt-muted text-[10px] uppercase">Payable</p>
              <p className="text-white text-sm font-medium">
                {payableBalance.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                {selectedToken.symbol}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="px-5 pb-5">
        <button
          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-medium ${
            !numAmount || numAmount > payableBalance
              ? "bg-dark-card border border-dark-border text-txt-muted cursor-not-allowed"
              : "bg-XOrange text-white hover:bg-XOrange/90"
          }`}
          disabled={!numAmount || numAmount > payableBalance}
          onClick={() =>
            navigate(
              `/deposit-progress?amount=${numAmount}&token=${selectedToken.symbol}&distribution=${encodeURIComponent(JSON.stringify(computedDist))}`
            )
          }
        >
          {numAmount
            ? `Deposit $${numAmount.toFixed(0)}`
            : "Enter Deposit Amount"}
          {numAmount > 0 && <ArrowRight size={16} />}
        </button>
      </div>
    </div>
  );
};

export default NewPosition;
