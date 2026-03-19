import { useContext, useEffect, useState } from "react";
import {  useParams } from "react-router-dom";
import FunctioncallTxDetails from "./FunctioncallTxDetails";
import NativeTokenTxDetails from "./NativeTokenTxDetails";
import EVMTxDetails from "./EVMTxDetails";
import { AppContext } from "../Auth.guard";
// import { X } from "react-feather";
import Swal from "sweetalert2";
import { XCircleIconHtml } from "../components/XCircleIconHtml";
import Skeleton from "react-loading-skeleton";
import { Logger } from "@util/Logger.util";
import { Config } from "@util/Config.util";
import VirtualMachineFactory from "@factory/VirtualMachine.factory";

const TransactionDetails = () => {
  const appContext = useContext(AppContext);
  // const navigate = useNavigate();
  const { hash } = useParams<{ hash: string }>();
  const [receipt, setReceipt] = useState<any>();
  const [loader, setLoader] = useState(true);
  const [isL1XTx, setIsL1XTx] = useState(false);

  useEffect(() => {
    if (!appContext || !hash || !receipt) return;
  }, [appContext, hash, receipt]);

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
      const activeNetworkChainId = appContext?.virtualMachine?.activeNetwork?.chainId;
      if (activeNetworkChainId === Config.chainId.l1x) {
        try {
          const L1XVm = VirtualMachineFactory.createVirtualMachine("L1X", "");
          const receipt = await L1XVm.getTransactionReceipt(hash || "");
          setReceipt(receipt);
          setIsL1XTx(true);
          return;
        } catch (l1xError) {
          Logger.error(l1xError);
        }
      }
      Logger.error(error);
      Swal.fire({
        iconHtml: XCircleIconHtml,
        title: "Failed",
        text: "Failed to fetch transaction receipt. Check your network connection.",
        customClass: {
          icon: "no-border",
        },
      });
    } finally {
      setLoader(false);
    }
  }

  switch (true) {
    case receipt && appContext?.virtualMachine.networkType == "L1X" || isL1XTx:
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
        <div className="app-frame mx-auto overflow-y-auto px-4 py-5 relative flex flex-col bg-dark-bg">
          {/* <div className="text-lg font-semibold text-white rounded-3xl flex items-center justify-between mb-5 text-center">
            Transaction Details
            <button className="ms-4" onClick={() => navigate(-1)}>
              <X className="w-5 h-5 text-txt-muted hover:text-white" />
            </button>
          </div> */}
          {loader &&
            new Array(8)
              .fill(1)
              .map((_, index) => (
                <Skeleton
                  key={index}
                  height={57}
                  borderRadius={14}
                  className="mb-2"
                  baseColor="#1a1e27"
                  highlightColor="#232936"
                />
              ))}
        </div>
      );
  }
};

export default TransactionDetails;
