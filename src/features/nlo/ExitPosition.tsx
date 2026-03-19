import { useContext, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronDown, ChevronUp, Edit2 } from "react-feather";
import PageHeader from "@ui/PageHeader";
import { AppContext } from "../../Auth.guard";
import { mockPositions, mockFundDistribution } from "./mock-data";

const ExitPosition = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const appContext = useContext(AppContext);
  const [amount, setAmount] = useState("");
  const [showSources, setShowSources] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const position = mockPositions.find((p) => p.id === id) || mockPositions[0];
  const available = position.currentValue;
  const numAmount = parseFloat(amount) || 0;
  const fees = numAmount > 0 ? +(numAmount * 0.012).toFixed(2) : 0;
  const youReceive = numAmount > 0 ? +(numAmount - fees).toFixed(2) : 0;

  const walletAddress =
    sessionStorage.getItem("nloDestinationWallet") ||
    appContext?.publicKey ||
    "0xf0d3499b...3F68FcA4e8E8";
  const truncated = walletAddress.length > 20
    ? `${walletAddress.slice(0, 10)}...${walletAddress.slice(-10)}`
    : walletAddress;

  function handleReview() {
    if (!numAmount || numAmount > available) return;
    setShowConfirmation(true);
  }

  function handleConfirm() {
    setShowConfirmation(false);
    navigate(
      `/transfer-processing?amount=${numAmount}&token=USDT&type=exit&wallet=${encodeURIComponent(walletAddress)}`
    );
  }

  return (
    <div className="app-frame mx-auto bg-dark-bg flex flex-col relative">
      <PageHeader title="" />

      <div className="flex-1 px-5 overflow-y-auto">
        <h1 className="text-white text-[18px] font-medium mb-5">Exit Position</h1>

        {/* Amount Input */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1">
            <label className="text-txt-muted text-[10px] uppercase tracking-wider">
              Enter Amount
            </label>
            <span className="text-txt-muted text-[10px] uppercase">
              Available: ${available.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
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

        {/* Withdrawal Fund Sources */}
        <div className="app-card p-4 mb-6">
          <button
            className="w-full flex items-center justify-between"
            onClick={() => setShowSources(!showSources)}
          >
            <span className="text-white text-sm font-medium">
              Withdrawal Fund Sources
            </span>
            {showSources ? (
              <ChevronUp size={16} className="text-txt-muted" />
            ) : (
              <ChevronDown size={16} className="text-txt-muted" />
            )}
          </button>

          {showSources && (
            <div className="space-y-3 mt-3">
              {mockFundDistribution.map((d) => (
                <div
                  key={d.name}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-txt-muted">{d.name}</span>
                  <span className="text-white">{d.defaultPercent}%</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-2">
            <p className="text-txt-muted text-[10px]">
              Default allocation is balanced. You can adjust it.
            </p>
            <button
              className="text-accent-blue text-[10px] font-medium"
              onClick={() => navigate("/nlo-know-more?context=exit")}
            >
              Know More
            </button>
          </div>
        </div>

        {/* Destination Details */}
        <h3 className="text-white text-sm font-medium mb-3">
          Destination details
        </h3>

        <div className="mb-4">
          <label className="text-txt-muted text-[10px] uppercase tracking-wider mb-1.5 block">
            Destination Wallet
          </label>
          <div className="flex items-center justify-between bg-dark-card border border-dark-border rounded-xl px-4 py-3">
            <span className="text-white text-sm font-mono">{truncated}</span>
            <button
              className="text-txt-muted hover:text-white"
              onClick={() =>
                navigate(
                  `/nlo-edit-wallet?return=exit&id=${id || ""}&address=${encodeURIComponent(
                    walletAddress
                  )}`
                )
              }
            >
              <Edit2 size={14} />
            </button>
          </div>
        </div>

        <div className="mb-4">
          <label className="text-txt-muted text-[10px] uppercase tracking-wider mb-1.5 block">
            You Will Receive
          </label>
          <div className="flex items-center justify-between">
            <button className="flex items-center gap-2 bg-dark-card border border-dark-border rounded-full px-4 py-2">
              <div className="w-6 h-6 rounded-full bg-accent-green flex items-center justify-center">
                <span className="text-white text-[8px] font-bold">$</span>
              </div>
              <span className="text-white text-sm font-medium">USDT</span>
            </button>
            <span className="text-white text-sm font-medium">
              {youReceive > 0 ? `${youReceive.toLocaleString()} USDT` : "—"}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <span className="text-txt-muted text-[10px] uppercase tracking-wider">
            Fees (Gas + Platform)
          </span>
          <span className="text-white text-sm">
            {fees > 0 ? `$${fees.toFixed(2)}` : "—"}
          </span>
        </div>
      </div>

      {/* Submit */}
      <div className="px-5 pb-5">
        <button
          className={`w-full py-3.5 rounded-xl text-sm font-medium ${
            !numAmount || numAmount > available
              ? "bg-dark-card border border-dark-border text-txt-muted cursor-not-allowed"
              : "bg-white text-dark-bg hover:bg-gray-100"
          }`}
          disabled={!numAmount || numAmount > available}
          onClick={handleReview}
        >
          Exit Position
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="w-[300px] bg-dark-card border border-dark-border rounded-[22px] p-6 text-center shadow-xl">
            <div className="w-12 h-12 rounded-full bg-[#2a1f12] border border-[#5a3b1a] flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 9v4m0 4h.01M10.29 3.86l-8.9 15.54A2 2 0 003.13 22h17.74a2 2 0 001.74-2.6l-8.9-15.54a2 2 0 00-3.42 0z"
                  stroke="#FF6A2E"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="text-white text-[18px] font-semibold mb-2">
              Strategy Adjustment
            </h3>
            <p className="text-txt-secondary text-[13px] mb-6 leading-5">
              Withdrawing funds will trigger a proportional rebalancing of your
              active strategies.
            </p>
            <button
              onClick={handleConfirm}
              className="w-full bg-white text-dark-bg py-3.5 rounded-xl text-sm font-semibold mb-3 hover:bg-gray-100"
            >
              Confirm Withdrawal
            </button>
            <button
              onClick={() => setShowConfirmation(false)}
              className="text-txt-secondary text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExitPosition;
