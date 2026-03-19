import { CheckCircleIcon } from "@heroicons/react/16/solid";
import { X } from "react-feather";
// import { useState } from "react";
// import { Tooltip } from "react-tooltip";

interface AirdropClaimSuccessProps {
  tokenAmount: string;
  transactionHash: string;
  onClose: () => void;
}

const AirdropClaimSuccess: React.FC<AirdropClaimSuccessProps> = ({
  // tokenAmount,
  // transactionHash,
  onClose,
}) => {
  // const [copied, setCopied] = useState(false);

  // const currentDate = new Date();
  // const formattedDate = currentDate.toLocaleDateString("en-US", {
  //   year: "numeric",
  //   month: "long",
  //   day: "numeric",
  // });
  // const formattedTime = currentDate.toLocaleTimeString("en-US", {
  //   hour: "2-digit",
  //   minute: "2-digit",
  //   second: "2-digit",
  //   hour12: true,
  // });

  // function copyTransactionHash(event: React.MouseEvent, hash: string) {
  //   event.preventDefault();
  //   event.stopPropagation();
  //   navigator.clipboard.writeText(hash);
  //   setCopied(true);
  //   setTimeout(() => {
  //     setCopied(false);
  //   }, 2000);
  // }

  // function wrapHash(hash: string): string {
  //   if (hash.length <= 12) return hash;
  //   return `${hash.substring(0, 6)}...${hash.substring(hash.length - 6)}`;
  // }

  return (
    <div className="fixed left-0 top-0 w-full h-full z-50 flex items-center justify-center">
      <div
        className="bg-black/20 w-full h-full backdrop-blur-sm absolute z-0"
        onClick={onClose}
      ></div>
      <div className="relative bg-white z-10 w-[92%] p-6 rounded-lg text-center fadeIn-animation">
        <div className="flex justify-end mb-2">
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex justify-center mb-4">
          <CheckCircleIcon className="w-16 h-16 text-green-500" />
        </div>

        <h3 className="text-lg font-semibold mb-3 text-XBlue">
          Eligibility Verified!
        </h3>
{/* 
        <div className="mb-4 text-sm text-slate-600">
          <p className="mb-1">{formattedDate}</p>
          <p>{formattedTime}</p>
        </div> */}

        <p className="mb-3">You’ve successfully verified your eligibility for the L1X claim.
          
          🎉 The claim phase isn’t live yet — we’ll announce it soon.</p>
         
          <p>Stay tuned on our official channels for the claim opening date.</p>

        {/* <div className="mb-6 p-4 bg-slate-100 rounded-lg">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs text-slate-600 font-medium text-left">
              Transaction ID:
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-800 font-mono">
                {wrapHash(transactionHash)}
              </span>
              <button
                className="text-slate-400 hover:text-slate-600"
                data-tooltip-id={transactionHash}
                onClick={(event) => copyTransactionHash(event, transactionHash)}
              >
                <Copy className="w-4 h-4" />
              </button>
              {copied && (
                <Tooltip
                  className="font-normal !bg-white !text-black shadow-lg !opacity-100 border border-slate-100 !text-[12px]"
                  id={transactionHash}
                  content="Copied!"
                  defaultIsOpen={true}
                  afterShow={() =>
                    setTimeout(() => {
                      setCopied(false);
                    }, 2000)
                  }
                  events={["click"]}
                />
              )}
            </div>
          </div>
        </div> */}

        <div className="text-center mt-4">
          <button
            className="inline-flex items-center justify-center text-sm text-white bg-XOrange px-6 py-2 rounded-3xl min-w-28"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AirdropClaimSuccess;

