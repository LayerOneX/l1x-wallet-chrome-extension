import { useEffect, useState } from "react";
import { Util } from "@util/Util";
import Spinner from "../components/Spinner";
import { Logger } from "@util/Logger.util";
import { getAccount, listConnectedAccounts } from "@util/Account.util";
import { L1XProvider } from "@l1x/l1x-wallet-sdk";
import { ExtensionStorage } from "@util/ExtensionStorage.util";
import { Button } from "@ui/index";

const SignPayload = () => {
  const [data, setData] = useState<ISignRequestProps>();
  const [loader, setLoader] = useState(false);
  const [account, setAccount] = useState<IXWalletAccount | null>(null);
  const disableSubmit = loader;
  const l1xProviderConfig = {
    clusterType: data?.clusterType || "mainnet",
    endpoint: data?.endpoint || "https://v2-mainnet-rpc.l1x.foundation",
  };

  useEffect(() => {
    getPayload();
    window.addEventListener("beforeunload", beforeClose);
    return () => {
      window.removeEventListener("beforeunload", beforeClose);
    };
  }, []);

  useEffect(() => {
    if (data?.url) {
      getAccountDetails();
    }
  }, [data]);

  function beforeClose() {
    ExtensionStorage.remove("payloadToSign");
  }

  async function getPayload() {
    const payload = (await ExtensionStorage.get("payloadToSign")) || undefined;
    if (!payload) {
      rejectRequest("Invalid payload.");
    }
    setData(payload);
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
        return rejectRequest("Invalid account.");
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
      } else if (typeof data?.payload != 'object') {
        throw {
          errorMessage: "Invalid payload. Payload must be an object."
        }
      }
      const l1xProvider = new L1XProvider(l1xProviderConfig as any);
      const wallet = await l1xProvider.wallet.importByPrivateKey(Util.removePrefixOx(account.privateKey));
      const signature = await l1xProvider.wallet.signPayload(
        data?.payload,
        wallet.private_key
      );
      Util.closeNotificationWindow(data?.requestId || "", {
        status: "success",
        errorMessage: "",
        data: {
          ...data?.payload,
          signature: Array.from(signature),
          publicKey: Array.from(wallet.public_key_bytes)
        },
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

  return (
    <div className="app-frame min-h-[auto] mx-auto overflow-hidden p-3 flex flex-col gap-3">
      {/* <div className="app-pill w-full px-3 py-1 text-[10px] leading-tight font-medium text-center text-txt-secondary rounded-md">
        L1X {l1xProviderConfig.clusterType}
      </div> */}

      <div className="app-card-soft px-3 py-2.5">
        <div className="flex w-full items-center gap-3 min-w-0">
          <img
            src={account?.icon}
            alt="Account Icon"
            className="h-9 w-9 rounded-full object-cover shrink-0"
          />
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-white truncate">
              {account?.accountName}
            </h4>
            <h6 className="text-xs text-txt-secondary truncate">
              {Util.wrapPublicKey(account?.publicKey || "")}
            </h6>
          </div>
        </div>
      </div>

      <div className="text-center">
        <h3 className="text-[26px] leading-[1.1] font-semibold app-title">
          Signature Request
        </h3>
      </div>

      <div className="text-center px-2">
        <p className="text-[13px] leading-5 app-subtle">
          Only sign this message if you fully understand the content and trust
          the requesting site.
        </p>
      </div>

      <div className="min-h-0 flex-1">
        <div className=" h-full overflow-y-auto">
          <h5 className="text-sm font-semibold text-white">Message:</h5>
          <p className="mt-1 text-sm text-txt-secondary break-words">
            {data?.message}
          </p>
        </div>
      </div>

      <div className="mt-auto shrink-0">
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="tertiary"
            fullWidth
            className="h-10 rounded-full border bg-dark-card border-dark-border hover:bg-dark-surface hover:text-white"
            onClick={() => rejectRequest()}
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
            {loader ? <Spinner /> : "Confirm"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SignPayload;
