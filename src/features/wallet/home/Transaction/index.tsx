import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { AppContext } from "../../../../Auth.guard";
import Nodata from "@components/Nodata";
import Skeleton from "react-loading-skeleton";
import Swal from "sweetalert2";
import { XCircleIconHtml } from "@components/XCircleIconHtml";
import TokenTx from "./TokenTx";
import NFTTx from "./NFTTx";
import FunctioncallTx from "./FunctioncallTx";
import NativeTokenTx from "./NativeTokenTx";
import EVMDappTx from "./EVMDappTx";
import { Link } from "react-router-dom";
import NetworkFilterButton, {
  readSelectedNetwork,
  ALL_NETWORK_ID,
} from "@features/wallet/components/NetworkFilterButton";
import { pollPendingTransactions } from "@util/TxStatusPoller";
import { ExtensionStorage } from "@util/ExtensionStorage.util";

const Transaction: React.FC<{ newTxHash?: string }> = ({ newTxHash }) => {
  const appContext = useContext(AppContext);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionAmount, setTransactionAmount] = useState("");
  const [loader, setLoader] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  // Use a ref for the network ID so it's always current in async callbacks
  const networkIdRef = useRef<string>(readSelectedNetwork());
  // Resolve both L1X and EVM public keys for the current account
  async function resolveAllPublicKeys(): Promise<string[]> {
    const keys: string[] = [appContext?.publicKey || ""];
    try {
      const storage = await ExtensionStorage.get("wallets");
      if (appContext?.type === "EVM") {
        const evmAcc = storage?.EVM?.find(
          (w: any) => w.publicKey === appContext?.publicKey
        );
        if (evmAcc) {
          const l1xAcc = storage?.L1X?.find(
            (w: any) => w.privateKey?.trim() === evmAcc.privateKey?.trim()
          );
          if (l1xAcc) keys.push(l1xAcc.publicKey);
        }
      } else {
        const l1xAcc = storage?.L1X?.find(
          (w: any) => w.publicKey === appContext?.publicKey
        );
        if (l1xAcc) {
          const evmAcc = storage?.EVM?.find(
            (w: any) => w.privateKey?.trim() === l1xAcc.privateKey?.trim()
          );
          if (evmAcc) keys.push(evmAcc.publicKey);
        }
      }
    } catch {
      // Ignore — just use the single key
    }
    return keys.filter(Boolean);
  }

  // Fetch whenever VM changes (account switch, or single-network selection
  // via changeActiveNetwork). Always reads networkIdRef for current filter.
  useEffect(() => {
    if (appContext?.virtualMachine) {
      const timeoutid = setTimeout(() => {
        fetchTransactions();
      }, 500);
      return () => {
        clearTimeout(timeoutid);
        setLoader(false);
      };
    }
  }, [appContext?.virtualMachine]);

  // Poll pending transactions for status updates
  useEffect(() => {
    const hasPending = transactions.some((tx) => tx.txStatus === "pending");
    if (!hasPending) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    pollPendingTransactions().then((changed) => {
      if (changed) fetchTransactions();
    });
    pollRef.current = setInterval(async () => {
      const changed = await pollPendingTransactions();
      if (changed) fetchTransactions();
    }, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [transactions.length, transactions.filter((tx) => tx.txStatus === "pending").length]);

  const handleNetworkSelect = useCallback(
    (networkId: string) => {
      networkIdRef.current = networkId;

      if (networkId === ALL_NETWORK_ID) {
        // "All Popular" — no changeActiveNetwork fires, so fetch immediately
        fetchTransactions();
      }
      // Single network: NetworkFilterButton calls changeActiveNetwork()
      // which updates the VM → triggers the useEffect → calls fetchTransactions()
      // with the updated ref value. Do NOT fetch here — VM hasn't switched yet.
    },
    [appContext?.virtualMachine]
  );

  async function fetchTransactions() {
    try {
      setLoader(true);
      const currentNetwork = networkIdRef.current;
      let txs: Transaction[] | undefined;

      if (currentNetwork === ALL_NETWORK_ID) {
        const keys = await resolveAllPublicKeys();
        console.log("[TxDebug] ALL mode, keys:", keys);
        txs = await appContext?.virtualMachine.listAllTransactions(keys);
      } else {
        console.log("[TxDebug] Single mode, network:", currentNetwork, "rpc:", appContext?.virtualMachine?.activeNetwork?.rpc);
        txs = await appContext?.virtualMachine.listTransactions();
      }

      console.log("[TxDebug] Result:", txs?.length, "txs", txs?.slice(0, 3));
      setTransactions(txs || []);
    } catch (error: any) {
      Swal.fire({
        iconHtml: XCircleIconHtml,
        title: "Failed",
        text:
          error?.errorMessage ||
          "Failed to list transactions. Please try again.",
        customClass: {
          icon: "no-border",
        },
      });
    } finally {
      setLoader(false);
    }
  }

  // Group transactions by date
  function groupByDate(txs: Transaction[]) {
    const groups: { [key: string]: Transaction[] } = {};
    txs.forEach((tx) => {
      const date = new Date(tx.timestamp);
      const today = new Date();
      const isToday = date.toDateString() === today.toDateString();
      const key = isToday
        ? "TODAY"
        : date.toLocaleDateString("en-US", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }).toUpperCase();
      if (!groups[key]) groups[key] = [];
      groups[key].push(tx);
    });
    return groups;
  }

  const grouped = groupByDate(transactions);

  return (
    <React.Fragment>
      {/* Filter row */}
      <div className="flex items-center justify-between mb-3">
        <NetworkFilterButton onSelect={handleNetworkSelect} />
        <span className="text-txt-muted text-xs">
          ({transactions.length} Tx)
        </span>
      </div>

      {loader &&
        new Array(4)
          .fill(1)
          .map((_, i) => (
            <Skeleton
              key={i}
              height={60}
              borderRadius={12}
              className="mb-2"
              baseColor="#1a1d26"
              highlightColor="#22252e"
            />
          ))}

      {!loader && !transactions.length ? (
        <Nodata />
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([date, txs]) => (
            <div key={date}>
              <p className="text-txt-muted text-[10px] uppercase tracking-wider mb-2">
                {date}
              </p>
              <div className="space-y-2">
                {txs.map((transaction) => {
                  const content = (() => {
                    switch (transaction.type) {
                      case "transfer-native-token":
                        return <NativeTokenTx {...transaction} />;
                      case "transfer-token":
                        return (
                          <TokenTx
                            {...transaction}
                            setTxAmount={setTransactionAmount}
                          />
                        );
                      case "transfer-nft":
                        return <NFTTx {...transaction} />;
                      case "state-change-call":
                        return <FunctioncallTx {...transaction} />;
                      case "evm-dapp-transaction":
                        return <EVMDappTx {...(transaction as IEVMDappTransaction)} />;
                      default:
                        return null;
                    }
                  })();

                  if (!content) return null;

                  const href =
                    transaction.type === "transfer-token" && transactionAmount
                      ? `/transaction-details/${transaction.hash}?value=${transactionAmount}`
                      : `/transaction-details/${transaction.hash}`;

                  const isNew = newTxHash && transaction.hash === newTxHash;

                  return (
                    <Link
                      key={transaction.id}
                      to={transaction.hash ? href : "#"}
                      className={`block${isNew ? " animate-tx-highlight rounded-2xl" : ""}`}
                    >
                      {content}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </React.Fragment>
  );
};

export default Transaction;
