import { GetTransactionReceiptResponse } from "@l1x/l1x-wallet-sdk";
import { Util } from "@util/Util";
import { FC, useContext, useState } from "react";
import { Copy, ExternalLink, X } from "react-feather";
import { useNavigate } from "react-router-dom";
import { Tooltip } from "react-tooltip";
import { AppContext } from "../Auth.guard";

const FunctioncallTxDetails: FC<GetTransactionReceiptResponse> = (receipt) => {
  const appContext = useContext(AppContext);
  const navigate = useNavigate();
  const [copied, setCopied] = useState("");
  const contractAddress =
    (receipt?.transaction?.transaction as any)["SmartContractFunctionCall"][
      "contract_address"
    ] || "";
  const functionName =
    (receipt?.transaction?.transaction as any)["SmartContractFunctionCall"][
      "function_name"
    ] || "";
  function copyPublickey(event: MouseEvent, data: string) {
    event.preventDefault();
    event.stopPropagation();
    navigator.clipboard.writeText(data);
    setCopied(data);
  }

  return (
    <div className="w-[375px] h-[600px] mx-auto overflow-y-auto px-4 py-5 relative flex flex-col">
      <div className="text-lg font-semibold text-XBlue rounded-3xl flex items-center justify-between mb-5 text-center">
        Transaction Details
        <button className="ms-4" onClick={() => navigate(-1)}>
          <X className="w-5 h-5 " />
        </button>
      </div>
      <div className="flex items-center justify-between  mb-2 gap-4">
        <h4 className="text-sm text-slate-800 font-semibold text-left w-[50%]">
          Status:
          <span className="text-sm text-green-500 text-right font-semibold ms-2">
            Success
          </span>
        </h4>
        <a
          href={`${appContext?.virtualMachine.activeNetwork.exploreruri}${receipt.transaction_hash}`}
          target="_blank"
        >
          <button className="text-blue-500 text-sm font-medium flex items-center">
            View on Explorer{" "}
            <ExternalLink className="w-3 h-3 ms-1 text-blue-500" />{" "}
          </button>
        </a>
      </div>
      <div className="flex-grow-[1] p-4 bg-slate-100 rounded-lg">
        <div className="flex items-center justify-between  mb-3 gap-4">
          <h4 className="text-sm text-slate-800 font-medium text-left w-[50%]">
            Tx Hash
          </h4>
          <h4 className="text-sm text-slate-500 text-right flex items-center w-[50%]">
            {Util.wrapPublicKey(receipt.transaction_hash || "")}
            <button
              className="ms-2"
              data-tooltip-id={receipt.transaction_hash}
              onClick={(event: any) =>
                copyPublickey(event, receipt.transaction_hash)
              }
            >
              <Copy className="w-3 h-3 text-slate-400" />
            </button>
            {copied == receipt.transaction_hash && (
              <Tooltip
                className="font-normal !bg-white !text-black shadow-lg !opacity-100 border border-slate-100 !text-[12px]"
                id={receipt.transaction_hash}
                content="Copied!"
                defaultIsOpen={true}
                afterShow={() =>
                  setTimeout(() => {
                    setCopied("");
                  }, 1000)
                }
                events={["click"]}
              />
            )}
          </h4>
        </div>
        <div className="w-full">
          <div className="flex items-center justify-between  mb-2 gap-4">
            <h4 className="text-sm text-slate-800 font-medium text-left w-[50%]">
              Nonce
            </h4>
            <h4 className="text-sm text-slate-500 text-right w-[50%]">
              {(receipt?.transaction as any)?.nonce || 0}
            </h4>
          </div>
          {/* <div className="flex items-center justify-between  mb-2 gap-4">
            <h4 className="text-sm text-slate-800 font-medium text-left w-[50%]">
              Fee Used
            </h4>
            <h4 className="text-sm text-slate-500 text-right w-[50%] font-bold">
              {appContext?.virtualMachine.formatDecimals(receipt?.fee_used) ||
                0}
              &nbsp;L1X
            </h4>
          </div> */}
          <div className="flex items-center justify-between  mb-2 gap-4">
            <h4 className="text-sm text-slate-800 font-medium text-left w-[50%]">
              Type
            </h4>
            <h4 className="text-sm text-slate-500 text-right w-[50%]">
              Function call
            </h4>
          </div>
          <div className="flex items-center justify-between  mb-2 gap-4">
            <h4 className="text-sm text-slate-800 font-medium text-left text-ellipsis whitespace-nowrap overflow-hidden w-[50%]">
              Contract Call
            </h4>
            <h4
              className="text-sm text-slate-500 text-right w-[50%] flex items-center"
              title={contractAddress}
            >
              {Util.wrapPublicKey(contractAddress)}
              <button
                className="ms-2"
                data-tooltip-id={contractAddress}
                onClick={(event: any) => copyPublickey(event, contractAddress)}
              >
                <Copy className="w-3 h-3 text-slate-400" />
              </button>
              {copied == contractAddress && (
                <Tooltip
                  className="font-normal !bg-white !text-black shadow-lg !opacity-100 border border-slate-100 !text-[12px]"
                  id={contractAddress}
                  content="Copied!"
                  defaultIsOpen={true}
                  afterShow={() =>
                    setTimeout(() => {
                      setCopied("");
                    }, 1000)
                  }
                  events={["click"]}
                />
              )}
            </h4>
          </div>
          <div className="flex items-center justify-between  mb-2 gap-4">
            <h4 className="text-sm text-slate-800 font-medium text-left text-ellipsis whitespace-nowrap overflow-hidden w-[50%]">
              Function Name
            </h4>
            <h4
              className="text-sm text-slate-500 text-right text-ellipsis whitespace-nowrap overflow-hidden w-[50%]"
              title={functionName}
            >
              {functionName}
            </h4>
          </div>
          {/* <h4 className="font-bold pt-2 pb-2">Argumets</h4>
          {Object.entries(
            (receipt?.transaction?.transaction as any)[
              "SmartContractFunctionCall"
            ]["arguments"] || {}
          ).map(([key, value]: [string, any]) => {
            return (
              <div className="flex items-center justify-between  mb-2 gap-4">
                <h4
                  className="text-sm text-slate-800 font-medium text-left w-[50%] text-ellipsis whitespace-nowrap overflow-hidden"
                  title={key}
                >
                  {key}
                </h4>
                <h4
                  className="text-sm text-slate-500 text-right text-ellipsis whitespace-nowrap overflow-hidden w-[50%]"
                  title={value}
                >
                  {value}
                </h4>
              </div>
            );
          })} */}
        </div>
      </div>
    </div>
  );
};

export default FunctioncallTxDetails;
