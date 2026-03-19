import { useNavigate, useSearchParams } from "react-router-dom";
import { Copy, ExternalLink } from "react-feather";
import { useState } from "react";

const WithdrawalComplete = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [copied, setCopied] = useState("");

  const amount = params.get("amount") || "0";
  const wallet = decodeURIComponent(params.get("wallet") || "");

  // Mock transaction data
  const txHash = "0x8A...2B9C";
  const dateTime = new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const truncatedWallet = wallet.length > 16
    ? `${wallet.slice(0, 5).toUpperCase()}...${wallet.slice(-5).toUpperCase()}`
    : wallet;

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  }

  return (
    <div className="app-frame mx-auto bg-dark-bg flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Success Icon */}
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-full border border-accent-green/30 flex items-center justify-center shadow-[0_0_0_14px_rgba(34,197,94,0.08)]">
            <div className="w-16 h-16 rounded-full bg-accent-green/10 flex items-center justify-center">
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
          </div>
        </div>

        <h1 className="text-white text-[22px] font-semibold mb-1">
          Withdrawal Complete
        </h1>
        <p className="text-txt-secondary text-[13px] mb-8">
          Funds have been sent to your wallet
        </p>

        {/* Details Card */}
        <div className="w-full bg-dark-card border border-dark-border rounded-2xl p-4">
          <div className="text-center mb-4 pb-4 border-b border-dark-border">
            <p className="text-txt-muted text-[10px] uppercase tracking-wider mb-1">
              Amount Transferred
            </p>
            <p className="text-white text-[22px] font-semibold">
              ${parseFloat(amount).toLocaleString()}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-txt-muted text-[10px] uppercase">
                To Wallet
              </span>
              <button
                onClick={() => copyText(wallet, "wallet")}
                className="flex items-center gap-2 text-white text-xs font-mono"
              >
                {truncatedWallet}
                <Copy
                  size={12}
                  className={copied === "wallet" ? "text-accent-green" : "text-txt-muted"}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-txt-muted text-[10px] uppercase">TX Hash</span>
              <button className="flex items-center gap-2 text-accent-green text-xs font-mono">
                {txHash}
                <ExternalLink size={12} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-txt-muted text-[10px] uppercase">
                Date & Time
              </span>
              <span className="text-white text-xs">{dateTime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Button */}
      <div className="px-4 pb-5">
        <button
          onClick={() => navigate("/portfolio")}
          className="w-full bg-white text-dark-bg py-3.5 rounded-xl text-sm font-medium hover:bg-gray-100"
        >
          Return to Portfolio
        </button>
      </div>
    </div>
  );
};

export default WithdrawalComplete;
