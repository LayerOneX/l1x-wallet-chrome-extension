import { ArrowDown, Clock } from "react-feather";
import ETHIcon from "@assets/images/ethereum.svg";
import L1xIcon from "@assets/images/L1X_icon.png";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export const SwapTokens = () => {
  return (
    <div className="w-[375px] h-[600px] mx-auto overflow-y-auto px-4 py-5 relative flex flex-col">
      <div className="flex-grow-[1]">
        <div className="text-lg font-semibold text-XBlue rounded-3xl flex items-center  mb-5 text-center">
          <button className="me-4">
            <ArrowLeftIcon className="w-5 h-5 " />
          </button>
          Swap
        </div>
        <div className="w-full flex items-center justify-between gap-3 mb-3">
          <h2 className="text-sm font-semibold">Transaction</h2>
          <div className="bg-slate-100 px-3 py-1 rounded-full flex items-center">
            <h4 className="text-[10px]">
              New quote in <b className="text-semibold"> 0:19</b>
            </h4>
            <Clock className="w-3 h-3 text-XOrange ms-1" />
          </div>
        </div>
        <div className="w-full">

        <div className="w-full bg-slate-100 p-4 rounded-lg mb-3 flex items-center justify-center ">
          <div className="flex items-center">
            <span className="me-2">
              {" "}
              <img src={ETHIcon} alt="Network Icon" className="w-6 h-6" />
            </span>
            <h4 className="text-md font-semibold ">1.00 ETH</h4>
          </div>
        </div>
        <div className="text-center mb-3">
          <span className="w-7 h-7 bg-slate-50 border border-slate-200 max-auto inline-flex items-center justify-center rounded-full">
            <ArrowDown className="w-4 h-4" />
          </span>
        </div>
        <div className="w-full bg-XLightBlue p-4 rounded-lg mb-1 flex items-center justify-center">
          <div className="flex items-center">
            <span className="me-2  bg-white rounded-full">
              {" "}
              <img src={L1xIcon} alt="Network Icon" className="w-6 h-6" />
            </span>
            <h4 className="text-md font-semibold ">8589.00 L1X</h4>
          </div>
        </div>
        </div>

        <h4 className="text-[10px] text-slate-500 text-center mb-3">
          1 ETH = 5,689 L1X
        </h4>

        <div className="w-full pb-1">
          <div className="flex items-center justify-between  mb-2 gap-4">
            <h4 className="text-xs text-slate-500 text-left">Nonce</h4>
            <h4 className="text-xs text-slate-500 text-right">58464</h4>
          </div>
          <div className="flex items-center justify-between  mb-2 gap-4">
            <h4 className="text-xs text-slate-500 text-left">Amount</h4>
            <h4 className="text-xs text-slate-800 text-right font-semibold">
              0.5124 ETH
            </h4>
          </div>
          <div className="flex items-center justify-between  mb-2 gap-4">
            <h4 className="text-xs text-slate-500 text-left">
              Gas Limit (Units)
            </h4>
            <h4 className="text-xs text-slate-500 text-right">2100</h4>
          </div>
          <div className="flex items-center justify-between  mb-2 gap-4">
            <h4 className="text-xs text-slate-500 text-left">Gas Price</h4>
            <h4 className="text-xs text-slate-500 text-right">0.2536</h4>
          </div>
          <div className="border-b border-b-slate-200 w-full my-3"></div>
          <div className="flex items-start justify-between  mb-2 gap-4">
            <h4 className="text-sm text-slate-800 text-left font-semibold">
              Total
            </h4>
            <h4 className="text-sm text-slate-800 font-semibold text-right">
              +0.95 ETH
              <span className="block w-full text-xs text-slate-400 font-normal">
                $872.763 USD
              </span>
            </h4>
          </div>
        </div>
      </div>
      <div className="mt-5">
        <button className="flex items-center justify-center text-sm text-white hover:text-XOrange hover:bg-transparent border border-XOrange bg-XOrange px-3 py-2 rounded-3xl w-full min-h-[40px]">
          Approve
        </button>
      </div>
    </div>
  );
};
