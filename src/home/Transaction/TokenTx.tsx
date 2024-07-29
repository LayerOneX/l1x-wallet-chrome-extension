import { ArrowUpRightIcon } from "@heroicons/react/16/solid";
import { FC, useContext, useEffect, useState } from "react";
import { AppContext } from "../../Auth.guard";
import { Logger } from "@util/Logger.util";
import PriceLoader from "../../components/PriceLoader";

const TokenTx: FC<ITransferToken & { setTxAmount: (value: string) => void }> = (
  transaction
) => {
  const appContext = useContext(AppContext);
  const [tokenDetails, setTokenDetails] = useState<IToken>({} as any);
  const [loader, setLoader] = useState(true);
  const transactionAmount = tokenDetails
    ? +transaction.amount / 10 ** tokenDetails.decimals
    : 0;
  // const usdAmount = tokenDetails.usdRate * (transactionAmount || 0);

  useEffect(() => {
    listTokenDetails();
  }, []);

  useEffect(() => {
    if (transactionAmount && tokenDetails.symbol) {
      transaction.setTxAmount(`${transactionAmount} ${tokenDetails.symbol}`);
    }
  }, [transactionAmount]);

  async function listTokenDetails() {
    try {
      const tokenDetails = await appContext?.virtualMachine.getTokenDetails(
        transaction.tokenAddress
      );
      setTokenDetails(tokenDetails || ({} as any));
    } catch (error) {
      Logger.error(error);
    } finally {
      setLoader(false);
    }
  }

  return (
    <div className="flex items-center align-middle justify-between mb-3 bg-slate-100 rounded-lg p-4">
      <div className="flex items-center">
        <div className="w-8 h-8 min-w-8 rounded-full border border-XBlue flex items-center justify-center me-2">
          <ArrowUpRightIcon className="w-4 h-4 text-XBlue" />
        </div>
        <div>
          <h4 className="text-black font-semibold text-sm">Token Transfer</h4>
          <h6 className="text-[10px] font-medium text-green-500">Confirmed</h6>
        </div>
      </div>
      <div className=" text-right">
        {loader ? (
          <PriceLoader />
        ) : (
          <h4 className="text-black text-sm">
            {transactionAmount || 0}&nbsp;
            {tokenDetails.symbol}
          </h4>
        )}
        {/* <h6 className="text-[10px] text-slate-600">
          ${isNaN(usdAmount) ? 0 : usdAmount}
        </h6> */}
      </div>
    </div>
  );
};

export default TokenTx;
