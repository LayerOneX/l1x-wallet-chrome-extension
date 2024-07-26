import { ChevronLeft, Copy, Edit, ExternalLink, Info } from "react-feather";
import l1xIcon from "./assets/images/L1X_icon.png";
import { useState } from "react";
import { Tooltip } from "react-tooltip";

const AllowAccess = () => {
  const [showContractModal, setShowContractModal] = useState<boolean>(false);
  return (
    <div className="w-[375px] h-[600px] mx-auto overflow-y-auto px-4 py-5 relative flex flex-col">
      <div className="w-full text-center mb-3">
        <div className="rounded-full pe-3 ps-2 py-1 border border-slate-300 inline-flex items-center text-xs font-semibold text-slate-500">
          <span className="w-6 h-6 rounded-full me-2">
            <img src={l1xIcon} className="max-w-full" alt="Website logo" />
          </span>
          https://l1xapp.com/
        </div>
      </div>
      <div className="flex-grow-[1] ">
        <div className="text-center bg-XLightBlue p-5 rounded-lg">
          <h2 className="text-lg font-medium mb-3">
            Allow access to and transfer of all your
            <span className="text-blue-500 cursor-pointer ms-1">
              StarnderdERC721
            </span>
          </h2>
          <p className="text-xs text-slate-500 mb-2">
            This allows a third party to access and transfer following NFTs
            without further notice until you revoke it access..
          </p>
          <button
            className="text-blue-500 text-[10px] font-medium"
            onClick={() => setShowContractModal(true)}
          >
            Verify Contract Details
          </button>
          {/* modal */}
          {showContractModal && (
            <div className="fixed left-0 top-0 w-full h-full z-50 flex items-center justify-center ">
              <div
                className="bg-black/20 w-full h-full backdrop-blur-sm absolute z-0"
                onClick={() => setShowContractModal(false)}
              ></div>
              <div className="relative bg-white z-10 w-[92%] p-6 rounded-lg text-left fadeIn-animation">
                <h3 className="text-md font-semibold mb-2">Contract Details</h3>
                <p className="text-xs text-slate-500 mb-3">
                  To protect yourself against scammers, take a moment to verify
                  contract details
                </p>
                <h5 className="text-xs font-semibold mb-2">NFT Contract</h5>
                <div className="flex items-center justify-between mb-4 bg-slate-100 rounded-md w-full p-2">
                  <div className="flex items-center ">
                    <span className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-xs font-semibold text-white me-2">
                      SA
                    </span>
                    <div>
                      <h5 className="text-xs font-medium">NFT Contract</h5>
                      <h6 className="text-xs text-slate-500">
                        0xC7D9D...0b2420F
                      </h6>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ">
                    <button className="cursor-pointer">
                      <Copy className="w-4 h-4 text-slate-500" />
                    </button>
                    <button className="cursor-pointer">
                      <ExternalLink className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                </div>
                <h5 className="text-xs font-semibold mb-2">
                  Contract Requesting Access
                </h5>
                <div className="flex items-center justify-between mb-4 bg-slate-100 rounded-md w-full p-2">
                  <div className="flex items-center ">
                    <span className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-xs font-semibold text-white me-2 overflow-hidden">
                      <img
                        src="https://quicknode.quicknode-ipfs.com/ipfs/QmUZAta23czxGK5unjGGw1Jwg4wkhVFYdJG9cyv1gZXG7V"
                        className="max-w-full"
                        alt="Avtar"
                      />
                    </span>
                    <div>
                      <h5 className="text-xs font-medium">
                        {" "}
                        0xC7D9D...0b2420F
                      </h5>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ">
                    <button className="cursor-pointer">
                      <Copy className="w-4 h-4 text-slate-500" />
                    </button>
                    <button className="cursor-pointer">
                      <ExternalLink className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                </div>
                <button
                  className="flex items-center justify-center text-sm text-white bg-XOrange px-3 py-2 rounded-3xl w-full max-w-32 mx-auto min-h-[40px]"
                  onClick={() => setShowContractModal(false)}
                >
                  Got it
                </button>
              </div>
            </div>
          )}
          {/* modal */}
        </div>
        <div
          className="w-full my-5
          "
        >
          <div className="flex items-center gap-4 justify-between mb-3">
            <div>
              <h4 className="text-xs font-semibold flex items-center">
                Gas
                <i className="text-[10px] text-slate-400 font-light">
                  (Estimated)
                </i>
                <button
                  className=" mx-1 cursor-pointer"
                  data-tooltip-id="gas-info"
                  data-tooltip-content="This is sample tootip content added here"
                >
                  <Info className="w-3 h-3  text-slate-600" />
                  <Tooltip
                    id="gas-info"
                    className="max-w-40 font-normal !bg-white !text-black shadow-lg !opacity-100 border border-slate-100  !text-[12px]"
                  />
                </button>
              </h4>
            </div>
            <div>
              <h4 className="text-xs font-semibold flex items-center">
                <span className="text-slate-400 font-normal me-1">$1.78</span>
                0.00105737ETH
              </h4>
            </div>
          </div>
          <div className="flex items-center gap-4 justify-between mb-3">
            <div>
              <h4 className="text-xs font-semibold flex items-center text-green-500">
                Likely in <ChevronLeft className="w-4 h-4 ms-1" /> 30 Sec.
              </h4>
            </div>
            <div>
              <h4 className="text-xs font-semibold flex items-center">
                Max Fee:
                <span className="text-slate-400 font-normal ms-1">
                  0.00142535ETH
                </span>
              </h4>
            </div>
          </div>
        </div>
        <div className="w-full border border-slate-200 px-4 py-3 rounded-lg flex items-center justify-between gap-3 min-h-[55px]">
          <div className="flex items-center">
            <h4 className="text-xs font-semibold ">Nonce </h4>
            <button>
              <Edit className="w-3 h-3 ms-2 text-slate-500" />
            </button>
          </div>
          <div>
            {/* <input type="text" placeholder="" className="border border-slate-300 w-11 rounded-md px-2 py-1 text-xs font-semibold" /> */}
            <h4 className="text-xs font-semibold">3</h4>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-5">
        <button className="flex items-center justify-center text-sm text-XOrange hover:text-white border border-XOrange hover:bg-XOrange  bg-transparent px-3 py-2 rounded-3xl w-full min-h-[40px]">
          Reject
        </button>
        <button className="flex items-center justify-center text-sm text-white hover:text-XOrange hover:bg-transparent border border-XOrange bg-XOrange px-3 py-2 rounded-3xl w-full min-h-[40px]">
          Confirm
        </button>
      </div>
    </div>
  );
};

export default AllowAccess;
