import { ArrowUpRightIcon } from "@heroicons/react/16/solid";
import { Util } from "@util/Util";
import { FC } from "react";
import NetworkBadge from "./NetworkBadge";
import TxStatus from "./TxStatus";

const FunctioncallTx: FC<IStateChangeCall> = (transaction) => {
  return (
    <div className="flex items-start justify-between bg-dark-card border border-dark-border rounded-2xl p-3">
      <div className="flex items-center">
        <div className="relative me-2">
          <div className="w-8 h-8 min-w-8 rounded-full bg-dark-surface border border-dark-border flex items-center justify-center">
            <ArrowUpRightIcon className="w-4 h-4 text-accent-blue" />
          </div>
          <NetworkBadge chainId={transaction.chainId} />
        </div>
        <div>
          <h4 className="text-white font-semibold text-sm">
            Contract Call
          </h4>
          <TxStatus status={transaction.txStatus} />
        </div>
      </div>
      <div className="text-right">
        <h4 className="text-white text-sm">
          {Util.wrapPublicKey(transaction.contractAddress)}
        </h4>
      </div>
    </div>
  );
};

export default FunctioncallTx;
