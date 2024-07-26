import { ArrowUpRightIcon } from "@heroicons/react/16/solid";
import { Util } from "@util/Util";
import { FC } from "react";

const FunctioncallTx: FC<IStateChangeCall> = (transaction) => {
  return (
    <div className="flex items-start justify-between mb-3 bg-slate-100 rounded-lg p-4">
      <div className="flex items-center">
        <div className="w-8 h-8 min-w-8 rounded-full border border-XBlue flex items-center justify-center me-2">
          <ArrowUpRightIcon className="w-4 h-4 text-XBlue" />
        </div>
        <div>
          <h4 className="text-black font-semibold text-sm">
            Contract Function Call
          </h4>
          <h6 className="text-[10px] font-medium text-green-500">Confirmed</h6>
        </div>
      </div>
      <div className=" text-right">
        <h4 className="text-black text-sm">
          {Util.wrapPublicKey(transaction.contractAddress)}
        </h4>
      </div>
    </div>
  );
};

export default FunctioncallTx;
