import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { JsonRpcProvider } from "ethers";
import PageHeader from "@ui/PageHeader";
import Input from "@ui/Input";
import Button from "@ui/Button";
import { ExtensionStorage } from "@util/ExtensionStorage.util";
import { setCustomChains } from "@virtual_machines/EVM";
import Swal from "sweetalert2";

const AddCustomNetwork = () => {
  const navigate = useNavigate();

  const [networkName, setNetworkName] = useState("");
  const [rpcUrl, setRpcUrl] = useState("");
  const [chainId, setChainId] = useState("");
  const [symbol, setSymbol] = useState("");
  const [explorerUrl, setExplorerUrl] = useState("");

  const [rpcStatus, setRpcStatus] = useState<"idle" | "checking" | "valid" | "error">("idle");
  const [rpcError, setRpcError] = useState("");
  const [saving, setSaving] = useState(false);
  const [resolvedIcon, setResolvedIcon] = useState("");

  async function fetchChainIcon(detectedChainId: number): Promise<string> {
    try {
      const res = await fetch(
        `https://raw.githubusercontent.com/ethereum-lists/chains/master/_data/chains/eip155-${detectedChainId}.json`
      );
      if (!res.ok) return "";
      const data = await res.json();
      if (data?.icon) {
        return `https://icons.llamao.fi/icons/chains/rsz_${data.icon}?w=40&h=40`;
      }
    } catch {}
    return "";
  }

  async function validateRpc() {
    if (!rpcUrl.trim()) return;
    setRpcStatus("checking");
    setRpcError("");
    setResolvedIcon("");

    try {
      const provider = new JsonRpcProvider(rpcUrl.trim());
      const network = await provider.getNetwork();
      const detected = Number(network.chainId);
      setChainId(detected.toString());
      setRpcStatus("valid");
      const icon = await fetchChainIcon(detected);
      setResolvedIcon(icon);
    } catch {
      setRpcStatus("error");
      setRpcError("Could not connect to RPC endpoint");
    }
  }

  async function handleSave() {
    if (!networkName.trim()) {
      Swal.fire({ icon: "warning", title: "Missing Name", text: "Please enter a network name." });
      return;
    }
    if (!symbol.trim()) {
      Swal.fire({ icon: "warning", title: "Missing Symbol", text: "Please enter a currency symbol." });
      return;
    }
    if (rpcStatus !== "valid") {
      Swal.fire({ icon: "warning", title: "Invalid RPC", text: "Please enter a valid RPC URL first." });
      return;
    }

    setSaving(true);
    try {
      const numericChainId = Number(chainId);
      const explorerBase = explorerUrl.trim().replace(/\/+$/, "");
      const explorerUri = explorerBase ? `${explorerBase}/tx/` : "";

      // Check for chain ID conflict
      const existing: IVMChain[] = (await ExtensionStorage.get("customNetworks")) ?? [];
      const conflict = existing.find((n) => n.chainId === numericChainId);
      if (conflict) {
        Swal.fire({
          icon: "warning",
          title: "Chain ID Conflict",
          text: `A network with Chain ID ${numericChainId} (${conflict.name}) already exists.`,
        });
        setSaving(false);
        return;
      }

      const newNetwork: IVMChain = {
        name: networkName.trim(),
        symbol: symbol.trim().toUpperCase(),
        icon: resolvedIcon,
        rpc: rpcUrl.trim(),
        chainId: numericChainId,
        exploreruri: explorerUri,
        nativeToken: {
          name: networkName.trim(),
          symbol: symbol.trim().toUpperCase(),
          decimals: 18,
          total_supply: 0,
          balance: 0,
          tokenAddress: "",
          icon: "",
          isNative: true,
          usdRate: 0,
        },
        environment: {
          Mainnet: { rpc: rpcUrl.trim(), exploreruri: explorerUri },
        },
      };

      const updated = [...existing, newNetwork];
      await ExtensionStorage.set("customNetworks", updated);
      setCustomChains(updated);

      Swal.fire({ icon: "success", title: "Network Added", text: `${newNetwork.name} has been added.`, timer: 1500, showConfirmButton: false });
      navigate("/manage-networks");
    } catch {
      Swal.fire({ icon: "error", title: "Error", text: "Failed to save network." });
    } finally {
      setSaving(false);
    }
  }

  const isFormValid =
    networkName.trim() &&
    symbol.trim() &&
    rpcStatus === "valid";

  return (
    <div className="app-frame mx-auto bg-dark-bg flex flex-col">
      <PageHeader title="Add Network" onBack={() => navigate("/manage-networks")} />

      <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-4">
        <Input
          label="Network Name"
          placeholder="e.g. Arbitrum One"
          value={networkName}
          onChange={(e) => setNetworkName(e.target.value)}
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
              setChainId("");
            }}
            onBlur={validateRpc}
          />
          {rpcStatus === "checking" && (
            <p className="text-[10px] text-txt-muted mt-1">Verifying RPC...</p>
          )}
          {rpcStatus === "valid" && (
            <p className="text-[10px] text-accent-green mt-1">RPC connected · Chain ID {chainId} detected</p>
          )}
          {rpcStatus === "error" && (
            <p className="text-[10px] text-accent-red mt-1">{rpcError}</p>
          )}
        </div>

        <Input
          label="Chain ID"
          placeholder="Auto-detected from RPC"
          value={chainId}
          disabled
        />

        <Input
          label="Currency Symbol"
          placeholder="e.g. ETH"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
        />

        <Input
          label="Block Explorer URL (optional)"
          placeholder="e.g. https://arbiscan.io"
          value={explorerUrl}
          onChange={(e) => setExplorerUrl(e.target.value)}
        />
      </div>

      <div className="px-5 pb-5">
        <Button fullWidth onClick={handleSave} disabled={!isFormValid || saving}>
          {saving ? "Saving..." : "Add Network"}
        </Button>
      </div>
    </div>
  );
};

export default AddCustomNetwork;
