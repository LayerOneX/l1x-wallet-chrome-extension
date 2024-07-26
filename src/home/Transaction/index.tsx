import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../../Auth.guard";
import Nodata from "../../components/Nodata";
import Skeleton from "react-loading-skeleton";
import Swal from "sweetalert2";
import { XCircleIconHtml } from "../../components/XCircleIconHtml";
import TokenTx from "./TokenTx";
import NFTTx from "./NFTTx";
import FunctioncallTx from "./FunctioncallTx";
import NativeTokenTx from "./NativeTokenTx";
import { Link } from "react-router-dom";

const Transaction = () => {
  const appContext = useContext(AppContext);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionAmount, setTransactionAmount] = useState("");
  const [loader, setLoader] = useState(true);

  useEffect(() => {
    if (appContext?.virtualMachine) {
      let timeoutid = setTimeout(() => {
        listTransaction();
      }, 500);
      return () => {
        clearTimeout(timeoutid);
        setLoader(false);
      };
    }
  }, [appContext?.virtualMachine]);

  async function listTransaction() {
    try {
      setLoader(true);
      const transactions = await appContext?.virtualMachine.listTransactions();
      setTransactions(transactions || []);
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

  return (
    <React.Fragment>
      {loader &&
        new Array(7)
          .fill(1)
          .map(() => (
            <Skeleton
              height={57}
              borderRadius={8}
              className="mb-2"
              baseColor="#f1f5f9"
              highlightColor="#ffffff"
            />
          ))}
      <div className="w-full">
        {!transactions.length ? (
          <Nodata />
        ) : (
          <div className="w-[calc(100%+32px)] -mx-4 overflow-y-auto">
            <div className="ms-4 me-3 ">
              {transactions.map((transaction) => {
                switch (true) {
                  case transaction.type == "transfer-native-token":
                    return (
                      <Link to={`/transaction-details/${transaction.hash}`}>
                        <NativeTokenTx {...transaction} />
                      </Link>
                    );
                  case transaction.type == "transfer-token":
                    return (
                      <Link
                        to={transactionAmount ? `/transaction-details/${transaction.hash}?value=${transactionAmount}` : '#'}
                      >
                        <TokenTx
                          {...transaction}
                          setTxAmount={setTransactionAmount}
                        />
                      </Link>
                    );
                  case transaction.type == "transfer-nft":
                    return (
                      <Link to={`/transaction-details/${transaction.hash}`}>
                        <NFTTx {...transaction} />
                      </Link>
                    );
                  case transaction.type == "state-change-call":
                    return (
                      <Link to={`/transaction-details/${transaction.hash}`}>
                        <FunctioncallTx {...transaction} />
                      </Link>
                    );
                  default:
                    return "";
                }
              })}
            </div>
          </div>
        )}
      </div>
    </React.Fragment>
  );
};

export default Transaction;
