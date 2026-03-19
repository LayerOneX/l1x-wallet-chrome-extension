import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Edit2, Plus, Trash2 } from "react-feather";
import PageHeader from "@ui/PageHeader";
import NetworkAvatar from "@ui/NetworkAvatar";
import { ExtensionStorage } from "@util/ExtensionStorage.util";
import { EVM_CHAINS, setCustomChains } from "@virtual_machines/EVM";
import Swal from "sweetalert2";

const ManageNetworks = () => {
  const navigate = useNavigate();
  const [rpcOverrides, setRpcOverrides] = useState<Record<number, { rpc: string; exploreruri: string }>>({});
  const [customNetworks, setCustomNetworks] = useState<IVMChain[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [overrides, custom] = await Promise.all([
      ExtensionStorage.get("networkRpcOverrides"),
      ExtensionStorage.get("customNetworks"),
    ]);
    setRpcOverrides(overrides ?? {});
    setCustomNetworks(custom ?? []);
  }

  async function handleDeleteCustomNetwork(chainId: number) {
    const result = await Swal.fire({
      title: "Remove Network?",
      text: "This will remove the custom network from your wallet.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Remove",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;

    const updated = customNetworks.filter((n) => n.chainId !== chainId);
    await ExtensionStorage.set("customNetworks", updated);
    setCustomChains(updated);
    setCustomNetworks(updated);
  }

  const NetworkRow = ({
    network,
    hasOverride,
    onEdit,
    onDelete,
  }: {
    network: IVMChain;
    hasOverride?: boolean;
    onEdit: () => void;
    onDelete?: () => void;
  }) => (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-dark-card border border-dark-border">
      <NetworkAvatar name={network.name} icon={network.icon} size={36} />

      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{network.name}</p>
        <p className="text-[11px] text-txt-muted truncate">
          {network.symbol} · Chain ID {network.chainId}
          {hasOverride && <span className="text-accent-blue ml-1">· Custom RPC</span>}
        </p>
      </div>

      {onDelete ? (
        <button
          onClick={onDelete}
          className="w-7 h-7 flex items-center justify-center text-txt-secondary hover:text-accent-red rounded-lg hover:bg-dark-surface shrink-0"
        >
          <Trash2 size={14} />
        </button>
      ) : (
        <button
          onClick={onEdit}
          className="w-7 h-7 flex items-center justify-center text-txt-secondary hover:text-white rounded-lg hover:bg-dark-surface shrink-0"
        >
          <Edit2 size={14} />
        </button>
      )}
    </div>
  );

  return (
    <div className="app-frame mx-auto bg-dark-bg flex flex-col">
      <PageHeader
        title="Networks"
        onBack={() => navigate("/settings")}
        rightAction={
          <button
            onClick={() => navigate("/add-network")}
            className="w-8 h-8 flex items-center justify-center text-txt-secondary hover:text-white rounded-lg hover:bg-dark-surface"
          >
            <Plus size={18} />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-2">
        {/* Built-in networks */}
        {EVM_CHAINS.map((network) => (
          <NetworkRow
            key={network.chainId}
            network={network}
            hasOverride={!!rpcOverrides[network.chainId]}
            onEdit={() => navigate(`/edit-network/${network.chainId}`)}
          />
        ))}

        {/* Custom networks */}
        {customNetworks.length > 0 && (
          <>
            <p className="text-[11px] text-txt-muted pt-2 px-1">Custom Networks</p>
            {customNetworks.map((network) => (
              <NetworkRow
                key={network.chainId}
                network={network}
                onEdit={() => {}}
                onDelete={() => handleDeleteCustomNetwork(network.chainId)}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default ManageNetworks;
