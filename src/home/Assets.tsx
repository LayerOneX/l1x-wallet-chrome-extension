import React, { useContext, useEffect, useState } from "react";
import { PlusCircle } from "react-feather";
import l1xIcon from "./../assets/images/L1X_icon.png";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../Auth.guard";
import Skeleton from "react-loading-skeleton";
import Swal from "sweetalert2";
import { XCircleIconHtml } from "../components/XCircleIconHtml";

const Assets = () => {
  const navigate = useNavigate();
  const appContext = useContext(AppContext);
  const [assetList, setAssetList] = useState<IToken[]>([]);
  const [loader, setLoader] = useState(true);

  useEffect(() => {
    setAssetList([]);
    if (appContext?.virtualMachine) {
      let timeoutid = setTimeout(() => {
        fetchAssetsList();
      }, 500);
      return () => clearTimeout(timeoutid);
    }
  }, [appContext?.virtualMachine]);

  async function fetchAssetsList() {
    try {
      setLoader(true);
      const tokenList = await appContext?.virtualMachine.listToken();
      setAssetList(tokenList || []);
    } catch (error: any) {
      Swal.fire({
        iconHtml: XCircleIconHtml,
        title: "Failed",
        text:
          error?.errorMessage || "Failed to laod asset list. Please try again.",
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
      <div className="w-full">
        <div className="grid grid-cols-3 gap-3 items-start">
          <div
            className="bg-slate-100 w-full h-[106px] rounded-lg p-2 flex items-center justify-center cursor-pointer"
            onClick={() => navigate("/import-token")}
          >
            <div className="text-center">
              <PlusCircle className="w-6 h-6 text-slate-400 mx-auto stroke-1" />
              <span className="text-[10px] text-slate-400">Import Token</span>
            </div>
          </div>

          {assetList.map((token) => (
            <div
              className="bg-slate-100 w-full h-[106px] rounded-lg p-3 flex flex-col justify-between cursor-pointer"
              onClick={() => navigate(`/send-token?symbol=${token.symbol}`)}
            >
              <h4 className="flex items-center text-sm mb-2">
                <span className="w-5 h-5 inline-block me-1">
                  <img src={token.icon || l1xIcon} className="max-w-full" />
                </span>
                {token.symbol}
              </h4>
              <div>
                {" "}
                <h3
                  className="font-semibold text-md mt-2 text-ellipsis whitespace-nowrap overflow-hidden"
                  title={(+token.balance.toFixed(4)).toLocaleString()}
                >
                  {(+token.balance.toFixed(4)).toLocaleString()}
                </h3>
                <h6
                  className="font text-xs text-ellipsis whitespace-nowrap overflow-hidden"
                  title={`$${(+(token.balance * token.usdRate).toFixed(
                    4
                  )).toLocaleString()}`}
                >
                  $
                  {(+(token.balance * token.usdRate).toFixed(
                    4
                  )).toLocaleString()}
                </h6>
              </div>
            </div>
          ))}

          {loader &&
            new Array(2)
              .fill(1)
              .map(() => (
                <Skeleton
                  width={106}
                  height={106}
                  borderRadius={8}
                  baseColor="#f1f5f9"
                  highlightColor="#ffffff"
                />
              ))}
        </div>
      </div>
    </React.Fragment>
  );
};

export default Assets;
