import { ArrowUpRightIcon, CodeBracketIcon } from "@heroicons/react/16/solid";
import { FC } from "react";
import { Util } from "@util/Util";
import { ethers } from "ethers";
import { EVM_CHAINS } from "@virtual_machines/EVM";
import NetworkBadge from "./NetworkBadge";
import TxStatus from "./TxStatus";

const ERC20_SIGNATURES: Record<string, string> = {
  "0x095ea7b3": "Approval",
  "0xa9059cbb": "Transfer",
  "0x23b872dd": "TransferFrom",
};

function decodeTxLabel(data: string): string {
  if (!data || data === "0x" || data.length < 10) return "Sent";
  const selector = data.slice(0, 10).toLowerCase();
  return ERC20_SIGNATURES[selector] || "Contract Call";
}

function hexToEth(hexValue: string): string {
  try {
    if (!hexValue || hexValue === "0x0" || hexValue === "0x") return "";
    const val = ethers.formatEther(hexValue);
    const num = parseFloat(val);
    if (num === 0) return "";
    return num.toFixed(6);
  } catch {
    return "";
  }
}

const EVMDappTx: FC<IEVMDappTransaction> = (transaction) => {
  const label = decodeTxLabel(transaction.data);
  const isContractCall = transaction.data && transaction.data !== "0x" && transaction.data.length > 2;
  const valueStr = hexToEth(transaction.value);
  const numericChainId = parseInt(transaction.chainId);
  const nativeSymbol = EVM_CHAINS.find((c) => c.chainId === numericChainId)?.nativeToken?.symbol || "ETH";

  return (
    <div className="flex justify-between bg-dark-card border border-dark-border rounded-2xl p-3 align-middle items-center">
      <div className="flex items-center">
        <div className="relative me-2">
          <div className="w-8 h-8 min-w-8 rounded-full bg-dark-surface border border-dark-border flex items-center justify-center">
            {isContractCall ? (
              <CodeBracketIcon className="w-4 h-4 text-accent-green" />
            ) : (
              <ArrowUpRightIcon className="w-4 h-4 text-accent-green" />
            )}
          </div>
          <NetworkBadge chainId={transaction.chainId} />
        </div>
        <div>
          <h4 className="text-white font-semibold text-sm">{label}</h4>
          <h6 className="text-[10px] font-medium text-txt-secondary">
            {transaction.site
              ? new URL(transaction.site).hostname
              : Util.wrapPublicKey(transaction.to)}
          </h6>
        </div>
      </div>
      <div className="text-right">
        {valueStr && (
          <h4 className="text-white text-sm">{valueStr} {nativeSymbol}</h4>
        )}
        <TxStatus status={transaction.txStatus} />
      </div>
    </div>
  );
};

export default EVMDappTx;
