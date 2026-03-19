import { FC, useContext, useEffect, useState } from "react";
import { AppContext } from "../../../../Auth.guard";
import { Logger } from "@util/Logger.util";
import PriceLoader from "@components/PriceLoader";
import NetworkBadge from "./NetworkBadge";
import TxStatus from "./TxStatus";

const NFTTx: FC<ITransferNFT> = (transaction) => {
  const appContext = useContext(AppContext);
  const [nftDetails, setNFTDetails] = useState<INFT>({} as any);
  const [loader, setLoader] = useState(true);

  useEffect(() => {
    listNFTDetails();
  }, []);

  async function listNFTDetails() {
    try {
      const nftDetails = await appContext?.virtualMachine.getNFTDetails(
        transaction.collectionAddress,
        transaction.tokenId
      );
      setNFTDetails(nftDetails || ({} as any));
    } catch (error) {
      Logger.error(error);
    } finally {
      setLoader(false);
    }
  }

  return (
    <div className="flex items-start justify-between bg-dark-card border border-dark-border rounded-2xl p-3">
      <div className="flex items-center">
        <div className="relative me-2">
          <div
            className="w-8 h-8 min-w-8 rounded-full border border-dark-border bg-dark-surface flex items-center justify-center overflow-hidden"
          >
            <img src={nftDetails.icon} alt="NFT" className="rounded-full w-full h-full object-cover" />
          </div>
          <NetworkBadge chainId={transaction.chainId} />
        </div>
        <div>
          <h4 className="text-white font-semibold text-sm">NFT Transfer</h4>
          <TxStatus status={transaction.txStatus} />
        </div>
      </div>
      <div className="text-right">
        {loader ? (
          <PriceLoader />
        ) : (
          <>
            <h4 className="text-white text-sm">{nftDetails.name}</h4>
            <h6 className="text-[10px] text-txt-muted">
              #{nftDetails.tokenId}
            </h6>
          </>
        )}
      </div>
    </div>
  );
};

export default NFTTx;
