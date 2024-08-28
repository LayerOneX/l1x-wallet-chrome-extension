import { FC, useEffect, useState } from "react";
import classNames from "classnames";
import { ArrowRight, Copy, Info } from "react-feather";
import { Tooltip } from "react-tooltip";
import { Util } from "@util/Util";
import Spinner from "../../components/Spinner";
import {
  L1XProvider,
  ProviderAttrib,
  VMStateChangeCallArg,
} from "@l1x/l1x-wallet-sdk";

const StateChangeTransaction: FC<
  IStateChangeCall & {
    virtualMachine: IVirtualMachine;
    account: IXWalletAccount;
    onSuccess?: (hash?: string) => void;
    providerAttrib?: ProviderAttrib;
  }
> = (transaction) => {
  const l1xProvider = new L1XProvider(
    transaction.providerAttrib || {
      clusterType: "mainnet",
      endpoint: "https://v2-mainnet-rpc.l1x.foundation",
    }
  );
  // const appContext = useContext(AppContext);
  const [loader, setLoader] = useState(false);
  const [copied, setCopied] = useState(false);
  const [feelimit, setFeelimit] = useState(
    transaction.feeLimit
  );
  const [nonce, setNonce] = useState<string>();

  useEffect(() => {
    getTransactionConfig();
    window.addEventListener("beforeunload", handleClose);
    return () => {
      window.removeEventListener("beforeunload", handleClose);
    };
  }, []);

  function handleClose(event: BeforeUnloadEvent) {
    if (loader) {
      event.preventDefault();
    }
  }

  async function getTransactionConfig() {
    const nonce = await transaction.virtualMachine.getCurrentNonce(
      transaction.providerAttrib
    );
    const feelimit = await transaction?.virtualMachine.getEstimateFee(
      transaction.providerAttrib
    );
    setFeelimit(transaction.feeLimit ?? feelimit ?? undefined);
    setNonce(transaction.nonce || nonce || undefined);
  }

  function copyReceiverAddress() {
    navigator.clipboard.writeText(transaction.account.publicKey || "");
    setCopied(true);
  }

  async function validateTransaction(hash: string) {
    await new Promise((resolve) => {
      setTimeout(resolve, 5000);
    });
    const receipt = await l1xProvider.core.getTransactionReceipt({ hash });
    return (
      typeof receipt.status != "undefined" &&
      !isNaN(receipt.status as any) &&
      +receipt.status == 0
    );
  }

  async function sendTransaction() {
    try {
      setLoader(true);
      const data: VMStateChangeCallArg = {
        attrib: {
          contract_address: transaction.contractAddress,
          function: transaction.functionName,
          arguments: transaction.arguments,
          is_argument_object: typeof transaction.arguments == "object",
        },
        private_key: Util.removePrefixOx(transaction.account.privateKey || ""),
        fee_limit: feelimit as any,
        nonce: nonce && !isNaN(nonce as any) ? +nonce : undefined,
      };
      const response = await l1xProvider.vm.makeStateChangingFunctionCall(data);
      if (!validateTransaction(response.hash)) {
        throw new Error("Failed to process transaction. Please try again.");
      }
      const newTransaction: IStateChangeCall = {
        ...transaction,
        hash: response.hash,
      };
      await transaction?.virtualMachine.addTransaction(
        newTransaction,
        transaction.providerAttrib?.endpoint
      );
      Util.closeNotificationWindow(transaction.requestId || "", {
        status: "success",
        errorMessage: "",
        data: {
          hash: newTransaction.hash,
        },
      });
    } catch (error: any) {
      await transaction?.virtualMachine.removePendingTransaction(
        transaction.id
      );
      Util.closeNotificationWindow(transaction.requestId || "", {
        status: "failure",
        errorMessage: error?.message || "Failed to process transaction.",
        data: null,
      });
    } finally {
      setLoader(false);
    }
  }

  function rejectTransaction() {
    transaction?.virtualMachine.removePendingTransaction(transaction.id);
    Util.closeNotificationWindow(transaction.requestId || "", {
      status: "failure",
      errorMessage: "Transaction rejected by user.",
      data: {
        hash: transaction.hash,
      },
    });
  }

  return (
    <div className="w-[375px] h-[600px] mx-auto overflow-y-auto px-4 py-5 relative flex flex-col">
      <div className="flex-grow-[1]">
        <div className="text-[10px] font-medium flex items-center justify-center  text-right mb-5 bg-XLightBlue absolute top-0 left-0 w-full px-4 py-1">
          Transaction Request On&nbsp;
          {new URL(transaction.rpc).origin || ""}
        </div>
        <div className="grid grid-cols-2 items-center px-3 py-2  mb-3 rounded-lg bg-XLightBlue relative mt-5">
          <div className="flex items-center justify-start">
            <span className="w-6 h-6 overflow-hidden rounded-full me-2">
              <img
                src={transaction.account.icon}
                className="max-w-full object-cover h-6"
              />
            </span>
            <h4 className="text-[10px] font-semibold">
              {transaction.account.accountName}
            </h4>
          </div>
          <span
            className="absolute top-2 left-[50%] translate-x-[-50%] text-black
       bg-white w-6 h-6 inline-flex items-center justify-center rounded-full"
          >
            <ArrowRight className="w-4 h-4" />
          </span>
          <div className="flex items-center justify-end">
            <h4 className="text-[10px] font-semibold flex items-center">
              {Util.wrapPublicKey(transaction?.contractAddress)}
              <button
                className="ms-2"
                onClick={() => copyReceiverAddress()}
                data-tooltip-id="copy-publickey-click"
              >
                <Copy className="w-4 h-4  text-slate-400" />
              </button>
              {copied && (
                <Tooltip
                  className="font-normal !bg-white !text-black shadow-lg !opacity-100 border border-slate-100 !text-[12px]"
                  id="copy-publickey-click"
                  content="Copied!"
                  defaultIsOpen={true}
                  afterShow={() =>
                    setTimeout(() => {
                      setCopied(false);
                    }, 1000)
                  }
                  events={["click"]}
                />
              )}
            </h4>
          </div>
        </div>
        <div className="bg-slate-100 px-5 pt-4 pb-3 rounded-lg mb-3">
          <h4 className="flex items-center  text-sm mb-2">
            <b className="font-medium me-2">Contract Address: </b>
            {Util.wrapPublicKey(transaction.contractAddress)}
          </h4>
          <h4 className="flex items-center  text-sm mb-2">
            <b className="font-medium me-2">Function Name:</b>
            {transaction.functionName || ""}
          </h4>
          {/* <h4 className="flex items-center  text-sm mb-2">
            <b className="font-medium me-2">Fee limit:</b>
            {feelimit || ""}
          </h4> */}
          <h4 className="flex items-center  text-sm mb-2">
            <b className="font-medium me-2">Nonce:</b>
            {nonce || ""}
          </h4>
        </div>

        {/* Estimate changes */}
        <div className="bg-slate-100 px-5 pt-4 pb-3 rounded-lg mb-2">
          <h2 className="font-bold text-xs mb-2 flex items-center">
            Estimated Changes
            <span
              className="ms-1 cursor-pointer"
              data-tooltip-id="estimated-changes-info"
              data-tooltip-content="Possible changes happen in wallet after transaction."
            >
              <Info className="w-4 h-4 text-slate-400" />
              <Tooltip
                id="estimated-changes-info"
                className="max-w-40 font-normal !bg-white !text-black shadow-lg !opacity-100 border border-slate-100 !text-[12px]"
              />
            </span>
          </h2>
          <h4 className="font-medium text-xs mb-1 flex items-center text-slate-500">
            No changes predicted for your wallet
          </h4>
        </div>
        {/* End of estimate changes */}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-5">
        <button
          className="flex items-center justify-center text-sm text-XOrange border border-XOrange bg-transparent px-3 py-2 rounded-3xl w-full min-h-[40px]"
          type="button"
          onClick={rejectTransaction}
          disabled={loader}
        >
          Reject
        </button>
        <button
          className={classNames(
            loader ? "bg-XOrange/70 pointer-event-none" : "bg-XOrange",
            "flex items-center justify-center text-sm text-white px-3 py-2 rounded-3xl w-full min-h-[40px]"
          )}
          disabled={loader}
          onClick={sendTransaction}
        >
          {loader ? <Spinner /> : "Confirm"}
        </button>
      </div>
    </div>
  );
};

export default StateChangeTransaction;
