import { useSearchParams } from "react-router-dom";
import { FC, useContext, useEffect, useState } from "react";
import { AppContext } from "../Auth.guard";
import { Util } from "@util/Util";
import { ExtensionStorage } from "@util/ExtensionStorage.util";
import Spinner from "../components/Spinner";
import ChangeNetworkRequest from "../change_network_request/ChangeNetworkRequest";
import { connectAccountsToSite, listConnectedAccounts } from "@util/Account.util";
import { Logger } from "@util/Logger.util";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { Button } from "@ui/index";
import xwalletIcon from "@assets/images/L1X_icon.png";

interface IConnectRequestProps {
  url: string;
  favIcon: string;
  requestId: string;
  appName: string;
  clusterType: string;
  endpoint: string;
  source?: "ethereum" | "l1x"; // "ethereum" = window.ethereum, "l1x" = window.L1X
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
    if (appContext?.virtualMachine || data) {
      listWallets();
    }
  }, [appContext?.virtualMachine, data]);

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
      // Show EVM accounts when request comes from window.ethereum
      if (data?.source === "ethereum") {
        setWallets(wallets.EVM || []);
      } else {
        setWallets(wallets.L1X);
      }
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
      
      if (walletsToConnect.length === 0) {
        throw {
          errorMessage: "No accounts selected. Please select at least one account.",
        };
      }
      
      if (!data?.url) {
        throw {
          errorMessage: "Invalid site URL.",
        };
      }
      
      const site: Omit<IConnectedSite, "accounts"> = {
        url: data.url,
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
      
      // Verify accounts were stored correctly
      const storedAccounts = await listConnectedAccounts(site.url);
      if (!storedAccounts || storedAccounts.length === 0) {
        throw {
          errorMessage: "Failed to verify account connection. Please try again.",
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

  return appContext?.type != "L1X" && data?.source !== "ethereum" ? (
    <ChangeNetworkRequest requestId={data?.requestId} />
  ) : (
    <div className="app-frame mx-auto overflow-hidden p-3 pb-4 flex flex-col gap-3">
      {/* <div className="app-pill w-full px-3 py-1 text-[10px] leading-tight font-medium text-center text-txt-secondary rounded-md">
        L1X {l1xProviderConfig.clusterType}
      </div> */}

      <div className="app-card-soft px-3 py-2.5">
        <div className="flex w-full items-center gap-3 min-w-0">
          <img
            src={data?.favIcon}
            alt="Website Image"
            className="h-9 w-9 rounded-full object-cover shrink-0"
          />
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-white truncate">
              {data?.appName}
            </h4>
            <h6 className="text-xs text-txt-secondary truncate">{data?.url}</h6>
          </div>
        </div>
      </div>

      <div className="text-center my-3">
        <h3 className="text-xl leading-[1.1] font-semibold app-title">
          Connect with X_Wallet
        </h3>
        <p className="mt-1 text-[13px] app-subtle">
          Select the account(s) to use on this site
        </p>
      </div>

      <div className="flex-1 min-h-0 max-h-[55%] overflow-hidden">
        <div className="h-full overflow-y-auto pr-1 space-y-1.5">
          {wallets.map((wallet) => (
            <label
              key={wallet.publicKey}
              className="border border-[#1E2127] relative cursor-pointer z-10 flex px-3 py-1.5 items-center justify-between rounded-xl"
              htmlFor={wallet.publicKey.toString()}
            >
              <div className="flex items-center min-w-0">
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

                <img src={xwalletIcon} alt="Account" className="h-10 w-10 shrink-0 rounded-full" />
                <div className="ps-2 min-w-0">
                  <h4 className="text-base leading-tight font-semibold text-white truncate">
                    {wallet.accountName}
                  </h4>
                  <h6 className="mt-0.5 text-[12px] text-txt-secondary truncate">
                    {Util.wrapPublicKey(wallet.publicKey)}
                  </h6>
                </div>
              </div>
              {selectedWallets[wallet.publicKey] ? (
                <CheckCircleIcon className="w-6 h-6 text-accent-green shrink-0" />
              ) : null}
            </label>
          ))}
        </div>
      </div>

      <div className="shrink-0">
        <div className="text-center app-subtle text-[13px] mb-2.5">Only connect with sites you trust.</div>
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
            className="h-10 rounded-full text-black bg-white hover:bg-gray-100 disabled:opacity-70 disabled:cursor-not-allowed"
            onClick={approveRequest}
            disabled={disableSubmit}
          >
            {loader ? <Spinner /> : "Connect"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConnectRequest;
