import { useSearchParams } from "react-router-dom";
import { FC, useContext, useEffect, useState } from "react";
import { AppContext } from "../Auth.guard";
import { Util } from "@util/Util";
import { ExtensionStorage } from "@util/ExtensionStorage.util";
import Spinner from "../components/Spinner";
import ChangeNetworkRequest from "../change_network_request/ChangeNetworkRequest";
import classNames from "classnames";
import { connectAccountsToSite } from "@util/Account.util";
import { Logger } from "@util/Logger.util";
import { CheckCircleIcon } from "@heroicons/react/24/outline";

interface IConnectRequestProps {
  url: string;
  favIcon: string;
  requestId: string;
  appName: string;
  clusterType: string;
  endpoint: string;
}

const ConnectRequest: FC<{ from?: string; callback?: () => void }> = (
  props
) => {
  const appContext = useContext(AppContext);
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<IConnectRequestProps>();
  const [loader, setLoader] = useState(false);
  const [wallets, setWallets] = useState<IXWalletAccount[]>([]);
  const [selectedWallets, setSelectedWallets] = useState<{
    [k: string]: boolean;
  }>({});
  const l1xProviderConfig = {
    clusterType: data?.clusterType || "mainnet",
    endpoint: data?.endpoint || "https://v2-mainnet-rpc.l1x.foundation",
  };
  const disableSubmit = !Object.keys(selectedWallets).filter(
    (el) => selectedWallets[el]
  ).length;

  useEffect(() => {
    const params: IConnectRequestProps = JSON.parse(
      searchParams.get("data") || "{}"
    );
    setData(params);
  }, []);

  useEffect(() => {
    if (appContext?.virtualMachine) {
      listWallets();
    }
  }, [appContext?.virtualMachine]);

  useEffect(() => {
    if (appContext && wallets.length) {
      setSelectedWallets({
        [props.from ?? appContext.publicKey ?? wallets[0]]: true,
      });
    }
  }, [wallets, props.from]);

  async function listWallets() {
    const wallets = await ExtensionStorage.get("wallets");
    if (wallets) {
      setWallets(wallets.L1X);
    }
  }

  async function rejectRequest() {
    Util.closeNotificationWindow(data?.requestId || "", {
      status: "failure",
      errorMessage: "Connect request cancelled by user",
      data: null,
    });
  }

  async function approveRequest() {
    try {
      setLoader(true);
      const walletsToConnect = Object.keys(selectedWallets).filter(
        (el) => selectedWallets[el]
      );
      const site: Omit<IConnectedSite, "accounts"> = {
        url: data?.url || "",
        favIcon: data?.favIcon || "",
        permissions: [],
        connectedAt: Date.now(),
        l1xProviderConfig: l1xProviderConfig,
      };
      const updateSite = await connectAccountsToSite(site, walletsToConnect);
      if (!updateSite) {
        throw {
          errorMessage: "Failed to connect account.",
        };
      }
      if (props.callback && typeof props.callback == "function") {
        return props.callback();
      }
      Util.closeNotificationWindow(
        data?.requestId || "",
        {
          status: "success",
          errorMessage: "",
          data: {
            isConnected: true,
          },
        },
        "CONNECT"
      );
    } catch (error: any) {
      Logger.error(error);
      Util.closeNotificationWindow(data?.requestId || "", {
        status: "failure",
        errorMessage:
          error?.errorMessage || "Failed to connect site. Please try again.",
        data: null,
      });
    } finally {
      setLoader(false);
    }
  }

  return appContext?.type != "L1X" ? (
    <ChangeNetworkRequest requestId={data?.requestId} />
  ) : (
    <div className="w-[375px] h-[600px] mx-auto overflow-y-auto px-4 py-5 relative flex flex-col">
      <div className="flex-grow-[1]">
        <div className="text-[10px] font-medium flex items-center justify-center  text-right mb-5 bg-XLightBlue absolute top-0 left-0 w-full px-4 py-1">
          L1X {l1xProviderConfig.clusterType}
        </div>
        <div className="w-full mt-4">
          <div className="relative bg-slate-100 p-4 rounded-lg mb-5">
            <div className="relative z-10 h-8 flex w-full">
              <img
                src={data?.favIcon}
                alt="Website Image"
                className="max-w-full"
              />
              <div className="flex-col ps-4">
                <h4 className="text-xs font-semibold">{data?.appName}</h4>
                <h6 className="text-[10px] text-slate-600">{data?.url}</h6>
              </div>
            </div>
          </div>
          <div className="w-full text-center">
            <h3 className="text-base font-semibold mb-1 ">
              Connect with X-Wallet
            </h3>
            <p className="text-xs text-slate-500 mb-3 ">
              Select the account(s) to use on this site
            </p>
          </div>
          <div className="flex-col h-[295px] overflow-y-auto">
            {wallets.map((wallet) => (
              <label
                className="relative cursor-pointer z-10 flex px-3 py-2 align-middle items-center justify-between bg-slate-100 rounded-full mb-2"
                htmlFor={wallet.publicKey.toString()}
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-blue-600 me-3 border border-slate-300 appearance-none hidden"
                    id={wallet.publicKey.toString()}
                    checked={selectedWallets[wallet.publicKey]}
                    onChange={(event) =>
                      setSelectedWallets((prevState) => ({
                        ...prevState,
                        [wallet.publicKey]: event.target.checked,
                      }))
                    }
                  />

                  <img src={wallet.icon} alt="Website Image" className="h-11" />
                  <div className="flex-col ps-2">
                    <h4 className="text-xs font-semibold pb-1">
                      {wallet.accountName}
                    </h4>
                    <h6 className="text-[10px] text-slate-600">
                      {Util.wrapPublicKey(wallet.publicKey)}
                    </h6>
                  </div>
                </div>
                {selectedWallets[wallet.publicKey] ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                ) : (
                  ""
                )}
              </label>
            ))}
          </div>
        </div>
      </div>
      <div className="text-center">Only connect with sites you trust.</div>
      <div className="grid grid-cols-2 gap-3 mt-5">
        <button
          className="flex items-center justify-center text-sm text-XOrange hover:text-white border border-XOrange hover:bg-XOrange  bg-transparent px-3 py-2 rounded-3xl w-full min-h-[40px]"
          onClick={rejectRequest}
        >
          Cancel
        </button>
        <button
          className={classNames(
            disableSubmit ? "bg-XOrange/70 pointer-event-none" : "bg-XOrange",
            "flex items-center justify-center text-sm text-white px-3 py-2 rounded-3xl w-full min-h-[`40px]"
          )}
          onClick={approveRequest}
          disabled={disableSubmit}
        >
          {loader ? <Spinner /> : "Connect"}
        </button>
      </div>
    </div>
  );
};

export default ConnectRequest;
