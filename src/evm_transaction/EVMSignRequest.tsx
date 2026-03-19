import { useEffect, useState } from "react";
import { ExtensionStorage } from "@util/ExtensionStorage.util";
import { Util } from "@util/Util";
import { Logger } from "@util/Logger.util";
import { getAccount, listConnectedAccounts } from "@util/Account.util";
import Spinner from "../components/Spinner";
import { Button } from "@ui/index";
import { ethers } from "ethers";
import ConnectRequest from "../connect_request/ConnectRequest";

const SIGN_REQUEST_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

interface IEVMSignRequestData {
  method: string;
  params: any[];
  url: string;
  favIcon: string;
  appName: string;
  requestId: string;
  chainId: string;
  sdkRequestId?: string;
  timestamp?: number;
}

function getSignAddress(method: string, params: any[]): string {
  switch (method) {
    case "personal_sign":
      // personal_sign: [message, address]
      return params[1] || "";
    case "eth_sign":
      // eth_sign: [address, message]
      return params[0] || "";
    case "eth_signTypedData":
    case "eth_signTypedData_v3":
    case "eth_signTypedData_v4":
      // signTypedData: [address, typedData]
      return params[0] || "";
    default:
      return "";
  }
}

function getSignMessage(method: string, params: any[]): string {
  switch (method) {
    case "personal_sign":
      // personal_sign: [hexMessage, address]
      try {
        return ethers.toUtf8String(params[0]);
      } catch {
        return params[0] || "";
      }
    case "eth_sign":
      // eth_sign: [address, message]
      return params[1] || "";
    case "eth_signTypedData":
    case "eth_signTypedData_v3":
    case "eth_signTypedData_v4":
      // typedData: [address, jsonString]
      try {
        const parsed = typeof params[1] === "string" ? JSON.parse(params[1]) : params[1];
        return JSON.stringify(parsed, null, 2);
      } catch {
        return params[1] || "";
      }
    default:
      return "";
  }
}

function isTypedData(method: string): boolean {
  return method.startsWith("eth_signTypedData");
}

const EVMSignRequest = () => {
  const [data, setData] = useState<IEVMSignRequestData | null>(null);
  const [account, setAccount] = useState<IXWalletAccount | null>(null);
  const [loader, setLoader] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    loadSignRequest();
  }, []);

  useEffect(() => {
    if (data) {
      loadAccount();
    }
  }, [data]);

  async function loadSignRequest() {
    try {
      const signRequest = await ExtensionStorage.get("evmSignRequest") as IEVMSignRequestData | null;
      if (!signRequest) {
        window.close();
        return;
      }

      // Reject stale sign requests (older than 5 minutes)
      if (signRequest.timestamp && Date.now() - signRequest.timestamp > SIGN_REQUEST_MAX_AGE_MS) {
        Logger.error("loadSignRequest", "Sign request expired");
        await ExtensionStorage.remove("evmSignRequest");
        window.close();
        return;
      }

      setData(signRequest);
    } catch (error: any) {
      Logger.error("loadSignRequest", error);
      window.close();
    }
  }

  async function loadAccount() {
    if (!data) return;
    try {
      const address = getSignAddress(data.method, data.params);
      // Only allow signing with accounts connected to the requesting origin
      const connectedAccounts = await listConnectedAccounts(data.url);
      const matchedAddress =
        connectedAccounts?.find(
          (acc) => acc.toLowerCase() === address.toLowerCase()
        ) || connectedAccounts?.[0];

      if (matchedAddress) {
        const acc = await getAccount(matchedAddress, "EVM");
        if (acc) {
          setAccount(acc);
          setConnected(true);
          return;
        }
      }

      // Account not connected to this origin — require connection first
      setConnected(false);
    } catch (error: any) {
      Logger.error("loadAccount", error);
      setConnected(false);
    }
  }

  async function rejectRequest(message = "Signature request rejected by user.") {
    // Clean up storage
    await ExtensionStorage.remove("evmSignRequest");

    if (data?.sdkRequestId) {
      await chrome.storage.local.set({
        [`evm_response_${data.sdkRequestId}`]: {
          status: "failure",
          errorMessage: message,
          data: null,
          code: 4001,
        },
      }).catch(() => {});
    }
    Util.closeNotificationWindow(data?.requestId ?? "", {
      status: "failure",
      errorMessage: message,
      data: null,
      code: 4001,
    } as any);
  }

  async function approveRequest() {
    if (!account || !data) return;

    try {
      setLoader(true);
      const wallet = new ethers.Wallet(account.privateKey);
      let signature: string;

      if (data.method === "personal_sign") {
        // personal_sign: [hexMessage, address]
        const message = data.params[0];
        // If it's a hex string, convert to bytes for signing
        const messageBytes = ethers.isHexString(message)
          ? ethers.getBytes(message)
          : message;
        signature = await wallet.signMessage(
          typeof messageBytes === "string" ? messageBytes : messageBytes
        );
      } else if (data.method === "eth_sign") {
        // eth_sign: [address, dataToSign]
        const messageBytes = ethers.getBytes(data.params[1]);
        signature = await wallet.signMessage(messageBytes);
      } else if (isTypedData(data.method)) {
        // EIP-712: [address, typedDataJson]
        const typedData =
          typeof data.params[1] === "string"
            ? JSON.parse(data.params[1])
            : data.params[1];

        const { domain, types, message: msg } = typedData;

        // Remove EIP712Domain from types (ethers handles it)
        const signingTypes = { ...types };
        delete signingTypes.EIP712Domain;

        signature = await wallet.signTypedData(domain, signingTypes, msg);
      } else {
        throw new Error(`Unsupported sign method: ${data.method}`);
      }

      // Clean up storage
      await ExtensionStorage.remove("evmSignRequest");

      // Write deferred response via chrome.storage.local so the content
      // script can relay it even if the service worker has gone idle.
      if (data.sdkRequestId) {
        await chrome.storage.local.set({
          [`evm_response_${data.sdkRequestId}`]: {
            status: "success",
            errorMessage: "",
            data: { signature },
          },
        });
      } else {
        Util.closeNotificationWindow(data.requestId, {
          status: "success",
          errorMessage: "",
          data: { signature },
        });
      }
      window.close();
    } catch (error: any) {
      Logger.error("approveRequest", error);
      await ExtensionStorage.remove("evmSignRequest");

      if (data?.sdkRequestId) {
        await chrome.storage.local.set({
          [`evm_response_${data.sdkRequestId}`]: {
            status: "failure",
            errorMessage: error?.message ?? "Failed to sign.",
            data: null,
            code: 4001,
          },
        }).catch(() => {});
      }
      Util.closeNotificationWindow(data?.requestId ?? "", {
        status: "failure",
        errorMessage: error?.message ?? "Failed to sign.",
        data: null,
      });
    } finally {
      setLoader(false);
    }
  }

  if (!data) {
    return (
      <div className="app-frame min-h-[auto] mx-auto p-3 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!connected || !account) {
    return (
      <ConnectRequest
        from={getSignAddress(data.method, data.params)}
        callback={() => {
          setConnected(true);
          loadAccount();
        }}
      />
    );
  }

  const displayMessage = getSignMessage(data.method, data.params);
  const isTyped = isTypedData(data.method);

  return (
    <div className="app-frame min-h-[auto] mx-auto overflow-hidden p-3 flex flex-col gap-3">
      {/* Account Info */}
      <div className="app-card-soft px-3 py-2.5">
        <div className="flex w-full items-center gap-3 min-w-0">
          <img
            src={account.icon}
            alt="Account Icon"
            className="h-9 w-9 rounded-full object-cover shrink-0"
          />
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-white truncate">
              {account.accountName}
            </h4>
            <h6 className="text-xs text-txt-secondary truncate">
              {Util.wrapPublicKey(account.publicKey)}
            </h6>
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="text-center">
        <h3 className="text-xl leading-[1.1] font-semibold app-title">
          {isTyped ? "Typed Data Signature" : "Signature Request"}
        </h3>
      </div>

      {/* Warning */}
      <div className="text-center px-2">
        <p className="text-[13px] leading-5 app-subtle">
          Only sign this message if you fully understand the content and trust
          the requesting site.
        </p>
        <p className="mt-1 text-[11px] text-txt-secondary">
          {data.url}
        </p>
      </div>

      {/* Message Content */}
      <div className="min-h-0 flex-1">
        <div className="h-full overflow-y-auto">
          <h5 className="text-sm font-semibold text-white">
            {isTyped ? "Typed Data:" : "Message:"}
          </h5>
          <p
            className={`mt-1 text-sm text-txt-secondary break-words ${
              isTyped ? "font-mono text-[11px] whitespace-pre-wrap" : ""
            }`}
          >
            {displayMessage}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
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
            disabled={loader}
          >
            {loader ? <Spinner /> : "Confirm"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EVMSignRequest;
