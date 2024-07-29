import { Send } from "react-feather";
import { PaperClipIcon } from "@heroicons/react/20/solid";
import { FC, memo, useContext } from "react";
import { AppContext } from "../Auth.guard";
import { useNavigate } from "react-router-dom";
import NetworkChains from "../components/NetworkChains";

const Dashboard: FC<IDashboardProps> = memo((props) => {
  const appContext = useContext(AppContext);
  const navigate = useNavigate();

  return (
    <>
      {props.activeTab == "NFT" ? (
        <div className="w-full p-4 bg-XLightBlue rounded-lg mb-3">
          <div className="mb-2">
            <h3 className="text-xs mb-3 font-semibold">My Collection</h3>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <button
                className="flex items-center justify-center text-sm text-white hover:bg-XBlue bg-XOrange px-3 py-2 rounded-md w-full min-h-[40px]"
                onClick={() => navigate("/import-nft")}
              >
                Import <PaperClipIcon className="w-4 h-5 ms-2" />
              </button>
              <button
                className="flex items-center justify-center text-sm text-white bg-XBlue hover:bg-XOrange px-3 py-2 rounded-md w-full min-h-[40px]"
                onClick={() => navigate("/send-nft")}
              >
                Send <Send className="w-4 h-5 ms-2" />
              </button>
            </div>
          </div>
          <div className="flex align-middle">
            <h6 className="text-xs mb-1 font-semibold ps-2">
              {appContext?.virtualMachine.activeNetwork.name}
            </h6>
          </div>
          <div className="bg-white p-2 rounded-full w-full h-10 flex items-center gap-1">
            <NetworkChains />
          </div>
        </div>
      ) : props.activeTab == "Transactions" ? (
        ""
      ) : (
        <div className="w-full p-4 bg-XLightBlue rounded-lg mb-3">
          <div className="mb-2">
            <h3 className="text-xs mb-1 font-semibold">Account Balance</h3>
            <h2 className="text-XBlue text-2xl font-bold mb-3 ">
              ${props.balance.toLocaleString() || 0}
            </h2>
            <button
              className="flex items-center justify-center text-sm text-white bg-XBlue hover:bg-XOrange px-3 py-2 rounded-md w-full min-h-[40px]"
              onClick={() => navigate("/send-token")}
            >
              Send <Send className="w-4 h-5 ms-2" />
            </button>
          </div>
          <div className="flex align-middle">
            Selected
            <h6 className="text-xs mb-1 font-semibold ps-2">
              {appContext?.virtualMachine.activeNetwork.name}
            </h6>
          </div>
          <div className="bg-white p-2 rounded-full w-full h-10 flex items-center gap-1">
            <NetworkChains />
          </div>
        </div>
      )}
    </>
  );
});

export default Dashboard;
