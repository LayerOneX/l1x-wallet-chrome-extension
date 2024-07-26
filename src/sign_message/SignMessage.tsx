import { useEffect, useState } from "react";
import { Util } from "@util/Util";
import classNames from "classnames";
import Spinner from "../components/Spinner";
import { useSearchParams } from "react-router-dom";
import { Logger } from "@util/Logger.util";
import {
  accountConnected,
  getAccount,
  listConnectedAccounts,
} from "@util/Account.util";
import VirtualMachineFactory from "@factory/VirtualMachine.factory";
import ConnectRequest from "../connect_request/ConnectRequest";

interface ISignRequestProps {
  url: string;
  favIcon: string;
  requestId: string;
  appName: string;
  clusterType: string;
  endpoint: string;
  message: string;
  from: string;
}

const SignMessage = () => {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<ISignRequestProps>();
  const [loader, setLoader] = useState(false);
  const [account, setAccount] = useState<IXWalletAccount | null>(null);
  const [connected, setConnected] = useState(false);
  const disableSubmit = loader;
  const l1xProviderConfig = {
    clusterType: data?.clusterType || "mainnet",
    endpoint: data?.endpoint || "https://v2-mainnet-rpc.l1x.foundation",
  };

  useEffect(() => {
    const params: ISignRequestProps = JSON.parse(
      searchParams.get("data") || "{}"
    );
    setData(params);
  }, []);

  useEffect(() => {
    if (data?.from && data.url) {
      checkConnectionStatus(data.from, data.url);
    } else if (data?.url) {
      getAccountDetails();
    }
  }, [data]);

  useEffect(() => {
    if (connected && data?.url) {
      getAccountDetails();
    }
  }, [connected]);

  async function checkConnectionStatus(publicKey: string, origin: string) {
    const connected = await accountConnected(publicKey, origin);
    setConnected(connected);
  }

  async function getAccountDetails() {
    try {
      const connectedAccounts =
        (await listConnectedAccounts(data?.url || "")) || [];
      const publicKey =
        connectedAccounts.find((el) => el && el == data?.from) ||
        connectedAccounts[0];
      const account = await getAccount(publicKey);
      if (!account) {
        return setConnected(false);
      }
      setAccount(account);
    } catch (error) {
      Logger.error("getAccountDetails", error);
      rejectRequest("Invalid account. Failed to get account information.");
    }
  }

  async function rejectRequest(message = "Request cancelled by user") {
    Util.closeNotificationWindow(data?.requestId || "", {
      status: "failure",
      errorMessage: message,
      data: null,
    });
  }

  async function approveRequest() {
    try {
      setLoader(true);
      if (!account) {
        throw {
          errorMessage: "Account not found.",
        };
      }
      const virtualMachine = VirtualMachineFactory.createVirtualMachine(
        account?.type,
        account?.publicKey
      );
      const signMessage = await virtualMachine.signMessage(data?.message || "", account.privateKey);
      Util.closeNotificationWindow(data?.requestId || "", {
        status: "success",
        errorMessage: "",
        data: signMessage,
      });
    } catch (error: any) {
      Logger.error(error);
      Util.closeNotificationWindow(data?.requestId || "", {
        status: "failure",
        errorMessage: error?.errorMessage || "Failed to sign message.",
        data: null,
      });
    } finally {
      setLoader(false);
    }
  }

  return !connected && !account ? (
    <ConnectRequest from={data?.from} callback={() => setConnected(true)} />
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
                src={account?.icon}
                alt="Website Image"
                className="max-w-full"
              />
              <div className="flex-col ps-4">
                <h4 className="text-xs font-semibold mb-1">
                  {account?.accountName}
                </h4>
                <h6 className="text-[10px] text-slate-600">
                  {Util.wrapPublicKey(account?.publicKey || "")}
                </h6>
              </div>
            </div>
          </div>
          <h3 className="text-2xl font-semibold mb-2 text-center">
            Signature Request
          </h3>
          <p className="text-xs text-slate-500 mb-3 text-center max-w-[80%] mx-auto">
            Only sign this message if you fully understand the content and trust
            the requesting site.
          </p>
          <p className="text-xs text-slate-500 mb-3 text-center max-w-[80%] mx-auto">
            You are signing:
          </p>
          <div className="flex-col h-[285px] overflow-y-scroll">
            <h5>Message:</h5>
            <h6>{data?.message}</h6>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-5">
        <button
          className="flex items-center justify-center text-sm text-XOrange hover:text-white border border-XOrange hover:bg-XOrange  bg-transparent px-3 py-2 rounded-3xl w-full min-h-[40px]"
          onClick={() => rejectRequest()}
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
          {loader ? <Spinner /> : "Confirm"}
        </button>
      </div>
    </div>
  );
};

export default SignMessage;
