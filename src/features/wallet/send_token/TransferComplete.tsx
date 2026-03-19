import { useNavigate, useSearchParams } from "react-router-dom";
import { Copy } from "react-feather";
import { useState } from "react";
import PageHeader from "@ui/PageHeader";

const TransferComplete = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [copiedField, setCopiedField] = useState("");

  const amount = searchParams.get("amount") || "0";
  const symbol = searchParams.get("symbol") || "TOKEN";
  const txHash = searchParams.get("txHash") || "";
  const fromWallet = searchParams.get("from") || "";
  const toWallet = searchParams.get("to") || "";
  const network = searchParams.get("network") || "Ethereum";
  const time = searchParams.get("time") || new Date().toLocaleString();

  function copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(""), 1500);
  }

  function truncateAddress(addr: string) {
    if (!addr || addr.length < 12) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
  }

  return (
    <div className="app-frame mx-auto bg-dark-bg flex flex-col">
      <PageHeader title="" onBack={() => navigate("/home")} />

      <div className="flex-1 px-5 flex flex-col items-center">
        {/* Success icon */}
        <div className="mt-6 mb-4 relative">
          <div className="w-20 h-20 rounded-full border border-accent-green/40 flex items-center justify-center bg-dark-bg shadow-[0_0_0_12px_rgba(34,197,94,0.08)]">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#10B981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="absolute inset-0 rounded-full border-2 border-accent-green/30 animate-ping" />
        </div>

        <h2 className="text-white text-[22px] font-semibold mb-1">
          Transfer Complete
        </h2>
        <p className="text-txt-muted text-[13px] mb-6">
          Funds have been sent to destination wallet
        </p>

        {/* Details card */}
        <div className="w-full bg-dark-card border border-dark-border rounded-2xl p-4 mb-auto">
          <p className="text-txt-muted text-[10px] uppercase tracking-wider text-center mb-1">
            Amount Transferred
          </p>
          <h3 className="text-white text-[22px] font-semibold text-center mb-3">
            {amount} {symbol}
          </h3>

          {/* Confirmed badge */}
          <div className="flex justify-center mb-4">
            <span className="inline-flex items-center gap-2 bg-accent-green/10 text-accent-green text-[11px] px-3 py-1 rounded-full">
              Confirmed on {network}
              <span className="w-2 h-2 rounded-full bg-accent-green flex items-center justify-center">
                <span className="w-1 h-1 rounded-full bg-dark-bg" />
              </span>
            </span>
          </div>

          {/* TX Details */}
          <div className="space-y-3 text-[11px]">
            {txHash && (
              <div className="flex items-center justify-between">
                <span className="text-txt-muted">TX HASH</span>
                <button
                  className="flex items-center gap-1 text-accent-blue"
                  onClick={() => copyToClipboard(txHash, "hash")}
                >
                  {truncateAddress(txHash)}
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </button>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-txt-muted">FROM WALLET</span>
              <button
                className="flex items-center gap-1 text-white"
                onClick={() => copyToClipboard(fromWallet, "from")}
              >
                {truncateAddress(fromWallet)}
                <Copy
                  size={10}
                  className={
                    copiedField === "from"
                      ? "text-accent-green"
                      : "text-txt-muted"
                  }
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-txt-muted">TO WALLET</span>
              <button
                className="flex items-center gap-1 text-white"
                onClick={() => copyToClipboard(toWallet, "to")}
              >
                {truncateAddress(toWallet)}
                <Copy
                  size={10}
                  className={
                    copiedField === "to"
                      ? "text-accent-green"
                      : "text-txt-muted"
                  }
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-txt-muted">DATE & TIME</span>
              <span className="text-white">{time}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom buttons */}
      <div className="px-5 pb-5 grid grid-cols-2 gap-3">
        <button
          className="py-3 rounded-xl text-sm font-medium bg-dark-card border border-dark-border text-white hover:bg-dark-surface"
          onClick={() => {
            if (txHash) {
              navigate(`/transaction-details/${txHash}`);
            }
          }}
        >
          View on Explorer
        </button>
        <button
          className="py-3 rounded-xl text-sm font-medium bg-white text-dark-bg hover:bg-gray-100"
          onClick={() => navigate("/home")}
        >
          Back to Wallet
        </button>
      </div>
    </div>
  );
};

export default TransferComplete;
