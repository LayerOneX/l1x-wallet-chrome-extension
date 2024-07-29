import { CheckCircleIcon } from "@heroicons/react/24/outline";
import L1xIcon from "@assets/images/l1x-icon.png";
import Spinner from "../components/Spinner";
import { FC, useContext, useState } from "react";
import { Logger } from "@util/Logger.util";
import Swal from "sweetalert2";
import { XCircleIconHtml } from "../components/XCircleIconHtml";
import { ExtensionStorage } from "@util/ExtensionStorage.util";
import { AppContext } from "../Auth.guard";
import { Util } from "@util/Util";

const ChangeNetworkRequest: FC<{requestId?: string}> = (transaction) => {
  const appContext = useContext(AppContext);
  const [loader, setLoader] = useState(false);

  async function rejectRequest() {
    Util.closeNotificationWindow(transaction?.requestId || "", {
      status: "failure",
      errorMessage: "User is not on L1X network.",
      data: null,
    });
  }

  async function changeNetowrk() {
    try {
      setLoader(true);
      const wallets = await ExtensionStorage.get("wallets");
      if (wallets?.L1X.length) {
        appContext?.changeActiveAccount(wallets?.L1X[0]);
      }
    } catch (error) {
      Logger.error(error);
      Swal.fire({
        iconHtml: XCircleIconHtml,
        title: "Failed ",
        text: "Failed to change network. Please try again.",
        customClass: {
          icon: "no-border",
        },
      });
    } finally {
      setLoader(false);
    }
  }

  return (
    <div className="w-[375px] h-[600px] mx-auto overflow-y-auto px-4 py-5 relative flex flex-col">
      <div className="flex-grow-[1]">
        <div className="text-lg font-semibold text-XBlue rounded-3xl flex items-center mb-5 text-center justify-center">
          Change Network Request
        </div>
        <div className="grid grid-cols-3 relative bg-slate-100 p-4 rounded-lg mb-5">
          <div className="w-full absolute top-[31px] left-[50%] translate-x-[-50%] mx-auto max-w-[60%] border-b border-dashed border-slate-400"></div>
          <div className="text-center  relative z-10">
            <div className="w-8 h-8 rounded-full overflow-hidden mb-2 bg-white mx-auto relative">
              <img
                src={appContext?.accountIcon}
                alt="Website Image"
                className="max-w-full w-full h-8 object-cover"
              />
            </div>
            <h4 className="text-xs font-semibold mb-1">{appContext?.type} Network</h4>
          </div>
          <div className=" relative z-10">
            <CheckCircleIcon className="w-8 h-8 text-green-500 mx-auto bg-white rounded-full" />
          </div>
          <div className="text-center relative z-10">
            <div className="w-8 h-8 rounded-full overflow-hidden mb-2 bg-white mx-auto">
              <img src={L1xIcon} alt="Website Image" className="max-w-full" />
            </div>
            <h4 className="text-xs font-semibold mb-1">L1X Network</h4>
          </div>
        </div>
        <p className="text-lg font-bold text-slate-500 mb-3 text-center max-w-[80%] mx-auto">
          Allow this site to switch the network?
        </p>
        <p className="text-sm text-slate-500 mb-3 text-center max-w-[80%] mx-auto">
          This site is requesting permission to switch your network settings.
          Allowing this action will enable the site to manage your network
          connection. Please ensure you trust this site before granting
          permission, as it will have access to your network configuration.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-5">
        <button
          className="flex items-center justify-center text-sm text-XOrange hover:text-white border border-XOrange hover:bg-XOrange  bg-transparent px-3 py-2 rounded-3xl w-full min-h-[40px]"
          onClick={rejectRequest}
        >
          Cancel
        </button>
        <button
          className="flex items-center justify-center text-sm text-white bg-XOrange hover:bg-transparent border border-XOrange hover:text-XOrange px-3 py-2 rounded-3xl w-full min-h-[40px]"
          onClick={changeNetowrk}
        >
          {loader ? <Spinner /> : "Confirm"}
        </button>
      </div>
    </div>
  );
};

export default ChangeNetworkRequest;
