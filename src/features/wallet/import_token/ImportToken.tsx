import classNames from "classnames";
import { FormEvent, useContext, useEffect, useMemo, useState } from "react";
import { CheckCircle, ChevronDown, Clipboard, Loader, X } from "react-feather";
import { useNavigate } from "react-router-dom";
import Spinner from "@components/Spinner";
// import { useDebouncedCallback } from "use-debounce";
import { AppContext } from "../../../Auth.guard";
import Swal from "sweetalert2";
import { XCheckCircleIconHtml } from "@components/XCheckCircleIconHtml";
import { XCircleIconHtml } from "@components/XCircleIconHtml";
import { Config } from "@util/Config.util";
import VirtualMachineFactory from "@factory/VirtualMachine.factory";
import { getAllEVMChains, loadCustomChains } from "@virtual_machines/EVM";
import { clearListTokenCache } from "@virtual_machines/EVM";
import { ExtensionStorage } from "@util/ExtensionStorage.util";
import VirtualMachine from "@virtual_machines/VirtualMachine";
import evmFallbackIcon from "@assets/images/evm.svg";
import { isAddress } from "ethers";
// DeBank removed — using RPC for all token lookups

const ImportToken = () => {
  const navigate = useNavigate();
  const appContext = useContext(AppContext);
  const [isL1X, setIsL1X] = useState(false);
  const [selectedChainId, setSelectedChainId] = useState<string>("");
  const [activeVm, setActiveVm] = useState<VirtualMachine | null>(null);
  const [chainDropdownOpen, setChainDropdownOpen] = useState(false);
  const [form, setForm] = useState({
    tokenAddress: "",
    tokenDetails: null as
      | {
          symbol: string;
          decimals: number;
          icon?: string;
        }
      | null,
    lookupLoader: false,
    submitLoader: false,
  });
  // const debounce = useDebouncedCallback(fetchTokenDetails, 100);
  const isLoadingTokenDetails =
    form.lookupLoader && !!form.tokenAddress.trim() && !form.tokenDetails;
  const disableSubmit =
    !form.tokenDetails || form.lookupLoader || form.submitLoader;
  const showInvalidAddressState =
    !!form.tokenAddress.trim() && !form.lookupLoader && !form.tokenDetails;

  const [evmChains, setEvmChains] = useState(() => getAllEVMChains());

  useEffect(() => {
    loadCustomChains().then((chains) => {
      setEvmChains(chains);
    });
  }, []);

  const allChains = useMemo(() => {
    return evmChains.map((c) => ({
      label: c.name,
      symbol: c.symbol,
      icon: c.icon || evmFallbackIcon,
      chainId: c.chainId,
    }));
  }, [evmChains]);

  const selectedChain = useMemo(() => {
    const found = allChains.find((c) => c.chainId.toString() === selectedChainId);
    return found || allChains[0];
  }, [selectedChainId, allChains]);

  useEffect(() => {
    const currentChainId =
      appContext?.virtualMachine?.activeNetwork?.chainId?.toString() || "";
    const matches = allChains.some((c) => c.chainId.toString() === currentChainId);
    setSelectedChainId(matches ? currentChainId : allChains[0]?.chainId?.toString() || "");
  }, [appContext?.virtualMachine, allChains]);

  useEffect(() => {
    if (!selectedChainId) return;
    createLocalVm(selectedChainId);
    resetForm();
  }, [selectedChainId]);

  useEffect(() => {
    if (form.tokenAddress) {
      // debounce(form.tokenAddress);
    } else {
      // resetForm();
    }
  }, [form.tokenAddress]);

  async function createLocalVm(chainId: string) {
    let publicKey = appContext?.publicKey || "";
    if (appContext?.type !== "EVM") {
      const storage = await ExtensionStorage.get("wallets");
      const l1xAcc = storage?.L1X?.find(
        (w: any) => w.publicKey === appContext?.publicKey,
      );
      if (l1xAcc) {
        const evmAcc = storage?.EVM?.find(
          (w: any) => w.privateKey?.trim() === l1xAcc.privateKey?.trim(),
        );
        if (evmAcc) publicKey = evmAcc.publicKey;
      }
    }
    const vm = VirtualMachineFactory.createVirtualMachine("EVM", publicKey, chainId);
    setActiveVm(vm);
    setIsL1X(false);
  }

  function resetForm() {
    setForm((prevState) => ({
      ...prevState,
      tokenAddress: "",
      tokenDetails: null,
      lookupLoader: false,
      submitLoader: false,
    }));
    setIsL1X(false);
  }

  async function pasteTokenAddress() {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (!clipboardText) return;
      setForm((prevState) => ({
        ...prevState,
        tokenAddress: clipboardText.trim(),
      }));
    } catch {
      // Ignore clipboard read errors
    }
  }

  async function fetchTokenDetails(tokenAddress: string) {
    try {
      setForm((prevState) => ({
        ...prevState,
        lookupLoader: true,
      }));

      let tokenDetails: { symbol: string; decimals: number; icon?: string } | null | undefined = null;

      // Resolve public key for EVM VM
      let publicKey = appContext?.publicKey || "";
      if (appContext?.type !== "EVM") {
        const storage = await ExtensionStorage.get("wallets");
        const l1xAcc = storage?.L1X?.find((w: any) => w.publicKey === appContext?.publicKey);
        if (l1xAcc) {
          const evmAcc = storage?.EVM?.find((w: any) => w.privateKey?.trim() === l1xAcc.privateKey?.trim());
          if (evmAcc) publicKey = evmAcc.publicKey;
        }
      }

      // Create VM fresh using current selectedChainId — avoids race with activeVm state
      const chainId = selectedChain?.chainId?.toString() || selectedChainId;
      const vm = VirtualMachineFactory.createVirtualMachine("EVM", publicKey, chainId);
      tokenDetails = await vm.getTokenDetails(tokenAddress);

      if (
        selectedChain?.chainId === Config.chainId.l1x &&
        (!tokenDetails?.symbol)
      ) {
        const L1XVm = VirtualMachineFactory.createVirtualMachine("L1X", "");
        tokenDetails = await L1XVm.getTokenDetails(tokenAddress);
        setIsL1X(true);
      }

      if (!tokenDetails?.symbol) {
        throw new Error("Token not found");
      }
      setForm((prevState) => ({
        ...prevState,
        tokenDetails: {
          symbol: tokenDetails!.symbol || "",
          decimals: tokenDetails!.decimals || 0,
          icon: tokenDetails!.icon || "",
        },
      }));
    } catch {
      setForm((prevState) => ({
        ...prevState,
        tokenDetails: null,
      }));
    } finally {
      setForm((prevState) => ({
        ...prevState,
        lookupLoader: false,
      }));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    try {
      event.preventDefault();
      setForm((prevState) => ({
        ...prevState,
        submitLoader: true,
      }));

      let tokenImported: boolean | undefined;
      if (isL1X) {
        const L1XVm = VirtualMachineFactory.createVirtualMachine("L1X", "");
        tokenImported = await L1XVm.importToken(form.tokenAddress);
      } else {
        tokenImported = await activeVm?.importToken(form.tokenAddress);
      }

      if (!tokenImported) {
        throw "Failed to import token. Please try again.";
      }
      clearListTokenCache();
      Swal.fire({
        iconHtml: XCheckCircleIconHtml,
        title: "Success",
        text: "Token imported successfully!",
        customClass: { icon: "no-border" },
      });
      navigate("/");
    } catch {
      Swal.fire({
        iconHtml: XCircleIconHtml,
        title: "Failed",
        text: "Failed to import token. Please try again.",
        customClass: { icon: "no-border" },
      });
    } finally {
      setForm((prevState) => ({
        ...prevState,
        submitLoader: false,
      }));
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="app-frame mx-auto overflow-y-auto px-5 pt-5 pb-6 relative flex flex-col bg-dark-bg">
        <div className="flex-grow-[1]">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl leading-none font-normal tracking-[-0.02em] text-white">
              Import Token
            </h1>
            <button
              className="w-10 h-10 rounded-full text-txt-muted hover:text-white hover:bg-dark-card flex items-center justify-center transition-colors"
              onClick={() => navigate(-1)}
              type="button"
              aria-label="Close import token"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <p className="text-[13px] text-txt-muted mb-4">
            Add a custom token by pasting its contract address.
          </p>

          {/* Network selector */}
          <div className="app-card rounded-2xl p-4 mb-4">
            <p className="text-[10px] tracking-[0.18em] text-txt-muted mb-3">
              NETWORK
            </p>
            <div className="relative">
              <button
                type="button"
                className="w-full flex items-center justify-between bg-dark-surface border border-dark-border rounded-xl px-4 py-3 text-white text-[13px] font-medium"
                onClick={() => setChainDropdownOpen((prev) => !prev)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-dark-card flex items-center justify-center">
                    <img
                      src={selectedChain?.icon || evmFallbackIcon}
                      alt={selectedChain?.symbol}
                      className="w-4 h-4 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = evmFallbackIcon;
                      }}
                    />
                  </div>
                  <span>{selectedChain?.label || "Select Network"}</span>
                </div>
                <ChevronDown size={14} className="text-txt-muted" />
              </button>

              {chainDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-dark-card border border-dark-border rounded-xl overflow-hidden shadow-lg max-h-[240px] overflow-y-auto">
                  {allChains.map((chain) => {
                    const active = chain.chainId.toString() === selectedChainId;
                    return (
                      <button
                        key={`${chain.symbol}-${chain.chainId}`}
                        type="button"
                        className={classNames(
                          "w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors",
                          active
                            ? "bg-dark-surface text-white"
                            : "text-txt-secondary hover:bg-dark-surface hover:text-white"
                        )}
                        onClick={() => {
                          setSelectedChainId(chain.chainId.toString());
                          setChainDropdownOpen(false);
                        }}
                      >
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-dark-surface flex items-center justify-center">
                          <img
                            src={chain.icon || evmFallbackIcon}
                            alt={chain.symbol}
                            className="w-4 h-4 object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = evmFallbackIcon;
                            }}
                          />
                        </div>
                        <span>{chain.label}</span>
                        {active && (
                          <CheckCircle size={14} className="ml-auto text-accent-blue" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3 mt-1">
            <div className="relative">
              <p className="text-[10px] tracking-[0.18em] text-txt-muted mb-2">
                TOKEN ADDRESS
              </p>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Paste Token Address"
                  className={classNames(
                    "w-full h-[52px] app-input pr-24 text-[16px] placeholder:text-txt-muted",
                    showInvalidAddressState
                      ? "border-accent-red/70 focus:border-accent-red/70"
                      : "border-dark-border"
                  )}
                  value={form.tokenAddress}
                  onChange={(event) =>{
                    console.log("Token address input changed:", event.target.value);
                    setForm((prevState) => ({
                      ...prevState,
                      tokenAddress: event.target.value,
                    }))

                    console.log("Checking if address is valid:", event.target.value, isAddress(event.target.value));
                    if(isAddress(event.target.value)){
                      fetchTokenDetails(event.target.value);
                    }
                  }
                  }
                />
                <div className="absolute inset-y-0 right-3 flex items-center gap-2">
                  {isLoadingTokenDetails && (
                    <Loader className="w-4 h-4 text-txt-muted animate-spin" />
                  )}
                  <button
                    type="button"
                    className="h-7 px-2.5 rounded-full border border-dark-border bg-dark-card text-[11px] text-txt-secondary hover:text-white"
                    onClick={pasteTokenAddress}
                  >
                    <span className="inline-flex items-center gap-1">
                      <Clipboard className="w-3 h-3" />
                      Paste
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {showInvalidAddressState && (
              <p className="text-[12px] text-accent-red mt-1">
                Token not found. Verify address and network.
              </p>
            )}

            {form.tokenDetails && (
              <div className="app-card rounded-2xl p-4 border border-accent-green/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-dark-surface border border-dark-border flex items-center justify-center">
                      {form.tokenDetails.icon ? (
                        <img
                          src={form.tokenDetails.icon}
                          alt={form.tokenDetails.symbol}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[11px] text-txt-secondary">
                          {form.tokenDetails.symbol.slice(0, 3)}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-white text-[16px] font-semibold">
                        {form.tokenDetails.symbol}
                      </p>
                      <p className="text-[12px] text-txt-muted">
                        Token verified
                        {isL1X && " (L1X VM)"}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-accent-green/10 text-accent-green">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Verified
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-dark-border bg-dark-surface px-3 py-2">
                    <p className="text-[10px] text-txt-muted tracking-[0.14em] mb-1">
                      SYMBOL
                    </p>
                    <p className="text-white text-[14px] font-medium">
                      {form.tokenDetails.symbol}
                    </p>
                  </div>
                  <div className="rounded-xl border border-dark-border bg-dark-surface px-3 py-2">
                    <p className="text-[10px] text-txt-muted tracking-[0.14em] mb-1">
                      DECIMALS
                    </p>
                    <p className="text-white text-[14px] font-medium">
                      {form.tokenDetails.decimals}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6">
          <button
            className={classNames(
              disableSubmit
                ? "btn-primary opacity-60 cursor-not-allowed"
                : "btn-primary",
              "h-12 w-full rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            )}
            disabled={disableSubmit}
            type="submit"
          >
            Import Token {form.submitLoader && <Spinner />}
          </button>
        </div>
      </div>
    </form>
  );
};
export default ImportToken;
