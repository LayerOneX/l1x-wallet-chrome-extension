import { FC, useEffect, useState } from "react";
import classNames from "classnames";
import { ArrowRight, Copy } from "react-feather";
import { Tooltip } from "react-tooltip";
import { Util } from "@util/Util";
import Spinner from "../../components/Spinner";
import ApproveTransaction from "./ApproveTransaction";
import Swal from "sweetalert2";
import { XCircleIconHtml } from "../../components/XCircleIconHtml";
import { XCheckCircleIconHtml } from "../../components/XCheckCircleIconHtml";
import { ProviderAttrib } from "@l1x/l1x-wallet-sdk";
import { Logger } from "@util/Logger.util";
import brokenNFT from "@assets/images/image-broken.svg";
import { removeTransactionRequest } from "@util/Transaction.util";

const TransferNFT: FC<
  ITransferNFT & {
    virtualMachine: IVirtualMachine;
    account: IXWalletAccount;
    onSuccess?: (hash?: string) => void;
    providerAttrib?: ProviderAttrib;
  }
> = (transaction) => {
  // const appContext = useContext(AppContext);
  const [nftDetails, setNFTDetails] = useState<INFT>();
  const [loader, setLoader] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isTransferApproved, setIsTransferApproved] = useState(false);
  const [feelimit, setFeelimit] = useState("");
  const [nonce, setNonce] = useState("");

  useEffect(() => {
    fetchNFTDetails();
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
    setFeelimit(transaction.feeLimit ?? feelimit ?? "");
    setNonce(transaction.nonce ?? nonce ?? "");
  }

  function copyReceiverAddress() {
    navigator.clipboard.writeText(transaction.to ?? "");
    setCopied(true);
  }

  async function fetchNFTDetails() {
    try {
      const details = await transaction?.virtualMachine.getNFTDetails(
        transaction.collectionAddress,
        transaction.tokenId,
        transaction.providerAttrib
      );
      setNFTDetails(details);
    } catch (error: any) {
      if (transaction.source != "dapp") {
        Swal.fire({
          iconHtml: XCircleIconHtml,
          title: "Failed",
          text: error?.errorMessage ?? "Failed to fetch token details.",
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
    }
  }

  async function confirmTransaction() {
    try {
      setLoader(true);
      const response = await transaction?.virtualMachine.transferNFT(
        transaction.collectionAddress,
        transaction.tokenId,
        transaction.to,
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
        Util.closeNotificationWindow(transaction.requestId ?? "", {
          status: "success",
          errorMessage: "",
          data: {
            hash: transaction.hash,
          },
        });
      } else {
        if (
          transaction.onSuccess &&
          typeof transaction.onSuccess == "function"
        ) {
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
    } catch (error: any) {
      Logger.error(error);
      if (transaction.source != "dapp") {
        Swal.fire({
          iconHtml: XCircleIconHtml,
          title: "Failed ",
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

  function handleNFTTransferApproval() {
    setIsTransferApproved(true);
  }

  async function rejectTransaction() {
    await transaction?.virtualMachine.removePendingTransaction(transaction.id);
    if (transaction.source == "dapp") {
      Util.closeNotificationWindow(transaction.requestId ?? "", {
        status: "failure",
        errorMessage: "Transaction rejected by user.",
        data: null,
      });
    }
  }

  return isTransferApproved ? (
    <div className="w-[375px] h-[600px] mx-auto overflow-y-auto px-4 py-5 relative flex flex-col">
      <div className="flex-grow-[1]">
        <div className="text-[10px] font-medium flex items-center justify-center  text-right mb-5 bg-XLightBlue absolute top-0 left-0 w-full px-4 py-1">
          Transaction Request On&nbsp;
          {new URL(transaction.rpc).origin ?? ""}
        </div>
        <div className="text-lg font-semibold text-XBlue rounded-3xl flex items-center justify-center mt-5 mb-5 text-center">
          Transfer NFT
        </div>
        <div className="grid grid-cols-2 items-center px-3 py-2  mb-3 rounded-lg bg-XLightBlue relative">
          <div className="flex items-center justify-start">
            <span className="w-6 h-6 overflow-hidden rounded-full me-2">
              <img
                src={transaction?.account.icon}
                className="max-w-full object-cover h-6"
                alt="icon"
              />
            </span>
            <h4 className="text-[10px] font-semibold">
              {transaction?.account.accountName}
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
        <div className="bg-slate-100 px-5 pt-4 pb-3 rounded-lg mb-3">
          <div className="w-full flex items-center ">
            <div>
              <span className="w-8 h-8 flex items-center justify-center me-2 rounded-full overflow-hidden">
                <img
                  src={nftDetails?.icon ?? brokenNFT}
                  className="max-w-full"
                  alt="nft"
                />
              </span>
            </div>
            <div>
              <h6 className="text-sm font-semibold">#{nftDetails?.tokenId}</h6>
              <p className="text-xs text-slate-500">{nftDetails?.name}</p>
            </div>
          </div>
        </div>

        {/* Fee and nonce */}
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
                onChange={(e) => {
                  if (!isNaN(e.target.value as any)) {
                    setNonce(e.target.value as any);
                  }
                }}
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
                onChange={(e) => {
                  if (!isNaN(e.target.value as any)) {
                    setFeelimit(e.target.value);
                  }
                }}
              />
            </div>
          </div>
        ) : (
          ""
        )} */}
        {/* End of fee and nonce */}
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
          onClick={confirmTransaction}
        >
          {loader ? <Spinner /> : "Confirm"}
        </button>
      </div>
    </div>
  ) : (
    <ApproveTransaction
      {...transaction}
      nftDetails={nftDetails}
      onSuccess={handleNFTTransferApproval}
      providerAttrib={transaction.providerAttrib}
    />
  );
};

export default TransferNFT;
