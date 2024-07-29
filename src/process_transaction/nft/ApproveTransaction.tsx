import l1xIcon from "@assets/images/L1X_icon.png";
import { Util } from "@util/Util";
import { FC, useContext, useState } from "react";
import { AppContext } from "../../Auth.guard";
import classNames from "classnames";
import Spinner from "../../components/Spinner";
import Swal from "sweetalert2";
import { XCircleIconHtml } from "../../components/XCircleIconHtml";
import { ProviderAttrib } from "@l1x/l1x-wallet-sdk";
import brokenNFT from "@assets/images/image-broken.svg";
import { Tooltip } from "react-tooltip";
import { Copy } from "react-feather";

const ApproveTransaction: FC<
  ITransferNFT & {
    onSuccess: () => void;
    nftDetails?: INFT;
    providerAttrib?: ProviderAttrib;
  }
> = (transaction) => {
  const appContext = useContext(AppContext);
  const [loader, setLoader] = useState(false);
  const [copied, setCopied] = useState("");

  async function approveNFTTransfer() {
    try {
      setLoader(true);
      await appContext?.virtualMachine.approveNFTTransfer(
        transaction.collectionAddress,
        transaction.tokenId,
        appContext.privateKey,
        transaction.providerAttrib,
        transaction.feeLimit ? Number(transaction.feeLimit) : undefined
      );
      transaction.onSuccess();
    } catch (error: any) {
      if (transaction.source != "dapp") {
        Swal.fire({
          iconHtml: XCircleIconHtml,
          title: "Failed ",
          text:
            error?.errorMessage ||
            "Failed to approve nft transfer. Please try again.",
          customClass: {
            icon: "no-border",
          },
        });
      } else {
        Util.closeNotificationWindow(transaction.requestId || "", {
          status: "failure",
          errorMessage: error,
          data: null,
        });
      }
    } finally {
      setLoader(false);
    }
  }

  async function rejectTransaction() {
    await appContext?.virtualMachine.removePendingTransaction(transaction.id);
    if (transaction.source == "dapp") {
      Util.closeNotificationWindow(transaction.requestId || "", {
        status: "failure",
        errorMessage: "Transaction rejected by user.",
        data: null,
      });
    }
  }

  function copyReceiverAddress(data: string) {
    navigator.clipboard.writeText(data);
    setCopied(data);
  }

  return (
    <div className="w-[375px] h-[600px] mx-auto overflow-y-auto px-4 py-5 relative flex flex-col">
      <div className="flex-grow-[1]">
        <div className="w-full text-center mb-3">
          <div className="text-lg font-semibold text-XBlue rounded-3xl flex items-center justify-center mb-5 text-center">
            Approve NFT Transfer
          </div>
        </div>

        <div className="p-5 bg-XLightBlue rounded-lg mb-3">
          {transaction.site && (
            <div className="w-full text-center mb-3">
              <div className="rounded-full pe-3 ps-2 py-1 border border-slate-300 inline-flex items-center text-xs font-semibold text-slate-500">
                <span className="w-6 h-6 rounded-full me-2">
                  <img
                    src={l1xIcon}
                    className="max-w-full"
                    alt="Website logo"
                  />
                </span>
                {transaction.site}
              </div>
            </div>
          )}
          <div className="w-[106px] h-[106px] rounded-md overflow-hidden mb-3 mx-auto">
            <img
              src={transaction.nftDetails?.icon || brokenNFT}
              alt="NFT icon"
              className="w-28 mr-auto ms-auto"
            />
          </div>
          <h4 className="flex items-center  text-sm mb-2">
            <b className="font-medium me-2">Token Id: </b>
            {transaction.nftDetails?.tokenId}
          </h4>
          <h4 className="flex items-center  text-sm mb-2">
            <b className="font-medium me-2">Contract Address:</b>
            {Util.wrapPublicKey(
              transaction.nftDetails?.collectionAddress || ""
            )}
            <button
              className="ms-2"
              onClick={() =>
                copyReceiverAddress(
                  transaction.nftDetails?.collectionAddress || ""
                )
              }
              data-tooltip-id="copy-publickey-click"
            >
              <Copy className="w-4 h-4  text-slate-400" />
            </button>
            {transaction.nftDetails?.collectionAddress &&
              copied == transaction.nftDetails?.collectionAddress && (
                <Tooltip
                  className="font-normal !bg-white !text-black shadow-lg !opacity-100 border border-slate-100 !text-[12px]"
                  id="copy-publickey-click"
                  content="Copied!"
                  defaultIsOpen={true}
                  afterShow={() =>
                    setTimeout(() => {
                      setCopied("");
                    }, 1000)
                  }
                  events={["click"]}
                />
              )}
          </h4>
          <h4 className="flex items-center  text-sm mb-2">
            <b className="font-medium me-2">Receiver Address:</b>
            {Util.wrapPublicKey(transaction.to || "")}
            <button
              className="ms-2"
              onClick={() => copyReceiverAddress(transaction.to)}
              data-tooltip-id="copy-publickey-click"
            >
              <Copy className="w-4 h-4  text-slate-400" />
            </button>
            {transaction.to && copied == transaction.to && (
              <Tooltip
                className="font-normal !bg-white !text-black shadow-lg !opacity-100 border border-slate-100 !text-[12px]"
                id="copy-publickey-click"
                content="Copied!"
                defaultIsOpen={true}
                afterShow={() =>
                  setTimeout(() => {
                    setCopied("");
                  }, 1000)
                }
                events={["click"]}
              />
            )}
          </h4>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-5">
        <button
          className="flex items-center justify-center text-sm text-XOrange hover:text-white border border-XOrange hover:bg-XOrange  bg-transparent px-3 py-2 rounded-3xl w-full min-h-[40px]"
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
          onClick={approveNFTTransfer}
        >
          {loader ? <Spinner /> : "Approve"}
        </button>
      </div>
    </div>
  );
};

export default ApproveTransaction;
