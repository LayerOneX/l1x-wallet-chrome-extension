import { GetTransactionReceiptResponse } from "@l1x/l1x-wallet-sdk";
import { Util } from "@util/Util";
import { FC, MouseEvent as ReactMouseEvent, useContext, useState } from "react";
import { ArrowLeft, Check, Copy, ExternalLink } from "react-feather";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../Auth.guard";

const NativeTokenTxDetails: FC<GetTransactionReceiptResponse> = (receipt) => {
  const appContext = useContext(AppContext);
  const navigate = useNavigate();
  const [copied, setCopied] = useState("");
  const from = Util.add0xToString(receipt?.from);
  const to =
    (receipt?.transaction?.transaction as any)["NativeTokenTransfer"][
      "address"
    ] || "";
  const amount = appContext?.virtualMachine.formatDecimals(
    (receipt?.transaction?.transaction as any)["NativeTokenTransfer"][
      "amount"
    ] || 0
  );
  const networkName =
    appContext?.virtualMachine?.activeNetwork?.name ||
    appContext?.virtualMachine?.activeNetwork?.symbol ||
    "L1X";
  const displayNetworkName = networkName === "L1X" ? "Layer One X" : networkName;
  const tokenSymbol = appContext?.virtualMachine?.activeNetwork?.symbol || "L1X";
  const explorerBaseUrl =
    appContext?.virtualMachine?.activeNetwork?.exploreruri || "";
  const explorerUrl =
    explorerBaseUrl && receipt.transaction_hash
      ? `${explorerBaseUrl}${receipt.transaction_hash}`
      : "";

  function copyPublickey(event: ReactMouseEvent, data: string) {
    event.preventDefault();
    event.stopPropagation();
    if (!data) return;
    navigator.clipboard.writeText(data);
    setCopied(data);
    setTimeout(() => setCopied(""), 1000);
  }

  function formatDateTime() {
    const rawTimestamp =
      (receipt as any)?.timestamp || (receipt?.transaction as any)?.timestamp;
    if (!rawTimestamp) return "-";
    const numericTimestamp =
      typeof rawTimestamp === "string" ? Number(rawTimestamp) : rawTimestamp;
    if (!Number.isFinite(numericTimestamp)) return "-";

    const timestampInMs =
      numericTimestamp < 1_000_000_000_000
        ? numericTimestamp * 1000
        : numericTimestamp;
    const date = new Date(timestampInMs);
    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  }

  return (
    <div className="app-frame mx-auto overflow-y-auto px-4 pt-4 pb-4 relative flex flex-col bg-[#0B101A]">
      <div className="mb-2">
        <button
          className="text-[#7A8293] hover:text-white transition-colors"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-[18px] h-[18px]" />
        </button>
      </div>

      <div className="flex items-center justify-center mt-3 mb-4">
        <div className="relative w-[124px] h-[124px] flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[#1CCF72]/10" />
          <div className="absolute inset-[14px] rounded-full bg-[#1CCF72]/10" />
          <div className="w-[54px] h-[54px] rounded-full border-[3px] border-[#1CE47A] flex items-center justify-center bg-transparent">
            <Check className="w-[24px] h-[24px] text-[#1CE47A]" />
          </div>
        </div>
      </div>

      <h2 className="text-white text-[22px] leading-[1.08] font-normal tracking-[-0.01em] text-center">
        Transfer Complete
      </h2>
      {/* <p className="text-[#778096] text-[13px] mt-2 mb-5 text-center">
        within 59 seconds
      </p> */}

      <div className="w-full rounded-[16px] px-3 py-4 border border-[#263047] bg-[linear-gradient(180deg,#141B2A_0%,#131927_100%)]">
        <p className="text-[#717A90] text-[12px] tracking-[0.2em] text-center mb-1">
          AMOUNT TRANSFERRED
        </p>
        <h3 className="text-white text-[22px] leading-none font-medium text-center mb-3">
          {amount} {tokenSymbol}
        </h3>

        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 h-px bg-[#2A3348]" />
          <span className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#13B966]/14 text-[#1DDB79] text-[12px] whitespace-nowrap">
            Confirmed on {displayNetworkName}
            <span className="w-2 h-2 rounded-full bg-[#1DDB79]/80" />
          </span>
          <div className="flex-1 h-px bg-[#2A3348]" />
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] text-[#7E879A] tracking-[0.17em]">TX HASH</p>
            <a
              href={explorerUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-[12px] inline-flex items-center gap-1 ${explorerUrl ? "text-[#2E8BFF]" : "text-[#7E879A] pointer-events-none"}`}
            >
              {Util.wrapPublicKey(receipt.transaction_hash || "")}
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] text-[#7E879A] tracking-[0.17em]">FROM WALLET</p>
            <button
              className="text-white text-[12px] inline-flex items-center gap-1"
              onClick={(event) => copyPublickey(event, from)}
            >
              {Util.wrapPublicKey(from)}
              <Copy
                className={`w-3.5 h-3.5 ${copied === from ? "text-[#1DDB79]" : "text-[#7E879A]"}`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] text-[#7E879A] tracking-[0.17em]">TO WALLET</p>
            <button
              className="text-white text-[12px] inline-flex items-center gap-1"
              onClick={(event) => copyPublickey(event, to)}
            >
              {Util.wrapPublicKey(to)}
              <Copy
                className={`w-3.5 h-3.5 ${copied === to ? "text-[#1DDB79]" : "text-[#7E879A]"}`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] text-[#7E879A] tracking-[0.17em]">DATE & TIME</p>
            <p className="text-white text-[12px]">{formatDateTime()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-auto pt-4">
        <button
          className="h-12 rounded-[14px] bg-[linear-gradient(180deg,#1A2132_0%,#171D2B_100%)] border border-[#2A3348] text-white text-sm leading-none font-normal"
          onClick={() => navigate("/home")}
        >
          Back to Wallet
        </button>
        <a
          href={explorerUrl || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className={`h-12 rounded-[14px] text-sm leading-none font-normal inline-flex items-center justify-center ${
            explorerUrl
              ? "bg-[#F2F4F8] text-[#131722]"
              : "bg-slate-300 text-slate-600 pointer-events-none"
          }`}
        >
          View on Explorer
        </a>
      </div>
    </div>
  );
};

export default NativeTokenTxDetails;
