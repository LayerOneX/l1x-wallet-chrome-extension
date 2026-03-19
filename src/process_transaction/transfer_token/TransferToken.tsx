import { ArrowRight, Copy } from "react-feather";
import { Tooltip } from "react-tooltip";
import { FC, useEffect, useState } from "react";
import { Util } from "@util/Util";
import classNames from "classnames";
import Swal from "sweetalert2";
import { XCircleIconHtml } from "../../components/XCircleIconHtml";
import Spinner from "../../components/Spinner";
import { ProviderAttrib } from "@l1x/l1x-wallet-sdk";
import { removeTransactionRequest } from "@util/Transaction.util";
import { ethers } from "ethers";

const TransferToken: FC<
  ITransferToken & {
    virtualMachine: IVirtualMachine;
    account: IXWalletAccount;
    onSuccess?: (hash?: string) => void;
    providerAttrib?: ProviderAttrib;
  }
> = (transaction) => {
  const [tokenDetails, setTokenDetails] = useState<IToken>();
  const [loader, setLoader] = useState(false);
  const [tokenDetailLoader, setTokenDetailLoader] = useState(true);
  const [copied, setCopied] = useState(false);
  const [feelimit, setFeelimit] = useState<string>();
  const [estimatedFee, setEstimatedFee] = useState<string>();
  const [nonce, setNonce] = useState("");
  const [configError, setConfigError] = useState("");
  const transactionAmount = tokenDetails
    ? +transaction.amount / 10 ** tokenDetails.decimals
    : 0;
  const tokenSymbol = tokenDetails?.symbol || transaction.symbol || "TOKEN";
  const [sessionIcon] = useState(() => {
    const icon = sessionStorage.getItem("reviewTokenIcon");
    console.log("[TransferToken] sessionStorage reviewTokenIcon:", icon);
    if (icon) sessionStorage.removeItem("reviewTokenIcon");
    return icon || "";
  });
  const tokenIcon =
    sessionIcon || tokenDetails?.icon || transaction?.virtualMachine?.activeNetwork?.icon;
  console.log("[TransferToken] resolved tokenIcon:", tokenIcon, "| sessionIcon:", sessionIcon, "| tokenDetails.icon:", tokenDetails?.icon, "| network.icon:", transaction?.virtualMachine?.activeNetwork?.icon);
  const usdValue = tokenDetails?.usdRate
    ? (transactionAmount * tokenDetails.usdRate).toFixed(2)
    : "0.00";

  useEffect(() => {
    fetchTokenDetails();
    getTransactionConfig();
    window.addEventListener("beforeunload", handleClose);
    return () => {
      window.removeEventListener("beforeunload", handleClose);
    };
  }, []);

  function handleClose(event: BeforeUnloadEvent) {
    if (loader) {
      event.preventDefault();
    }
  }

  async function getTransactionConfig() {
    try {
      const nonce = await transaction.virtualMachine.getCurrentNonce(
        transaction.providerAttrib
      );
      setNonce(transaction.nonce ?? nonce ?? "");
      const gasLimit = await transaction.virtualMachine.getEstimateFee(
        transaction.providerAttrib,
        {
          type: "TOKEN",
          tokenAddress: transaction.tokenAddress,
          from: transaction.from,
          to: transaction.to,
          amount: transaction.amount,
        }
      );
      const resolvedGasLimit = gasLimit || transaction.feeLimit || undefined;
      setFeelimit(resolvedGasLimit);

      // Compute estimated fee in native token (gasLimit × gasPrice)
      if (resolvedGasLimit && transaction.virtualMachine.networkType === "EVM") {
        try {
          const provider = transaction.virtualMachine.getProvider(
            transaction.providerAttrib
          );
          const feeData = await provider.getFeeData();
          const gasPrice = feeData.gasPrice ?? feeData.maxFeePerGas;
          if (gasPrice) {
            const fee = BigInt(resolvedGasLimit) * gasPrice;
            setEstimatedFee(ethers.formatEther(fee));
          }
        } catch {
          // Fee display is non-critical
        }
      }
    } catch (error: any) {
      setConfigError(
        error?.errorMessage || "Network connection failed. Fee estimation unavailable."
      );
      if (transaction.nonce) {
        setNonce(transaction.nonce);
      }
    }
  }

  async function fetchTokenDetails() {
    try {
      setTokenDetailLoader(true);
      const details = await transaction.virtualMachine.getTokenDetails(
        transaction.tokenAddress,
        transaction.providerAttrib
      );
      if (!details.symbol) {
        throw new Error("Invalid token details.");
      }
      setTokenDetails(details);
    } catch (error: any) {
      await transaction.virtualMachine.removePendingTransaction(transaction.id);
      Swal.fire({
        iconHtml: XCircleIconHtml,
        title: "Failed",
        text: error?.errorMessage ?? "Failed to fetch token details. Check your network connection.",
        customClass: {
          icon: "no-border",
        },
      });
      Util.closeNotificationWindow(transaction.requestId ?? "", {
        status: "failure",
        errorMessage: error,
        data: null,
      });
    } finally {
      setTokenDetailLoader(false);
    }
  }

  async function confirmTransaction() {
    try {
      setLoader(true);
      const response = await transaction.virtualMachine.transferToken(
        transaction.tokenAddress,
        transaction.to,
        +transaction.amount,
        transaction.account.privateKey,
        transaction.providerAttrib,
        feelimit,
        nonce
      );
      if (!response?.hash) {
        throw { errorMessage: "Failed to process transaction. Please try again." };
      }
      transaction.hash = response?.hash;

      // add transaction to transaction list
      await transaction?.virtualMachine.addTransaction(
        transaction,
        transaction.providerAttrib?.endpoint
      );

      // handle transaction success
      if (transaction.source == "dapp") {
        Util.closeNotificationWindow(transaction.requestId ?? "", {
          status: "success",
          errorMessage: "",
          data: {
            hash: transaction.hash,
          },
        });
      } else {
        if (
          transaction.onSuccess &&
          typeof transaction.onSuccess == "function"
        ) {
          transaction.onSuccess(transaction.hash);
        }
      }
    } catch (error: any) {
      if (transaction.source != "dapp") {
        Swal.fire({
          iconHtml: XCircleIconHtml,
          title: "Failed",
          text:
            error?.errorMessage ??
            "Failed to process transaction. Please try again.",
          customClass: {
            icon: "no-border",
          },
        });
      } else {
        await removeTransactionRequest(transaction.requestId ?? "");
        Util.closeNotificationWindow(transaction.requestId ?? "", {
          status: "failure",
          errorMessage: error,
          data: null,
        });
      }
    } finally {
      setLoader(false);
    }
  }

  function copyReceiverAddress() {
    navigator.clipboard.writeText(transaction?.to ?? "");
    setCopied(true);
  }

  async function rejectTransaction() {
    await transaction?.virtualMachine.removePendingTransaction(transaction.id);
    if (transaction.source == "dapp") {
      Util.closeNotificationWindow(transaction.requestId ?? "", {
        status: "failure",
        errorMessage: "Transaction rejected by user.",
        data: null,
      });
    }
  }

  return (
    <div className="app-frame mx-auto bg-dark-bg flex flex-col">
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        <h1 className="text-white text-[16px] font-medium">Review Sending</h1>
        {/* {origin && (
          <span className="text-[10px] text-txt-muted">Request from {origin}</span>
        )} */}
      </div>

      <div className="flex-1 px-5 overflow-y-auto">
        <div className="flex flex-col items-center mt-2 mb-6">
          <div className="w-14 h-14 rounded-full bg-dark-surface border border-dark-border flex items-center justify-center overflow-hidden">
            {tokenIcon ? (
              <img
                src={tokenIcon}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const fallback = transaction?.virtualMachine?.activeNetwork?.icon;
                  if (fallback && (e.target as HTMLImageElement).src !== fallback) {
                    (e.target as HTMLImageElement).src = fallback;
                  }
                }}
              />
            ) : (
              <div className="w-full h-full bg-accent-blue/30" />
            )}
          </div>
          <h2 className="text-white text-[22px] font-semibold mt-3">
            {transactionAmount.toLocaleString()} {tokenSymbol}
          </h2>
          <p className="text-txt-muted text-[12px]">${usdValue}</p>
        </div>

        <div className="bg-dark-card border border-dark-border rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between bg-dark-surface rounded-xl px-3 py-3">
            <div>
              <p className="text-[10px] text-txt-muted uppercase tracking-wider">
                Sending From
              </p>
              <p className="text-white text-sm font-medium">
                {transaction.account.accountName}
              </p>
            </div>
            <ArrowRight size={16} className="text-txt-muted" />
            <div className="text-right">
              <p className="text-[10px] text-txt-muted uppercase tracking-wider">
                To Wallet
              </p>
              <button
                className="text-white text-sm font-medium flex items-center gap-1"
                onClick={() => copyReceiverAddress()}
                data-tooltip-id="copy-publickey-click"
              >
                {Util.wrapPublicKey(transaction.to)}
                <Copy size={12} className="text-txt-muted" />
              </button>
              {copied && (
                <Tooltip
                  className="font-normal !bg-dark-surface !text-white shadow-lg !opacity-100 border border-dark-border !text-[12px]"
                  id="copy-publickey-click"
                  content="Copied!"
                  defaultIsOpen={true}
                  afterShow={() => setTimeout(() => setCopied(false), 1000)}
                  events={["click"]}
                />
              )}
            </div>
          </div>

          <div className="space-y-2 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-txt-muted">Network</span>
              <span className="text-white">
                {transaction?.virtualMachine?.activeNetwork?.name || "Network"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-txt-muted">Interacting with</span>
              <span className="text-white">{tokenSymbol}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-txt-muted">Estimated Fee</span>
              <span className="text-white">
                {estimatedFee
                  ? `~${parseFloat(estimatedFee).toFixed(6)} ${transaction?.virtualMachine?.activeNetwork?.nativeToken?.symbol || "ETH"}`
                  : feelimit
                    ? "Estimating..."
                    : "—"}
              </span>
            </div>
          </div>

          {configError && (
            <div className="mt-3 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-amber-400 text-[11px]">{configError}</p>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 pb-5 grid grid-cols-2 gap-3">
        <button
          className="py-3 rounded-xl text-sm font-medium bg-dark-card border border-dark-border text-white hover:bg-dark-surface"
          type="button"
          onClick={rejectTransaction}
          disabled={loader || tokenDetailLoader}
        >
          Cancel
        </button>
        <button
          className={classNames(
            loader || tokenDetailLoader || (!!configError && !nonce)
              ? "bg-white/60 text-dark-bg cursor-not-allowed"
              : "bg-white text-dark-bg hover:bg-gray-100",
            "py-3 rounded-xl text-sm font-semibold flex items-center justify-center"
          )}
          disabled={loader || tokenDetailLoader || (!!configError && !nonce)}
          onClick={confirmTransaction}
        >
          {loader ? <Spinner /> : "Continue"}
        </button>
      </div>
    </div>
  );
};

export default TransferToken;
