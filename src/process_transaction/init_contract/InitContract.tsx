import { FC, useEffect, useState } from "react";
import classNames from "classnames";
import { ArrowRight, Copy, Info } from "react-feather";
import { Util } from "@util/Util";
import Spinner from "../../components/Spinner";
import { L1XProvider, ProviderAttrib } from "@l1x/l1x-wallet-sdk";

const InitContract: FC<
  IInitContract & {
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
  const [feelimit] = useState(transaction.feeLimit);
  // const requestOrigin = (() => {
  //   try {
  //     return new URL(transaction.rpc).origin;
  //   } catch {
  //     return "-";
  //   }
  // })();
  // const [nonce, setNonce] = useState<string>();

  useEffect(() => {
    // getTransactionConfig();
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

  // async function getTransactionConfig() {
  //   const nonce = await transaction.virtualMachine.getCurrentNonce(
  //     transaction.providerAttrib
  //   );
  //   setNonce(transaction.nonce ?? nonce ?? undefined);
  // }

  function copyReceiverAddress() {
    navigator.clipboard.writeText(transaction.baseContractAddress ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  }

  async function validateTransaction(hash: string) {
    try {
      await new Promise((resolve) => {
        setTimeout(resolve, 5000);
      });
      const receipt = await l1xProvider.core.getTransactionReceipt({ hash });
      return (
        typeof receipt.status != "undefined" &&
        !isNaN(receipt.status as any) &&
        +receipt.status == 0
      );
    } catch {
      // RPC failure during validation — treat as unconfirmed rather than crashing
      return false;
    }
  }

  async function sendTransaction() {
    try {
      setLoader(true);
      if (!transaction.account) {
        throw new Error("Invalid account details.");
      }
      // initialize contract
      const response = await l1xProvider.vm.init({
        attrib: {
          base_contract_address: Util.removePrefixOx(
            transaction.baseContractAddress
          ),
          arguments: transaction.arguments,
        },
        private_key: Util.removePrefixOx(transaction.account.privateKey),
        fee_limit: feelimit as any,
        // nonce: nonce && !isNaN(nonce as any) ? +nonce : undefined,
      });
      // validate transaction
      if (!(await validateTransaction(response.hash))) {
        throw new Error("Failed to process transaction. Please try again.");
      }
      // add transaction
      const newTransaction: IInitContract = {
        ...transaction,
        hash: response.hash,
      };
      await transaction?.virtualMachine.addTransaction(
        newTransaction,
        l1xProvider.options.endpoint
      );
      Util.closeNotificationWindow(transaction.requestId ?? "", {
        status: "success",
        errorMessage: "",
        data: {
          contractAddress: response.contract_address,
          hash: newTransaction.hash,
        },
      });
    } catch (error: any) {
      await transaction?.virtualMachine.removePendingTransaction(
        transaction.id
      );
      Util.closeNotificationWindow(transaction.requestId ?? "", {
        status: "failure",
        errorMessage: error?.message ?? "Failed to process transaction.",
        data: null,
      });
    } finally {
      setLoader(false);
    }
  }

  function rejectTransaction() {
    transaction?.virtualMachine.removePendingTransaction(transaction.id);
    Util.closeNotificationWindow(transaction.requestId ?? "", {
      status: "failure",
      errorMessage: "Transaction rejected by user.",
      data: {
        hash: transaction.hash,
      },
    });
  }

  return (
    <div className="app-frame mx-auto overflow-y-auto px-4 py-5 relative flex flex-col bg-dark-bg">
      <div className="flex-grow-[1]">
        {/* <div className="mb-4 rounded-full border border-dark-border bg-dark-card px-3 py-1.5 text-[11px] text-txt-secondary text-center">
          Contract Init Request on <span className="text-white">{requestOrigin}</span>
        </div> */}

        <div className="app-card rounded-2xl p-4 mb-3 relative">
          <div className="grid grid-cols-2 items-center gap-2">
            <div className="flex items-center justify-start">
              <span className="w-8 h-8 overflow-hidden rounded-full me-2 bg-dark-surface border border-dark-border">
                <img
                  src={transaction.account.icon}
                  className="max-w-full object-cover h-8"
                />
              </span>
              <h4 className="text-[12px] font-semibold text-white text-ellipsis overflow-hidden whitespace-nowrap">
                {transaction.account.accountName}
              </h4>
            </div>
            <div className="flex items-center justify-end">
              <h4 className="text-[12px] font-semibold text-white flex items-center">
                {Util.wrapPublicKey(transaction?.baseContractAddress)}
                <button className="ms-2" onClick={() => copyReceiverAddress()}>
                  <Copy
                    className={`w-4 h-4 ${copied ? "text-accent-green" : "text-txt-muted"}`}
                  />
                </button>
              </h4>
            </div>
          </div>
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white bg-dark-surface border border-dark-border w-7 h-7 inline-flex items-center justify-center rounded-full">
            <ArrowRight className="w-4 h-4" />
          </span>
        </div>

        <div className="app-card rounded-2xl px-4 py-3 mb-3">
          <h4 className="flex items-center text-sm mb-2 text-txt-secondary">
            <b className="font-medium me-2 text-white">Base Contract:</b>
            {Util.wrapPublicKey(transaction.baseContractAddress)}
          </h4>
          <h4 className="flex items-center text-sm text-txt-secondary">
            <b className="font-medium me-2 text-white">Transaction Type:</b>
            Initialize Smart Contract
          </h4>
        </div>

        <div className="app-card rounded-2xl px-4 py-3 mb-2">
          <h2 className="font-semibold text-sm mb-2 flex items-center text-white">
            Estimated Changes
            <Info className="w-4 h-4 text-txt-muted ms-1" />
          </h2>
          <h4 className="font-medium text-xs mb-2 text-txt-secondary">
            No balance or asset changes predicted for your wallet.
          </h4>
          <p className="text-[11px] text-txt-muted">
            This action initializes a smart contract from the provided base contract.
          </p>
        </div>

        {/* Fee and nonce */}
        {/* {feelimit || nonce ? (
          <div className="app-card rounded-2xl p-4">
            ...
          </div>
        ) : (
          ""
        )} */}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-5">
        <button
          className="btn-tertiary h-12 text-sm"
          type="button"
          onClick={rejectTransaction}
          disabled={loader}
        >
          Reject
        </button>
        <button
          className={classNames(
            loader ? "btn-primary opacity-70 cursor-not-allowed" : "btn-primary",
            "h-12 text-sm flex items-center justify-center gap-2"
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

export default InitContract;
