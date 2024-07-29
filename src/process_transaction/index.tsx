import { useEffect, useState } from "react";
import { ExtensionStorage } from "@util/ExtensionStorage.util";
import Swal from "sweetalert2";
import { XCircleIconHtml } from "../components/XCircleIconHtml";
import TransferNFT from "./nft/TransferNFT";
import StateChangeTransaction from "./state_change_transaction/StateChangeTransaction";
import TransferNativeToken from "./transfer_native_token/TransferNativeToken";
import TransferToken from "./transfer_token/TransferToken";
import { useNavigate } from "react-router-dom";
import { ProviderAttrib } from "@l1x/l1x-wallet-sdk";
import ChangeNetworkRequest from "../change_network_request/ChangeNetworkRequest";
import { getAccount } from "@util/Account.util";
import VirtualMachineFactory from "@factory/VirtualMachine.factory";
import { Util } from "@util/Util";
import InitContract from "./init_contract/InitContract";
import warningImg from "@assets/images/warning.png";
import { removeTransactionRequest } from "@util/Transaction.util";

const ProcessTransaction = () => {
  const [virtualMachine, setVirtualMachine] = useState<IVirtualMachine | null>(
    null
  );
  const [account, setAccount] = useState<IXWalletAccount | null>(null);
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState<Transaction>();
  const [providerAttrib, setProviderAttrib] = useState<ProviderAttrib>();

  useEffect(() => {
    listTransactions();
  }, []);

  useEffect(() => {
    if (transaction) {
      getProvider();
      getAccountDetails(transaction.from);
    }
  }, [transaction]);

  function handleTransactionSuccess() {
    navigate("/home#Transactions");
  }

  async function getAccountDetails(publicKey: string) {
    if (!transaction) {
      return;
    }
    const account = await getAccount(publicKey);
    if (
      account &&
      (transaction?.source == "extension" || account.type == "L1X")
    ) {
      const virtualMachine = VirtualMachineFactory.createVirtualMachine(
        account.type,
        account.publicKey,
        transaction?.chainId
      );
      if (virtualMachine.activeNetwork.rpc != transaction.rpc) {
        virtualMachine.activeNetwork.rpc = transaction.rpc;
      }
      setAccount(account);
      setVirtualMachine(virtualMachine);
    } else if (transaction?.source == "dapp") {
      removeTransactionRequest(transaction.requestId ?? "");
      Util.closeNotificationWindow(transaction?.requestId ?? "", {
        status: "failure",
        errorMessage: "Invalid account type. Only l1x accounts are supported.",
        data: null,
      });
    }
  }

  async function listTransactions() {
    try {
      const pendingTransactions =
        (await ExtensionStorage.get("pendingTransactions")) ?? [];
      if (pendingTransactions.length) {
        setTransaction(pendingTransactions[0]);
      } else {
        window.close();
      }
    } catch (error: any) {
      Swal.fire({
        iconHtml: XCircleIconHtml,
        title: "Failed",
        text: error.errorMessage ?? "Failed to verify login.",
        customClass: {
          icon: "no-border",
        },
      });
    }
  }

  async function getProvider() {
    if (transaction?.source == "dapp") {
      const connectedSite =
        (await ExtensionStorage.get("connectedSites")) ?? [];
      const site = connectedSite.find(
        (el) => el.url && el.url == transaction.site
      );
      if (site) {
        setProviderAttrib({
          clusterType: site.l1xProviderConfig.clusterType as any,
          endpoint: site.l1xProviderConfig.endpoint,
        });
      }
    }
  }

  async function removeAllTransactions() {
    ExtensionStorage.set("pendingTransactions", []);
    if (transaction && transaction.source == "dapp") {
      Util.closeNotificationWindow(transaction.requestId ?? "", {
        status: "failure",
        errorMessage: "Transaction rejected by user.",
        data: null,
      });
    }
  }

  return transaction?.source == "dapp" && account?.type != "L1X" ? (
    <ChangeNetworkRequest requestId={transaction.requestId} />
  ) : !account || !virtualMachine ? (
    <div className="w-[375px] h-[600px] mx-auto overflow-y-auto px-4 py-5 relative flex flex-col justify-center align-middle items-center">
      <img src={warningImg} alt="img" />
      <div>Something went wrong!</div>
      <button
        className="flex items-center mt-3 justify-center text-sm text-XOrange hover:text-white border border-XOrange hover:bg-XOrange  bg-transparent px-3 py-2 rounded-3xl min-w-32 min-h-[40px]"
        onClick={removeAllTransactions}
      >
        Close
      </button>
    </div>
  ) : transaction?.type == "transfer-native-token" ? (
    <TransferNativeToken
      {...transaction}
      account={account}
      virtualMachine={virtualMachine}
      onSuccess={handleTransactionSuccess}
      providerAttrib={providerAttrib}
    />
  ) : transaction?.type == "transfer-token" ? (
    <TransferToken
      {...transaction}
      account={account}
      virtualMachine={virtualMachine}
      onSuccess={handleTransactionSuccess}
      providerAttrib={providerAttrib}
    />
  ) : transaction?.type == "transfer-nft" ? (
    <TransferNFT
      {...transaction}
      account={account}
      virtualMachine={virtualMachine}
      onSuccess={handleTransactionSuccess}
      providerAttrib={providerAttrib}
    />
  ) : transaction?.type == "state-change-call" ? (
    <StateChangeTransaction
      {...transaction}
      account={account}
      virtualMachine={virtualMachine}
      onSuccess={handleTransactionSuccess}
      providerAttrib={providerAttrib}
    />
  ) : transaction?.type == "init-contract" ? (
    <InitContract
      {...transaction}
      account={account}
      virtualMachine={virtualMachine}
      onSuccess={handleTransactionSuccess}
      providerAttrib={providerAttrib}
    />
  ) : (
    <div>Invalid Transactino Type</div>
  );
};

export default ProcessTransaction;
