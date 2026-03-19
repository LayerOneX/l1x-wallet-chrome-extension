import { ArrowUpRightIcon } from "@heroicons/react/16/solid";
import { FC } from "react";
import { EVM_CHAINS } from "@virtual_machines/EVM";
import NetworkBadge from "./NetworkBadge";
import TxStatus from "./TxStatus";

const NativeTokenTx: FC<ITransferNativeToken> = (transaction) => {
  const decimals =
    transaction.decimals ??
    EVM_CHAINS.find((c) => c.chainId === parseInt(transaction.chainId))
      ?.nativeToken?.decimals ??
    18;
  const transactionAmount = +transaction.amount / 10 ** decimals;

  return (
    <div className="flex justify-between bg-dark-card border border-dark-border rounded-2xl p-3 align-middle items-center">
      <div className="flex items-center">
        <div className="relative me-2">
          <div className="w-8 h-8 min-w-8 rounded-full bg-dark-surface border border-dark-border flex items-center justify-center">
            <ArrowUpRightIcon className="w-4 h-4 text-accent-green" />
          </div>
          <NetworkBadge chainId={transaction.chainId} />
        </div>
        <div>
          <h4 className="text-white font-semibold text-sm">Sent</h4>
          <TxStatus status={transaction.txStatus} />
        </div>
      </div>
      <div className="text-right">
        <h4 className="text-white text-sm">
          {transactionAmount}&nbsp;
          {transaction.symbol}
        </h4>
      </div>
    </div>
  );
};

export default NativeTokenTx;
