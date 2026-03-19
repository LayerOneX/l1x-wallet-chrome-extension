import { FormEvent, useContext, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppContext } from "../../../Auth.guard";
import { isAddress, ethers } from "ethers";
import { v4 as uuidv4 } from "uuid";
import Spinner from "@components/Spinner";
import Swal from "sweetalert2";
import { XCircleIconHtml } from "@components/XCircleIconHtml";
import { Util } from "@util/Util";
import { toFixedIfNeeded } from "@util/Helper";
import PageHeader from "@ui/PageHeader";
import PriceLoader from "@components/PriceLoader";
import { TokenImage } from "@ui/index";
import { RefreshCw } from "react-feather";
import VirtualMachineFactory from "@factory/VirtualMachine.factory";
import { Config } from "@util/Config.util";
import { EVM_CHAINS } from "@virtual_machines/EVM";
import { ExtensionStorage } from "@util/ExtensionStorage.util";
// DeBank removed — using RPC-based listToken() for all chains

const SendToken = () => {
  const appContext = useContext(AppContext);
  const navigate = useNavigate();
  const [searchPrams] = useSearchParams();
  const [tokenList, setTokenList] = useState<IToken[]>([]);
  const [selectedToken, setSelectedToken] = useState<IToken>({} as IToken);
  const [receiverAddress, setReveiverAddress] = useState("");
  const [transferAmount, setTransferAmount] = useState<number>("" as any);
  const [isFiatMode, setIsFiatMode] = useState(false);
  const [fiatInput, setFiatInput] = useState<string>("");
  const [loader, setLoader] = useState(false);
  const [tokenListLoader, setTokenListLoader] = useState(true);
  const [preselectedFromSession, setPreselectedFromSession] = useState(false);
  const networkParam = searchPrams.get("network");
  const validReceiverAddress = isAddress(receiverAddress);
  const ownTransfer =
    Util.removePrefixOx(receiverAddress) ==
    Util.removePrefixOx(appContext?.publicKey || "");
  // disableSubmit is finalised after effectiveTokenAmount is declared (see below)
  const _pendingDisableBase =
    !selectedToken ||
    !receiverAddress ||
    !validReceiverAddress ||
    loader ||
    ownTransfer ||
    tokenListLoader;

  useEffect(() => {
    if (appContext?.virtualMachine) {
      // Skip RPC-heavy fetchTokenList if token was already preselected from Assets page
      if (preselectedFromSession) return;
      let timeoutid = setTimeout(() => {
        fetchTokenList();
      }, 500);
      return () => {
        clearTimeout(timeoutid);
      };
    }
  }, [appContext?.virtualMachine, preselectedFromSession]);

  // On mount, try to load the exact token from sessionStorage (set by Assets page).
  // Don't remove it yet — keep it so cancel/back from review can re-read it.
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("sendTokenData");
      if (stored) {
        const token = JSON.parse(stored) as IToken;
        console.log("[SendToken] from sessionStorage →", token.symbol, { tokenAddress: token.tokenAddress, icon: token.icon, isNative: token.isNative });
        if (token?.symbol) {
          setSelectedToken(token);
          setTokenListLoader(false);
          setPreselectedFromSession(true);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    // Don't override if token was already loaded from sessionStorage
    if (preselectedFromSession) return;

    const symbol = searchPrams.get("symbol");
    const tokenAddress = searchPrams.get("tokenAddress");
    if (tokenList.length && symbol) {
      // Match by both symbol and tokenAddress for accuracy across chains
      let match = tokenAddress
        ? tokenList.find(
            (el) => el.symbol === symbol && el.tokenAddress?.toLowerCase() === tokenAddress.toLowerCase()
          )
        : null;
      if (!match) {
        match = tokenList.find((el) => el.symbol === symbol);
      }
      setSelectedToken(match || tokenList[0]);
    }
  }, [tokenList, searchPrams, preselectedFromSession]);


  function getNetworkVm() {
    if (networkParam && networkParam !== "L1X") {
      const chain = EVM_CHAINS.find(
        (c) => c.symbol.toUpperCase() === networkParam.toUpperCase()
      );
      if (chain) {
        return VirtualMachineFactory.createVirtualMachine(
          "EVM",
          appContext?.publicKey || "",
          chain.chainId?.toString() || ""
        );
      }
    }
    return appContext?.virtualMachine;
  }

  // @ts-ignore: TS6133 — kept for potential future use
  async function resolveEvmPublicKey(): Promise<string> {
    let evmPublicKey = appContext?.publicKey || "";
    if (appContext?.type !== "EVM") {
      const storage = await ExtensionStorage.get("wallets");
      const l1xAcc = storage?.L1X?.find(
        (w: any) => w.publicKey === appContext?.publicKey
      );
      if (l1xAcc) {
        const evmAcc = storage?.EVM?.find(
          (w: any) => w.privateKey?.trim() === l1xAcc.privateKey?.trim()
        );
        if (evmAcc) evmPublicKey = evmAcc.publicKey;
      }
    }
    return evmPublicKey;
  }

  async function fetchTokenList() {
    try {
      setTokenListLoader(true);
      const vm = getNetworkVm();

      // Use RPC-based listToken() for all chains
      const list = await vm?.listToken();
      const activeNetworkChainId = vm?.activeNetwork?.chainId;

      if (activeNetworkChainId === Config.chainId.l1x) {
        const L1XVm = VirtualMachineFactory.createVirtualMachine("L1X", "");
        const l1xTokenList = await L1XVm.listToken();
        setTokenList([...(list || []), ...(l1xTokenList || [])]);
      } else {
        setTokenList(list || []);
      }
    } catch (error) {
      Swal.fire({
        iconHtml: XCircleIconHtml,
        title: "Failed",
        text: "Failed to fetch token list. Please try again.",
        customClass: { icon: "no-border" },
      });
    } finally {
      setTokenListLoader(false);
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ): Promise<void> {
    try {
      event.preventDefault();
      setLoader(true);
      if (!appContext?.virtualMachine) {
        throw new Error("Account not found.");
      }
      const transactionId = uuidv4();

      // Pass token icon to Review page via sessionStorage (Portfolio API icons are more reliable than TrustWallet CDN)
      if (selectedToken?.icon) {
        console.log("[SendToken] Setting reviewTokenIcon in sessionStorage:", selectedToken.icon);
        sessionStorage.setItem("reviewTokenIcon", selectedToken.icon);
      } else {
        console.log("[SendToken] No icon on selectedToken, skipping reviewTokenIcon", selectedToken);
      }

      const origin = searchPrams.get("origin");
      if (origin === "L1X") {
        const L1XVm = VirtualMachineFactory.createVirtualMachine("L1X", appContext?.publicKey ,"1066");

        const transaction: Transaction = {
          id: transactionId,
          timestamp: Date.now(),
          type: "transfer-token",
          from: appContext?.publicKey || "",
          to: receiverAddress,
          tokenAddress: selectedToken?.tokenAddress || "",
          amount:
            L1XVm.convertToDecimals(
              effectiveTokenAmount,
              selectedToken.decimals
            ) || "",
          source: "extension",
          symbol: selectedToken?.symbol || "",
          decimals: selectedToken?.decimals,
          networkType: L1XVm.networkType,
          chainId:
            L1XVm.activeNetwork.chainId.toString(),
          rpc: L1XVm.activeNetwork.rpc,
        }

        L1XVm.initiateTransaction(transaction);
      } else {
        const vm = getNetworkVm() || appContext.virtualMachine;
        const transaction: Transaction = selectedToken?.isNative
          ? {
            id: transactionId,
            timestamp: Date.now(),
            type: "transfer-native-token",
            from: appContext?.publicKey || "",
            to: receiverAddress,
            amount:
              vm.convertToDecimals(
                effectiveTokenAmount,
                selectedToken.decimals
              ) || "",
            source: "extension",
            symbol: selectedToken.symbol,
            decimals: selectedToken?.decimals,
            networkType: vm.networkType,
            chainId:
              vm.activeNetwork.chainId.toString(),
            rpc: vm.activeNetwork.rpc,
          }
          : {
            id: transactionId,
            timestamp: Date.now(),
            type: "transfer-token",
            from: appContext?.publicKey || "",
            to: receiverAddress,
            tokenAddress: selectedToken?.tokenAddress || "",
            amount:
              vm.convertToDecimals(
                effectiveTokenAmount,
                selectedToken.decimals
              ) || "",
            source: "extension",
            symbol: selectedToken?.symbol || "",
            decimals: selectedToken?.decimals,
            networkType: vm.networkType,
            chainId:
              vm.activeNetwork.chainId.toString(),
            rpc: vm.activeNetwork.rpc,
          };
        vm.initiateTransaction(transaction);
      }
    } catch (error: any) {
      console.error("[SendToken] handleSubmit error:", error, { origin: searchPrams.get("origin"), network: searchPrams.get("network"), selectedToken, effectiveTokenAmount, receiverAddress });
      Swal.fire({
        iconHtml: XCircleIconHtml,
        title: "Failed",
        text: error?.errorMessage || error?.message || "Failed to initiate transaction.",
        customClass: { icon: "no-border" },
      });
    } finally {
      setLoader(false);
    }
  }

  const usdRate = selectedToken?.usdRate || 0;

  // Token amount derived from fiat input when in fiat mode
  // Truncate to token's decimal precision to avoid ethers NUMERIC_FAULT
  const decimals = selectedToken?.decimals || 18;
  const tokenAmountFromFiat = isFiatMode && fiatInput && usdRate
    ? Math.floor((parseFloat(fiatInput) / usdRate) * 10 ** decimals) / 10 ** decimals
    : 0;

  // The actual token amount used for validation & submission
  const effectiveTokenAmount = isFiatMode ? tokenAmountFromFiat : transferAmount;

  const disableSubmit =
    _pendingDisableBase ||
    !effectiveTokenAmount ||
    effectiveTokenAmount > selectedToken.balance ||
    effectiveTokenAmount <= 0;

  const usdValue = !isFiatMode && transferAmount
    ? (transferAmount * usdRate).toFixed(4)
    : "0.0000";

  const availableUsd = selectedToken?.balance
    ? (selectedToken.balance * usdRate).toFixed(4)
    : "0.0000";

  function handleToggleFiatMode() {
    if (!usdRate) return; // can't toggle without price data
    setIsFiatMode((prev) => {
      const next = !prev;
      if (next) {
        // Switching to fiat: pre-fill fiat from current token amount
        if (transferAmount) {
          setFiatInput((transferAmount * usdRate).toFixed(4));
        } else {
          setFiatInput("");
        }
      } else {
        // Switching to token: pre-fill token from current fiat input
        if (fiatInput && usdRate) {
          const tokenAmt = parseFloat(fiatInput) / usdRate;
          setTransferAmount(isNaN(tokenAmt) ? ("" as any) : tokenAmt);
        } else {
          setTransferAmount("" as any);
        }
      }
      return next;
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="app-frame mx-auto bg-dark-bg overflow-y-auto flex flex-col">
        <PageHeader title="You're Sending" onBack={() => {
          // Clean up send-flow sessionStorage when leaving the send flow
          sessionStorage.removeItem("sendTokenData");
          sessionStorage.removeItem("reviewTokenIcon");
          navigate(-1);
        }} />

        <div className="flex-1 px-5 flex flex-col">
          {/* Token icon & name */}
          <div className="flex flex-col items-center mt-4 mb-8">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-dark-surface flex items-center justify-center mb-3 border-2 border-dark-border">
              {tokenListLoader ? (
                <PriceLoader />
              ) : (
                <TokenImage
                  src={selectedToken?.icon}
                  alt={selectedToken?.symbol}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <h2 className="text-white text-[18px] font-semibold">
              {selectedToken?.symbol || "Select Token"}
            </h2>
            <p className="text-txt-muted text-[11px]">
              From {networkParam
                ? (EVM_CHAINS.find(c => c.symbol.toUpperCase() === networkParam.toUpperCase())?.name || networkParam)
                : (appContext?.virtualMachine?.activeNetwork?.name || "network")}
            </p>
          </div>

          {/* TO WALLET */}
          <div className="mb-4">
            <label className="text-txt-muted text-[10px] uppercase tracking-wider mb-2 block">
              To Wallet
            </label>
            <input
              type="text"
              placeholder="Enter or paste address"
              className="w-full bg-dark-card border border-dark-border rounded-xl px-4 py-3 text-white text-sm placeholder:text-txt-muted outline-none focus:border-txt-muted"
              value={receiverAddress}
              onChange={(e) => setReveiverAddress(e.target.value)}
            />
            {receiverAddress && !validReceiverAddress && (
              <p className="text-accent-red text-xs mt-1">
                Please enter a valid address
              </p>
            )}
            {ownTransfer && (
              <p className="text-accent-red text-xs mt-1">
                Cannot transfer to own account
              </p>
            )}
          </div>

          {/* AMOUNT */}
          <div className="mb-2">
            <label className="text-txt-muted text-[10px] uppercase tracking-wider mb-2 block">
              Amount
            </label>
            <div className="flex items-center bg-dark-card border border-dark-border rounded-xl px-4 py-3">
              {isFiatMode ? (
                <input
                  type="text"
                  placeholder="0.00"
                  className="flex-1 bg-transparent text-white text-sm outline-none"
                  value={fiatInput}
                  onChange={(e) => {
                    if (!isNaN(e.target.value as any)) {
                      setFiatInput(e.target.value);
                    }
                  }}
                />
              ) : (
                <input
                  type="text"
                  placeholder="0.00"
                  className="flex-1 bg-transparent text-white text-sm outline-none"
                  value={transferAmount}
                  onChange={(e) => {
                    if (!isNaN(e.target.value as any)) {
                      setTransferAmount(toFixedIfNeeded(e.target.value) as any);
                    }
                  }}
                />
              )}
              <div className="flex items-center gap-2 text-txt-secondary text-sm">
                <span>{isFiatMode ? "USD" : (selectedToken?.symbol || "")}</span>
                <button
                  type="button"
                  title="Toggle USD / Token"
                  onClick={handleToggleFiatMode}
                  disabled={!usdRate}
                  className="disabled:opacity-30 hover:text-white transition-colors"
                >
                  <RefreshCw size={14} className="text-txt-muted" />
                </button>
              </div>
            </div>
          </div>

          {/* Converted sub-label + Available — single row */}
          <div className="flex items-center justify-between mb-6 px-1">
            {isFiatMode ? (
              <span className="text-txt-muted text-xs">
                ≈ {tokenAmountFromFiat > 0 ? tokenAmountFromFiat.toFixed(2) : "0.00"} {selectedToken?.symbol || ""}
              </span>
            ) : (
              <span className="text-txt-muted text-xs">${usdValue}</span>
            )}
            <span className="text-txt-muted text-xs">
              Available: {parseFloat((selectedToken?.balance ?? 0).toString()).toFixed(4)} {selectedToken?.symbol || ""} (${availableUsd}){" "}
              <button
                type="button"
                className="text-accent-blue text-xs font-medium ml-1"
                onClick={async () => {
                  if (!selectedToken?.balance) return;

                  if (selectedToken.isNative) {
                    // For native tokens (BNB, ETH, etc.), reserve enough for gas fees
                    try {
                      const vm = getNetworkVm() || appContext?.virtualMachine;
                      if (vm && vm.networkType === "EVM") {
                        const provider = vm.getProvider();
                        const feeData = await provider.getFeeData();
                        const gasPrice = feeData.gasPrice ?? feeData.maxFeePerGas ?? 0n;
                        // Standard transfer gas (21000) + 50% buffer for safety
                        const gasReserve = BigInt(31500) * gasPrice;
                        const balanceWei = ethers.parseUnits(
                          selectedToken.balance.toString(),
                          selectedToken.decimals || 18
                        );
                        const maxSendWei = balanceWei - gasReserve;
                        if (maxSendWei > 0n) {
                          const maxSend = parseFloat(
                            ethers.formatUnits(maxSendWei, selectedToken.decimals || 18)
                          );
                          if (isFiatMode) {
                            setFiatInput((maxSend * usdRate).toFixed(2));
                          } else {
                            setTransferAmount(maxSend as any);
                          }
                        } else {
                          // Balance too low to cover gas — set full balance, let validation catch it
                          if (isFiatMode) {
                            setFiatInput((selectedToken.balance * usdRate).toFixed(2));
                          } else {
                            setTransferAmount(selectedToken.balance as any);
                          }
                        }
                      } else {
                        if (isFiatMode) {
                          setFiatInput((selectedToken.balance * usdRate).toFixed(2));
                        } else {
                          setTransferAmount(selectedToken.balance as any);
                        }
                      }
                    } catch {
                      // Fallback: use full balance if gas estimation fails
                      if (isFiatMode) {
                        setFiatInput((selectedToken.balance * usdRate).toFixed(2));
                      } else {
                        setTransferAmount(selectedToken.balance as any);
                      }
                    }
                  } else {
                    // ERC20/BEP20 tokens: gas is paid in native coin, send full balance
                    if (isFiatMode) {
                      setFiatInput((selectedToken.balance * usdRate).toFixed(2));
                    } else {
                      setTransferAmount(selectedToken.balance as any);
                    }
                  }
                }}
              >
                MAX
              </button>
            </span>
          </div>
        </div>

        {/* Continue button */}
        <div className="px-5 pb-5">
          <button
            className={`w-full py-3.5 rounded-xl text-sm font-medium ${disableSubmit
              ? "bg-dark-card border border-dark-border text-txt-muted cursor-not-allowed"
              : "bg-white text-dark-bg hover:bg-gray-100"
              }`}
            disabled={disableSubmit}
            type="submit"
          >
            {loader ? <Spinner /> : "Continue"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default SendToken;
