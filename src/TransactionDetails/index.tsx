import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FunctioncallTxDetails from "./FunctioncallTxDetails";
import NativeTokenTxDetails from "./NativeTokenTxDetails";
import EVMTxDetails from "./EVMTxDetails";
import { AppContext } from "../Auth.guard";
import { X } from "react-feather";
import Swal from "sweetalert2";
import { XCircleIconHtml } from "../components/XCircleIconHtml";
import Skeleton from "react-loading-skeleton";
import { Logger } from "@util/Logger.util";

const TransactionDetails = () => {
  const appContext = useContext(AppContext);
  const navigate = useNavigate();
  const { hash } = useParams<{ hash: string }>();
  const [receipt, setReceipt] = useState<any>();
  const [loader, setLoader] = useState(true);

  useEffect(() => {
    if (appContext?.virtualMachine) {
      let timeoutid = setTimeout(() => {
        getTransactionReceipt();
      }, 500);
      return () => {
        clearTimeout(timeoutid);
      };
    }
  }, [appContext?.virtualMachine]);

  async function getTransactionReceipt() {
    try {
      setLoader(true);
      const receipt = await appContext?.virtualMachine.getTransactionReceipt(
        hash || ""
      );
      setReceipt(receipt);
    } catch (error) {
      Logger.error(error);
      Swal.fire({
        iconHtml: XCircleIconHtml,
        title: "Failed",
        text: "Failed to fetch transaction receipt.",
        customClass: {
          icon: "no-border",
        },
      });
    } finally {
      setLoader(false);
    }
  }

  switch (true) {
    case receipt && appContext?.virtualMachine.networkType == "L1X":
      return receipt?.transaction?.tx_type == "4" ? (
        <FunctioncallTxDetails {...receipt} />
      ) : receipt?.transaction?.tx_type == "1" ? (
        <NativeTokenTxDetails {...receipt} />
      ) : (
        ""
      );

    case receipt && appContext?.virtualMachine.networkType == "EVM":
      return <EVMTxDetails {...receipt} />;

    default:
      return (
        <div className="w-[375px] h-[600px] mx-auto overflow-y-auto px-4 py-5 relative flex flex-col">
          <div className="text-lg font-semibold text-XBlue rounded-3xl flex items-center justify-between mb-5 text-center">
            Transaction Details
            <button className="ms-4" onClick={() => navigate(-1)}>
              <X className="w-5 h-5 " />
            </button>
          </div>
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
        </div>
      );
  }
};

export default TransactionDetails;
