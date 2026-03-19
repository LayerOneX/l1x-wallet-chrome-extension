import { ArrowRightIcon } from "@heroicons/react/24/outline";
import L1xIcon from "@assets/images/l1x-icon.png";
import Spinner from "../components/Spinner";
import { FC, useContext, useState } from "react";
import { Logger } from "@util/Logger.util";
import Swal from "sweetalert2";
import { XCircleIconHtml } from "../components/XCircleIconHtml";
import { ExtensionStorage } from "@util/ExtensionStorage.util";
import { AppContext } from "../Auth.guard";
import { Util } from "@util/Util";
import { Button } from "@ui/index";

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
    <div className="mx-auto overflow-hidden p-3 pb-4 flex flex-col gap-3 w-full h-screen bg-dark-bg text-white">
      <div className="text-center my-4">
        <h3 className="text-xl leading-[1.1] font-semibold app-title">
          Switch Network
        </h3>
        <p className="mt-1 text-[13px] app-subtle">
          This site requires a different network
        </p>
      </div>

      <div className="app-card-soft px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          {/* Current network */}
          <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-[#2a2f39] flex items-center justify-center">
              <img
                src={appContext?.accountIcon}
                alt="Current Network"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-xs font-medium text-white text-center truncate w-full">
              {appContext?.type}
            </span>
          </div>

          {/* Arrow */}
          <div className="shrink-0 px-1">
            <ArrowRightIcon className="w-5 h-5 app-subtle" />
          </div>

          {/* Target network */}
          <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-[#2a2f39] flex items-center justify-center p-1.5">
              <img src={L1xIcon} alt="L1X Network" className="w-full h-full object-contain" />
            </div>
            <span className="text-xs font-medium text-white text-center truncate w-full">
              L1X
            </span>
          </div>
        </div>
      </div>

      <div className="app-card-soft px-4 py-3 mt-1">
        <p className="text-[13px] app-subtle leading-relaxed">
          Allow this site to switch your active network from{" "}
          <span className="text-white font-medium">{appContext?.type}</span> to{" "}
          <span className="text-white font-medium">L1X</span>?
          Only approve if you trust this site.
        </p>
      </div>

      <div className="flex-1" />

      <div className="shrink-0">
        <div className="text-center app-subtle text-[13px] mb-2.5">
          Only switch networks on sites you trust.
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="tertiary"
            fullWidth
            className="h-10 rounded-full border bg-dark-card border-dark-border hover:bg-dark-surface hover:text-white"
            onClick={rejectRequest}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            fullWidth
            className="h-10 rounded-full text-black bg-white hover:bg-gray-100"
            onClick={changeNetowrk}
          >
            {loader ? <Spinner /> : "Switch"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChangeNetworkRequest;
