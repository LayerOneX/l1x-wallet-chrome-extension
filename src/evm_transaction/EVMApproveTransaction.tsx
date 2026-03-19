import { useEffect, useState } from "react";
import { ExtensionStorage } from "@util/ExtensionStorage.util";
import { Util } from "@util/Util";
import { Logger } from "@util/Logger.util";
import { getAccount } from "@util/Account.util";
import Spinner from "../components/Spinner";
import { Button } from "@ui/index";
import { ethers } from "ethers";
import { removeTransactionRequest } from "@util/Transaction.util";
import { Config } from "@util/Config.util";
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";

// Common ERC-20 function signatures for decoding
const ERC20_SIGNATURES: Record<string, string> = {
  "0x095ea7b3": "approve",
  "0xa9059cbb": "transfer",
  "0x23b872dd": "transferFrom",
};

function decodeCalldata(data: string): { method: string; description: string } | null {
  if (!data || data === "0x" || data.length < 10) return null;
  const selector = data.slice(0, 10).toLowerCase();
  const method = ERC20_SIGNATURES[selector];
  if (!method) return { method: "Contract Interaction", description: `Function: ${selector}` };

  try {
    const iface = new ethers.Interface([
      "function approve(address spender, uint256 amount)",
      "function transfer(address to, uint256 amount)",
      "function transferFrom(address from, address to, uint256 amount)",
    ]);
    const decoded = iface.parseTransaction({ data });
    if (!decoded) return { method, description: `${method}(...)` };

    switch (method) {
      case "approve":
        return {
          method: "Token Approval",
          description: `Approve ${Util.wrapPublicKey(decoded.args[0])} to spend tokens`,
        };
      case "transfer":
        return {
          method: "Token Transfer",
          description: `Transfer to ${Util.wrapPublicKey(decoded.args[0])}`,
        };
      case "transferFrom":
        return {
          method: "Token TransferFrom",
          description: `From ${Util.wrapPublicKey(decoded.args[1])} to ${Util.wrapPublicKey(decoded.args[2])}`,
        };
      default:
        return { method, description: `${method}(...)` };
    }
  } catch {
    return { method, description: `${method}(...)` };
  }
}

function hexToEth(hexValue: string): string {
  try {
    if (!hexValue || hexValue === "0x0" || hexValue === "0x") return "0";
    return ethers.formatEther(hexValue);
  } catch {
    return "0";
  }
}

// Map hex chain IDs to explorer base URLs
const CHAIN_EXPLORERS: Record<string, string> = {
  "0x1": Config.explorer.ethereum,
  "0x89": Config.explorer.polygon,
  "0x38": Config.explorer.binance,
  "0xa86a": Config.explorer.avalanche,
  "0xa": Config.explorer.optimisim,
  "0x42a": Config.explorer.l1x,
};

function getExplorerUrl(chainId: string, hash: string): string | null {
  const base = CHAIN_EXPLORERS[chainId?.toLowerCase()];
  if (!base) return null;
  const normalized = base.endsWith("/") ? base : base + "/";
  return normalized.includes("/tx") ? `${normalized}${hash}` : `${normalized}tx/${hash}`;
}

// ── M-02: Transaction Simulation & Approval Detection ──
// MAX_UINT256 used for reference: 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff

interface SimulationResult {
  status: "success" | "revert" | "error" | "pending";
  message: string;
}

function detectUnlimitedApproval(data: string): boolean {
  if (!data || data.length < 10) return false;
  const selector = data.slice(0, 10).toLowerCase();
  if (selector !== "0x095ea7b3") return false; // not approve()
  try {
    const iface = new ethers.Interface([
      "function approve(address spender, uint256 amount)",
    ]);
    const decoded = iface.parseTransaction({ data });
    if (!decoded) return false;
    const amount = decoded.args[1] as bigint;
    // Flag if amount >= 2^128 (effectively unlimited)
    return amount >= BigInt("0x100000000000000000000000000000000");
  } catch {
    return false;
  }
}

function detectHighValueTransfer(value: string, _data: string): boolean {
  // Flag native transfers > 1 ETH
  try {
    if (value && value !== "0x0" && value !== "0x") {
      const ethValue = parseFloat(ethers.formatEther(value));
      if (ethValue >= 1.0) return true;
    }
  } catch {}
  return false;
}

const EVMApproveTransaction = () => {
  const [transaction, setTransaction] = useState<IEVMDappTransaction | null>(null);
  const [account, setAccount] = useState<IXWalletAccount | null>(null);
  const [loader, setLoader] = useState(false);
  const [status, setStatus] = useState<"approve" | "sending" | "submitted" | "error">("approve");
  const [txHash, setTxHash] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [showRawData, setShowRawData] = useState(false);
  const [simulation, setSimulation] = useState<SimulationResult>({ status: "pending", message: "Simulating..." });
  const [tokenIcon, setTokenIcon] = useState<string>("");

  useEffect(() => {
    loadTransaction();
  }, []);

  useEffect(() => {
    if (transaction) {
      loadAccount();
      simulateTransaction(transaction);
    }
  }, [transaction]);

  async function simulateTransaction(tx: IEVMDappTransaction) {
    try {
      const rpcUrl = tx.rpcUrl || tx.rpc;
      if (!rpcUrl || !tx.to) {
        setSimulation({ status: "success", message: "Simulation skipped (no RPC)" });
        return;
      }

      const chainId = parseInt(tx.chainId || "0x38", 16);
      const network = new ethers.Network(chainId.toString(), chainId);
      const provider = new ethers.JsonRpcProvider(rpcUrl, network, {
        staticNetwork: network,
      });

      // Run eth_call to simulate
      await provider.call({
        from: tx.from,
        to: tx.to,
        data: tx.data || "0x",
        value: tx.value || "0x0",
      });

      setSimulation({ status: "success", message: "Transaction simulation passed" });
    } catch (err: any) {
      const msg = err?.message || "Unknown error";
      if (msg.includes("revert") || msg.includes("CALL_EXCEPTION")) {
        setSimulation({ status: "revert", message: "Transaction will likely fail (revert detected)" });
      } else {
        setSimulation({ status: "error", message: "Simulation unavailable" });
      }
      resolveTokenIcon(tx);
    }
  }

  function resolveTokenIcon(tx: IEVMDappTransaction) {
    try {
      // 1. Check reviewTokenIcon (set by SendToken for extension-initiated transfers)
      const icon = sessionStorage.getItem("reviewTokenIcon");
      if (icon) {
        setTokenIcon(icon);
        return;
      }
      // 2. Match token contract address from sendTokenData (set by Assets page)
      const raw = sessionStorage.getItem("sendTokenData");
      if (raw) {
        const token = JSON.parse(raw);
        if (
          token?.icon &&
          token.tokenAddress &&
          tx.to &&
          token.tokenAddress.toLowerCase() === tx.to.toLowerCase()
        ) {
          setTokenIcon(token.icon);
          return;
        }
      }
    } catch {
      // ignore parse errors
    }
  }

  async function loadTransaction() {
    try {
      const pendingTransactions = (await ExtensionStorage.get("pendingTransactions")) ?? [];
      console.log("[EVMApprove] pendingTransactions count:", pendingTransactions?.length);
      const evmTx = pendingTransactions.find(
        (tx) => tx.type === "evm-dapp-transaction"
      ) as IEVMDappTransaction | undefined;

      if (evmTx) {
        console.log("[EVMApprove] Found EVM tx, from:", evmTx.from, "to:", evmTx.to);
        setTransaction(evmTx);
      } else {
        console.error("[EVMApprove] No evm-dapp-transaction found, closing");
        window.close();
      }
    } catch (error: any) {
      Logger.error("loadTransaction", error);
      window.close();
    }
  }

  async function loadAccount() {
    try {
      if (!transaction) return;
      console.log("[EVMApprove] loadAccount called, from:", transaction.from);
      const acc = await getAccount(transaction.from, "EVM");
      console.log("[EVMApprove] getAccount result:", acc ? `found (${acc.publicKey})` : "NOT FOUND");
      if (acc) {
        setAccount(acc);
      } else {
        console.error("[EVMApprove] Account not found for address:", transaction.from);
        rejectRequest("Account not found for this address.");
      }
    } catch (error: any) {
      console.error("[EVMApprove] loadAccount error:", error);
      Logger.error("loadAccount", error);
      rejectRequest("Failed to load account.");
    }
  }

  async function rejectRequest(message = "Transaction rejected by user.") {
    if (transaction?.requestId) {
      await removeTransactionRequest(transaction.requestId);
    }
    Util.closeNotificationWindow(transaction?.requestId ?? "", {
      status: "failure",
      errorMessage: message,
      data: null,
      code: 4001,
    } as any);
  }

  async function approveRequest() {
    console.log("[EVMApprove] approveRequest called, account:", !!account, "transaction:", !!transaction);
    if (!account || !transaction) {
      console.error("[EVMApprove] approveRequest ABORTED — account:", account, "transaction:", transaction);
      return;
    }

    try {
      setLoader(true);
      setStatus("sending");
      console.log("[EVMApprove] Sending tx, rpcUrl:", transaction.rpcUrl || transaction.rpc, "to:", transaction.to);

      const rpcUrl = transaction.rpcUrl || transaction.rpc;
      const chainId = parseInt(transaction.chainId || "0x38", 16);
      const network = new ethers.Network(chainId.toString(), chainId);
      const provider = new ethers.JsonRpcProvider(rpcUrl, network, {
        staticNetwork: network,
      });
      const wallet = new ethers.Wallet(account.privateKey, provider);

      // Build transaction
      const txRequest: ethers.TransactionRequest = {
        to: transaction.to,
        value: transaction.value || "0x0",
        data: transaction.data || "0x",
      };

      // Chains that only support legacy (type 0) transactions
      const LEGACY_ONLY_CHAINS = [0x42a]; // L1X
      const forceLegacy = LEGACY_ONLY_CHAINS.includes(chainId);

      // Add gas params if provided
      if (transaction.gas) {
        txRequest.gasLimit = transaction.gas;
      }

      if (forceLegacy) {
        // Force legacy tx — strip EIP-1559 fields, use gasPrice only
        txRequest.type = 0;
        if (transaction.gasPrice) {
          txRequest.gasPrice = transaction.gasPrice;
        } else if (transaction.maxFeePerGas) {
          // Fall back to maxFeePerGas as gasPrice
          txRequest.gasPrice = transaction.maxFeePerGas;
        }
      } else {
        if (transaction.maxFeePerGas) {
          txRequest.maxFeePerGas = transaction.maxFeePerGas;
        }
        if (transaction.maxPriorityFeePerGas) {
          txRequest.maxPriorityFeePerGas = transaction.maxPriorityFeePerGas;
        }
        if (transaction.gasPrice && !transaction.maxFeePerGas) {
          txRequest.gasPrice = transaction.gasPrice;
        }
      }

      if (transaction.nonce) {
        txRequest.nonce = parseInt(transaction.nonce, 16);
      }

      // If no gas price params provided by the dApp, fetch from the network
      if (!txRequest.gasPrice && !txRequest.maxFeePerGas) {
        console.log("[EVMApprove] No gas price from dApp, fetching from network...");
        try {
          const feeData = await provider.getFeeData();
          console.log("[EVMApprove] Fee data:", JSON.stringify({
            gasPrice: feeData.gasPrice?.toString(),
            maxFeePerGas: feeData.maxFeePerGas?.toString(),
          }));
          if (feeData.gasPrice) {
            txRequest.gasPrice = feeData.gasPrice;
          }
        } catch (feeErr) {
          console.warn("[EVMApprove] Failed to fetch fee data, proceeding anyway:", feeErr);
        }
      }

      // Manually populate nonce and chainId to avoid ethers auto-fetch hangs
      console.log("[EVMApprove] Fetching nonce...");
      const nonce = txRequest.nonce ?? await provider.getTransactionCount(account.publicKey, "latest");
      console.log("[EVMApprove] Nonce:", nonce);
      txRequest.nonce = nonce;
      txRequest.chainId = chainId;

      console.log("[EVMApprove] Sending tx with params:", JSON.stringify({
        to: txRequest.to,
        gasLimit: txRequest.gasLimit?.toString(),
        gasPrice: txRequest.gasPrice?.toString(),
        value: txRequest.value?.toString(),
        nonce,
        chainId,
      }));

      // Sign transaction
      console.log("[EVMApprove] Signing transaction...");
      const signedTx = await wallet.signTransaction(txRequest);

      // Compute hash locally from signed tx (deterministic, no RPC needed)
      const parsedTx = ethers.Transaction.from(signedTx);
      const hash = parsedTx.hash!;
      console.log("[EVMApprove] Tx hash (local):", hash);

      // Broadcast in background — don't block on RPC response
      // (MetaMask pattern: show hash immediately, broadcast async)
      provider.broadcastTransaction(signedTx).then(() => {
        console.log("[EVMApprove] Broadcast confirmed by node");
      }).catch((err) => {
        console.warn("[EVMApprove] Broadcast error (tx may still be mined):", err?.message);
      });
      console.log("[EVMApprove] Transaction sent, hash:", hash);
      setTxHash(hash);
      setStatus("submitted");
      setLoader(false);

      // Save to transaction history immediately
      try {
        const savedTx = { ...transaction, hash };
        console.log("[EVMApprove] Saving tx to history:", JSON.stringify(savedTx, null, 2));
        const allTransactions = (await ExtensionStorage.get("transactions")) ?? [];
        console.log("[EVMApprove] Existing transactions count:", allTransactions.length);
        await ExtensionStorage.set("transactions", [savedTx, ...allTransactions]);
        // Verify save
        const verify = (await ExtensionStorage.get("transactions")) ?? [];
        console.log("[EVMApprove] After save, transactions count:", verify.length);
        console.log("[EVMApprove] First tx hash:", verify[0]?.hash);
      } catch (err) {
        console.error("[EVMApprove] FAILED to save tx to history:", err);
        Logger.error("Failed to save tx to history", err);
      }

      // Remove from pending
      if (transaction.requestId) {
        await removeTransactionRequest(transaction.requestId);
      }

      // Write deferred response directly to chrome.storage.local
      // so the content script relays it to the dApp page.
      // This bypasses the service worker (which may have gone idle).
      if (transaction.sdkRequestId) {
        console.log("[EVMApprove] Writing deferred response for sdkRequestId:", transaction.sdkRequestId);
        await chrome.storage.local.set({
          [`evm_response_${transaction.sdkRequestId}`]: {
            status: "success",
            errorMessage: "",
            data: { hash },
          },
        });
      } else {
        // Fallback: try service worker relay
        Util.respondToDapp(transaction.requestId ?? "", {
          status: "success",
          errorMessage: "",
          data: { hash },
        });
      }
    } catch (error: any) {
      Logger.error("approveRequest", error);
      setStatus("error");
      setErrorMsg(error?.message ?? "Transaction failed");
      setLoader(false);

      if (transaction?.requestId) {
        await removeTransactionRequest(transaction.requestId);
      }

      // Write failure via deferred storage (bypass service worker)
      if (transaction?.sdkRequestId) {
        await chrome.storage.local.set({
          [`evm_response_${transaction.sdkRequestId}`]: {
            status: "failure",
            errorMessage: error?.message ?? "Transaction failed",
            data: null,
            code: -32603,
          },
        }).catch(() => {});
      }
      Util.closeNotificationWindow(transaction?.requestId ?? "", {
        status: "failure",
        errorMessage: error?.message ?? "Transaction failed",
        data: null,
      });
    }
  }

  const decodedData = transaction ? decodeCalldata(transaction.data) : null;
  const valueInEth = transaction ? hexToEth(transaction.value) : "0";
  const isContractCall = transaction?.data && transaction.data !== "0x" && transaction.data.length > 2;
  const isUnlimitedApproval = transaction ? detectUnlimitedApproval(transaction.data) : false;
  const isHighValue = transaction ? detectHighValueTransfer(transaction.value, transaction.data) : false;

  if (!transaction || !account) {
    return (
      <div className="app-frame min-h-[auto] mx-auto p-3 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  // ── Transaction Submitted Screen ──
  if (status === "submitted" && txHash) {
    const explorerUrl = getExplorerUrl(transaction.chainId, txHash);
    return (
      <div className="app-frame min-h-[auto] mx-auto overflow-hidden p-3 flex flex-col items-center justify-center gap-4">
        <CheckCircleIcon className="w-16 h-16 text-accent-green" />
        <h3 className="text-xl font-semibold text-white">Transaction Submitted</h3>
        <p className="text-xs text-txt-secondary text-center">
          Your transaction has been submitted to the network.
        </p>

        {/* Tx Hash */}
        <div className="app-card-soft px-3 py-2 w-full">
          <div className="flex justify-between items-center">
            <span className="text-xs text-txt-secondary">Tx Hash</span>
            <span className="text-xs text-white font-mono">
              {Util.wrapPublicKey(txHash)}
            </span>
          </div>
        </div>

        {/* Explorer Link */}
        {explorerUrl && (
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-accent-green hover:underline"
          >
            View on Explorer
            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
          </a>
        )}

        {/* Close Button */}
        <div className="w-full mt-2">
          <Button
            variant="primary"
            fullWidth
            className="h-10 rounded-full text-black bg-white hover:bg-gray-100"
            onClick={() => window.close()}
          >
            Done
          </Button>
        </div>
      </div>
    );
  }

  // ── Error Screen ──
  if (status === "error") {
    return (
      <div className="app-frame min-h-[auto] mx-auto overflow-hidden p-3 flex flex-col items-center justify-center gap-4">
        <XCircleIcon className="w-16 h-16 text-red-500" />
        <h3 className="text-xl font-semibold text-white">Transaction Failed</h3>
        <p className="text-xs text-txt-secondary text-center px-2 break-words">
          {errorMsg || "An unknown error occurred."}
        </p>
        <div className="w-full mt-2">
          <Button
            variant="primary"
            fullWidth
            className="h-10 rounded-full text-black bg-white hover:bg-gray-100"
            onClick={() => window.close()}
          >
            Close
          </Button>
        </div>
      </div>
    );
  }

  // ── Approval Screen ──
  return (
    <div className="app-frame min-h-[auto] mx-auto overflow-hidden p-3 flex flex-col gap-3">
      {/* Site Info */}
      <div className="app-card-soft px-3 py-2.5">
        <div className="flex w-full items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            {(tokenIcon || transaction.siteFavIcon) && (
              <img
                src={tokenIcon || transaction.siteFavIcon}
                alt={tokenIcon ? "Token" : "Site"}
                className="h-9 w-9 rounded-full object-cover"
                onError={(e) => {
                  const img = e.currentTarget;
                  // If token icon failed, fall back to site favicon
                  if (tokenIcon && transaction.siteFavIcon && img.src !== transaction.siteFavIcon) {
                    img.src = transaction.siteFavIcon;
                  }
                }}
              />
            )}
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-white truncate">
              {transaction.site || "Unknown dApp"}
            </h4>
            <h6 className="text-xs text-txt-secondary truncate">
              {Util.wrapPublicKey(account.publicKey)}
            </h6>
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="text-center">
        <h3 className="text-xl leading-[1.1] font-semibold app-title">
          {isContractCall
            ? decodedData?.method ?? "Contract Interaction"
            : "Send Transaction"}
        </h3>
        {decodedData?.description && (
          <p className="mt-1 text-[13px] app-subtle">{decodedData.description}</p>
        )}
      </div>

      {/* Transaction Details */}
      <div className="min-h-0 flex-1 overflow-y-auto space-y-2">
        {/* Value */}
        {valueInEth !== "0" && (
          <div className="app-card-soft px-3 py-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-txt-secondary">Value</span>
              <span className="text-sm font-semibold text-white">
                {parseFloat(valueInEth).toFixed(6)} ETH
              </span>
            </div>
          </div>
        )}

        {/* From / To */}
        <div className="app-card-soft px-3 py-2 space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-xs text-txt-secondary">From</span>
            <span className="text-xs text-white font-mono">
              {Util.wrapPublicKey(transaction.from)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-txt-secondary">To</span>
            <span className="text-xs text-white font-mono">
              {Util.wrapPublicKey(transaction.to)}
            </span>
          </div>
        </div>

        {/* Raw Data Toggle */}
        {isContractCall && (
          <div className="app-card-soft px-3 py-2">
            <button
              className="text-xs text-txt-secondary hover:text-white w-full text-left"
              onClick={() => setShowRawData(!showRawData)}
            >
              {showRawData ? "Hide" : "Show"} Raw Data
            </button>
            {showRawData && (
              <p className="mt-1.5 text-[10px] text-txt-secondary font-mono break-all max-h-20 overflow-y-auto">
                {transaction.data}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Security Warnings */}
      {isUnlimitedApproval && (
        <div className="bg-red-900/30 border border-red-500/50 rounded-xl px-3 py-2.5">
          <p className="text-xs text-red-400 font-semibold">⚠ Unlimited Token Approval</p>
          <p className="text-[11px] text-red-300/80 mt-0.5">
            This dApp is requesting unlimited access to your tokens. A compromised dApp could drain all approved tokens.
          </p>
        </div>
      )}

      {isHighValue && !isUnlimitedApproval && (
        <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-xl px-3 py-2.5">
          <p className="text-xs text-yellow-400 font-semibold">⚠ High Value Transfer</p>
          <p className="text-[11px] text-yellow-300/80 mt-0.5">
            This transaction involves a significant amount. Please verify the recipient address.
          </p>
        </div>
      )}

      {simulation.status === "revert" && (
        <div className="bg-red-900/30 border border-red-500/50 rounded-xl px-3 py-2.5">
          <p className="text-xs text-red-400 font-semibold">⚠ Simulation Failed</p>
          <p className="text-[11px] text-red-300/80 mt-0.5">
            {simulation.message}
          </p>
        </div>
      )}

      {simulation.status === "success" && (
        <div className="bg-green-900/20 border border-green-500/30 rounded-xl px-3 py-1.5">
          <p className="text-[11px] text-green-400">✓ {simulation.message}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-auto shrink-0">
        <div className="text-center app-subtle text-[13px] mb-2.5">
          Only confirm transactions you trust.
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="tertiary"
            fullWidth
            className="h-10 rounded-full border bg-dark-card border-dark-border hover:bg-dark-surface hover:text-white"
            onClick={() => rejectRequest()}
            disabled={loader}
          >
            Reject
          </Button>
          <Button
            variant="primary"
            fullWidth
            className="h-10 rounded-full text-black bg-white hover:bg-gray-100 disabled:opacity-70 disabled:cursor-not-allowed"
            onClick={approveRequest}
            disabled={loader || !account}
          >
            {loader ? <Spinner /> : "Confirm"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EVMApproveTransaction;
