import { FC } from "react";
import { EVM_CHAINS } from "@virtual_machines/EVM";
import evmFallback from "@assets/images/evm.svg";

const NetworkBadge: FC<{ chainId?: string }> = ({ chainId }) => {
  if (!chainId) return null;

  const numericId = parseInt(chainId);
  const chain = EVM_CHAINS.find((c) => c.chainId === numericId);
  const icon = chain?.icon;

  if (!icon) return null;

  return (
    <img
      src={icon}
      alt=""
      className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border border-dark-bg bg-dark-bg"
      onError={(e) => {
        (e.target as HTMLImageElement).src = evmFallback;
      }}
    />
  );
};

export default NetworkBadge;
