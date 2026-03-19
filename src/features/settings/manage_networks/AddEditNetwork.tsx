import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { JsonRpcProvider } from "ethers";
import PageHeader from "@ui/PageHeader";
import Input from "@ui/Input";
import Button from "@ui/Button";
import { ExtensionStorage } from "@util/ExtensionStorage.util";
import { EVM_CHAINS, getAllEVMChains, setRpcOverrides } from "@virtual_machines/EVM";
import { AppContext } from "../../../Auth.guard";
import Swal from "sweetalert2";

const AddEditNetwork = () => {
  const { chainId: paramChainId } = useParams<{ chainId: string }>();
  const navigate = useNavigate();
  const appContext = useContext(AppContext);

  const [networkName, setNetworkName] = useState("");
  const [rpcUrl, setRpcUrl] = useState("");
  const [defaultRpc, setDefaultRpc] = useState("");
  const [chainId, setChainId] = useState("");
  const [symbol, setSymbol] = useState("");
  const [explorerUrl, setExplorerUrl] = useState("");

  const [rpcStatus, setRpcStatus] = useState<"idle" | "checking" | "valid" | "error">("idle");
  const [rpcError, setRpcError] = useState("");
  const [chainIdMismatch, setChainIdMismatch] = useState("");
  const [, setDetectedChainId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (paramChainId) {
      loadExisting(Number(paramChainId));
    } else {
      navigate("/manage-networks");
    }
  }, [paramChainId]);

  async function loadExisting(editChainId: number) {
    const builtIn = EVM_CHAINS.find((c) => c.chainId === editChainId);
    if (!builtIn) {
      navigate("/manage-networks");
      return;
    }

    const overrides: Record<number, { rpc: string; exploreruri: string }> =
      (await ExtensionStorage.get("networkRpcOverrides")) ?? {};
    const ov = overrides[editChainId];

    setNetworkName(builtIn.name);
    setDefaultRpc(builtIn.rpc);
    setRpcUrl(ov?.rpc ?? builtIn.rpc);
    setChainId(builtIn.chainId.toString());
    setSymbol(builtIn.nativeToken.symbol);
    setExplorerUrl((ov?.exploreruri ?? builtIn.exploreruri).replace(/\/tx\/$/, ""));
    setDetectedChainId(builtIn.chainId);
    setRpcStatus("valid");
  }

  async function validateRpc() {
    if (!rpcUrl.trim()) return;
    setRpcStatus("checking");
    setRpcError("");
    setChainIdMismatch("");

    try {
      const provider = new JsonRpcProvider(rpcUrl.trim());
      const network = await provider.getNetwork();
      const detected = Number(network.chainId);
      setDetectedChainId(detected);

      if (Number(chainId) !== detected) {
        setChainIdMismatch(
          `RPC returned chain ID ${detected}, expected ${chainId}`
        );
        setRpcStatus("error");
      } else {
        setRpcStatus("valid");
      }
    } catch {
      setRpcStatus("error");
      setRpcError("Could not connect to RPC endpoint");
      setDetectedChainId(null);
    }
  }

  async function handleResetToDefault() {
    const numericChainId = Number(chainId);
    const overrides: Record<number, { rpc: string; exploreruri: string }> =
      (await ExtensionStorage.get("networkRpcOverrides")) ?? {};
    delete overrides[numericChainId];
    await ExtensionStorage.set("networkRpcOverrides", overrides);
    setRpcOverrides(overrides);

    const builtIn = EVM_CHAINS.find((c) => c.chainId === numericChainId);
    if (builtIn) {
      setRpcUrl(builtIn.rpc);
      setExplorerUrl(builtIn.exploreruri.replace(/\/tx\/$/, ""));
      setRpcStatus("valid");

      if (appContext?.virtualMachine.activeNetwork.chainId === numericChainId) {
        appContext.changeActiveNetwork(builtIn);
      }
    }

    Swal.fire({ icon: "success", title: "Reset", text: "RPC reset to default.", timer: 1500, showConfirmButton: false });
  }

  async function handleSave() {
    if (!rpcUrl.trim()) {
      Swal.fire({ icon: "warning", title: "Missing RPC", text: "Please enter an RPC URL." });
      return;
    }

    setSaving(true);
    try {
      const numericChainId = Number(chainId);
      const explorerBase = explorerUrl.trim().replace(/\/+$/, "");
      const explorerUri = explorerBase ? `${explorerBase}/tx/` : "";

      const overrides: Record<number, { rpc: string; exploreruri: string }> =
        (await ExtensionStorage.get("networkRpcOverrides")) ?? {};

      // Only save override if different from default
      const builtIn = EVM_CHAINS.find((c) => c.chainId === numericChainId);
      if (builtIn && rpcUrl.trim() === builtIn.rpc && explorerUri === builtIn.exploreruri) {
        delete overrides[numericChainId];
      } else {
        overrides[numericChainId] = { rpc: rpcUrl.trim(), exploreruri: explorerUri };
      }

      await ExtensionStorage.set("networkRpcOverrides", overrides);
      setRpcOverrides(overrides);

      // Update active network if this chain is in use
      if (appContext?.virtualMachine.activeNetwork.chainId === numericChainId) {
        const updatedChain = getAllEVMChains().find((c) => c.chainId === numericChainId);
        if (updatedChain) appContext.changeActiveNetwork(updatedChain);
      }

      navigate("/manage-networks");
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: "Failed to save network." });
    } finally {
      setSaving(false);
    }
  }

  const isFormValid = rpcUrl.trim() && rpcStatus === "valid" && !chainIdMismatch;
  const isCustomRpc = rpcUrl.trim() !== defaultRpc;

  return (
    <div className="app-frame mx-auto bg-dark-bg flex flex-col">
      <PageHeader title="Edit Network" onBack={() => navigate("/manage-networks")} />

      <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-4">
        <Input
          label="Network Name"
          value={networkName}
          disabled
        />

        <div>
          <Input
            label="RPC URL"
            placeholder="https://..."
            value={rpcUrl}
            onChange={(e) => {
              setRpcUrl(e.target.value);
              setRpcStatus("idle");
              setRpcError("");
              setChainIdMismatch("");
            }}
            onBlur={validateRpc}
          />
          {rpcStatus === "checking" && (
            <p className="text-[10px] text-txt-muted mt-1">Verifying RPC...</p>
          )}
          {rpcStatus === "valid" && (
            <p className="text-[10px] text-accent-green mt-1">RPC connected</p>
          )}
          {rpcStatus === "error" && (
            <p className="text-[10px] text-accent-red mt-1">{rpcError || chainIdMismatch}</p>
          )}
          {defaultRpc && (
            <p className="text-[10px] text-txt-muted mt-1">
              Default: {defaultRpc}
            </p>
          )}
        </div>

        <Input
          label="Chain ID"
          value={chainId}
          disabled
        />

        <Input
          label="Currency Symbol"
          value={symbol}
          disabled
        />

        <Input
          label="Block Explorer URL (optional)"
          placeholder="e.g. https://etherscan.io"
          value={explorerUrl}
          onChange={(e) => setExplorerUrl(e.target.value)}
        />
      </div>

      <div className="px-5 pb-5 space-y-2">
        <Button
          fullWidth
          onClick={handleSave}
          disabled={!isFormValid || saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
        {isCustomRpc && (
          <button
            type="button"
            onClick={handleResetToDefault}
            className="w-full text-center text-[12px] text-txt-secondary hover:text-white py-2"
          >
            Reset to Default RPC
          </button>
        )}
      </div>
    </div>
  );
};

export default AddEditNetwork;
