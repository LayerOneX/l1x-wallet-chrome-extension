import { ArrowRight, Copy, Info } from "react-feather";
import { Tooltip } from "react-tooltip";
import { FC, useEffect, useState } from "react";
import { Util } from "@util/Util";
import classNames from "classnames";
import Swal from "sweetalert2";
import { XCircleIconHtml } from "../../components/XCircleIconHtml";
import Spinner from "../../components/Spinner";
import { XCheckCircleIconHtml } from "../../components/XCheckCircleIconHtml";
import { ProviderAttrib } from "@l1x/l1x-wallet-sdk";
import Skeleton from "react-loading-skeleton";
import { removeTransactionRequest } from "@util/Transaction.util";

const TransferNativeToken: FC<
  ITransferNativeToken & {
    virtualMachine: IVirtualMachine;
    account: IXWalletAccount;
    onSuccess?: (hash?: string) => void;
    providerAttrib?: ProviderAttrib;
  }
> = (transaction) => {
  const [tokenDetails, setTokenDetails] = useState<IToken>();
  const [tokenDetailLoader, setTokenDetailLoader] = useState(true);
  const [loader, setLoader] = useState(false);
  const [copied, setCopied] = useState(false);
  const [feelimit, setFeelimit] = useState<string>();
  const [nonce, setNonce] = useState("");
  const transactionAmount = tokenDetails
    ? +transaction.amount / 10 ** tokenDetails.decimals
    : 0;

  useEffect(() => {
    fetchNativeTokenDetails();
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
    setFeelimit(transaction.feeLimit ?? feelimit);
    setNonce(transaction.nonce ?? nonce);
  }

  async function fetchNativeTokenDetails() {
    try {
      setTokenDetailLoader(true);
      const details = await transaction?.virtualMachine.getNativeTokenDetails(
        transaction.providerAttrib
      );
      setTokenDetails(details);
    } catch (error: any) {
      Swal.fire({
        iconHtml: XCircleIconHtml,
        title: "Failed",
        text: error?.errorMessage ?? "Failed to fetch token details.",
        customClass: {
          icon: "no-border",
        },
      });
    } finally {
      setTokenDetailLoader(false);
    }
  }

  async function handleSignature() {
    const signature = await transaction.virtualMachine
      .getProvider(transaction.providerAttrib)
      .core.getSignedPayloadForTransfer({
        receipient_address: transaction.to,
        value: +transaction.amount,
        private_key: transaction.account.privateKey,
      });
    await transaction.virtualMachine.removePendingTransaction(transaction.id);
    return Util.closeNotificationWindow(transaction.requestId || "", {
      status: "success",
      errorMessage: "",
      data: {
        signature: Buffer.from(JSON.stringify(signature)).toString("base64"),
      },
    });
  }

  async function transferNativeToken() {
    const response = await transaction?.virtualMachine.transferNativeToken(
      transaction.to,
      +transaction.amount,
      transaction.account.privateKey,
      transaction.providerAttrib,
      feelimit,
      nonce
    );
    if (!response?.hash) {
      throw "Failed to process transaction please try again.";
    }
    transaction.hash = response?.hash;

    // add transaction to transaction list
    await transaction?.virtualMachine.addTransaction(
      transaction,
      transaction.providerAttrib?.endpoint
    );

    // handle transaction success
    if (transaction.source == "dapp") {
      Util.closeNotificationWindow(transaction.requestId || "", {
        status: "success",
        errorMessage: "",
        data: {
          hash: transaction.hash,
        },
      });
    } else {
      if (transaction.onSuccess && typeof transaction.onSuccess == "function") {
        transaction.onSuccess(transaction.hash);
      }
      Swal.fire({
        iconHtml: XCheckCircleIconHtml,
        title: "Success",
        text: "Transaction completed successfully",
        customClass: {
          icon: "no-border",
        },
      });
    }
  }

  async function confirmTransaction() {
    try {
      setLoader(true);
      if (transaction.responseType == "SIGNATURE") {
        await handleSignature();
      } else {
        await transferNativeToken();
      }
    } catch (error: any) {
      if (transaction.source != "dapp") {
        Swal.fire({
          iconHtml: XCircleIconHtml,
          title: "Failed",
          text:
            error?.errorMessage ??
            "Failed to process transaction please try again.",
          customClass: {
            icon: "no-border",
          },
        });
      } else {
        await removeTransactionRequest(transaction.requestId ?? "");
        Util.closeNotificationWindow(transaction.requestId ?? "", {
          status: "failure",
          errorMessage: error,
          data: null,
        });
      }
    } finally {
      setLoader(false);
    }
  }

  function copyReceiverAddress() {
    navigator.clipboard.writeText(transaction.to ?? "");
    setCopied(true);
  }

  async function rejectTransaction() {
    await transaction.virtualMachine.removePendingTransaction(transaction.id);
    if (transaction.source == "dapp") {
      Util.closeNotificationWindow(transaction.requestId ?? "", {
        status: "failure",
        errorMessage: "Transaction rejected by user.",
        data: null,
      });
    }
  }

  return (
    <div className="w-[375px] h-[600px] mx-auto overflow-y-auto px-4 py-5 relative flex flex-col">
      <div className="flex-grow-[1]">
        <div className="text-[10px] font-medium flex items-center justify-center  text-right mb-5 bg-XLightBlue absolute top-0 left-0 w-full px-4 py-1">
          Transaction Request On&nbsp;
          {new URL(transaction.rpc).origin ?? ""}
        </div>
        <div className="grid grid-cols-2 items-center px-3 py-2  mb-3 rounded-lg bg-XLightBlue relative mt-5">
          <div className="flex items-center justify-start">
            <span className="w-6 h-6 overflow-hidden rounded-full me-2">
              <img
                src={transaction?.virtualMachine.activeNetwork.icon}
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
              {Util.wrapPublicKey(transaction?.to)}
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

        <h2 className="font-bold text-xs mb-1 flex items-center">
          You are Sending
        </h2>
        {tokenDetailLoader ? (
          <Skeleton
            height={57}
            borderRadius={8}
            className="mb-2"
            baseColor="#f1f5f9"
            highlightColor="#ffffff"
          />
        ) : (
          <div className="bg-slate-100 p-4 rounded-lg mb-3">
            <div className="w-100 flex items-center mb-2">
              <span className="w-6 h-6 flex items-center justify-center me-1">
                <img src={tokenDetails?.icon} className="max-w-full" />
              </span>
              <div className="flex items-end">
                <h3 className="text-xl font-semibold mr-1">
                  {transactionAmount.toLocaleString()}
                </h3>
                <span className="text-sm">{transaction.symbol}</span>
              </div>
            </div>
            <div className="flex items-center justify-between w-full">
              <p className="text-xs">
                $
                {(
                  transactionAmount * (tokenDetails?.usdRate ?? 0)
                ).toLocaleString()}
              </p>
              <div className="flex items-center ">
                <div className="flex items-center">
                  <h4 className="text-xs font-semibold text-slate-800 leading-4 flex text-center mr-2">
                    Balance: &nbsp;{tokenDetails?.balance?.toLocaleString()}{" "}
                    {tokenDetails?.symbol}
                  </h4>
                  <h6 className="text-xs text-slate-500">
                    ($
                    {(
                      (tokenDetails?.balance ?? 0) *
                      (tokenDetails?.usdRate ?? 0)
                    ).toLocaleString()}
                    )
                  </h6>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* <h2 className="font-bold text-xs mb-1 flex items-center">Details</h2> */}
        <div className="bg-slate-100 p-4 rounded-lg mb-3">
          <h2 className="font-bold text-xs mb-2 flex items-center">
            Estimated Changes
            <span
              className="ms-1 cursor-pointer"
              data-tooltip-id="estimated-changes-info"
              data-tooltip-content="Estimated changes are what might happen if you go through with this transaction. This is just a prediction, not a guarantee."
            >
              <Info className="w-4 h-4 text-slate-400" />
              <Tooltip
                id="estimated-changes-info"
                className="max-w-40 font-normal !bg-white !text-black shadow-lg !opacity-100 border border-slate-100 !text-[12px]"
              />
            </span>
          </h2>
          {tokenDetailLoader ? (
            <Skeleton
              height={57}
              borderRadius={8}
              className="mb-2"
              baseColor="#f1f5f9"
              highlightColor="#ffffff"
            />
          ) : (
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-xs mb-1 flex items-center text-slate-500">
                You Send :
              </h4>
              <div className="">
                <div className="flex gap-3 items-center justify-end">
                  <div className="bg-red-500/10 text-xs px-3 py-1 rounded-full font-semibold text-red-500 text-center">
                    -{transactionAmount}
                  </div>
                  <div className="bg-white text-xs ps-2 pe-4 py-1 rounded-full font-semibold text-slate-600 text-center flex items-center justify-center">
                    <span className="w-4 h-4 flex items-center justify-center me-1">
                      <img src={tokenDetails?.icon} className="max-w-full" />
                    </span>{" "}
                    {tokenDetails?.symbol}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* {feelimit || nonce ? (
          <div className="bg-slate-100 p-4 rounded-lg">
            <div className="flex items-start justify-between mb-2">
              <h2 className="font-bold text-xs  flex items-center">
                Estimated Fees
              </h2>
            </div>
            <div className="grid grid-cols-3 bg-white rounded-md items-center p-1 mb-3">
              <label className="text-sm pl-3 flex align-middle">
                Nonce
                <Info
                  className="w-4 h-4 text-slate-400 cursor-pointer ms-1"
                  data-tooltip-id="estimated-changes-info"
                  data-tooltip-content="Current nonce for the transaction. Update only if necessary."
                />
                <Tooltip
                  id="estimated-changes-info"
                  className="max-w-40 font-normal !bg-white !text-black shadow-lg !opacity-100 border border-slate-100 !text-[12px]"
                />
              </label>
              <input
                className="w-full py-2 px-4 border border-gray-300 rounded-md col-span-2 text-sm font-medium"
                placeholder=""
                value={nonce}
                readOnly
              />
            </div>
            <div className="grid grid-cols-3 bg-white rounded-md items-center p-1 mb-3">
              <label className="text-sm pl-3 flex align-middle">
                Fee Limit{" "}
                <Info
                  className="w-4 h-4 text-slate-400 cursor-pointer ms-1"
                  data-tooltip-id="estimated-changes-info"
                  data-tooltip-content="Maximum fee amount for the transaction. (Amount is in decimal format)"
                />
                <Tooltip
                  id="estimated-changes-info"
                  className="max-w-40 font-normal !bg-white !text-black shadow-lg !opacity-100 border border-slate-100 !text-[12px]"
                />
              </label>
              <input
                className="w-full py-2 px-4 border border-gray-300 rounded-md col-span-2 text-sm font-medium"
                placeholder=""
                value={feelimit}
                readOnly
              />
            </div>
          </div>
        ) : (
          ""
        )} */}
      </div>
      <div className="grid grid-cols-2 gap-3 mt-5">
        <button
          className="flex items-center justify-center text-sm text-XOrange hover:text-white border border-XOrange hover:bg-XOrange  bg-transparent px-3 py-2 rounded-3xl w-full min-h-[40px]"
          type="button"
          onClick={rejectTransaction}
          disabled={loader || tokenDetailLoader}
        >
          Reject
        </button>
        <button
          className={classNames(
            loader ? "bg-XOrange/70 pointer-event-none" : "bg-XOrange",
            "flex items-center justify-center text-sm text-white px-3 py-2 rounded-3xl w-full min-h-[40px] hover:bg-XBlue"
          )}
          disabled={loader || tokenDetailLoader}
          onClick={confirmTransaction}
        >
          {loader ? <Spinner /> : "Confirm"}
        </button>
      </div>
    </div>
  );
};

export default TransferNativeToken;
