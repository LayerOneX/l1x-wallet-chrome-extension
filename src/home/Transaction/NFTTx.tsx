import { FC, useContext, useEffect, useState } from "react";
import { AppContext } from "../../Auth.guard";
import { Logger } from "@util/Logger.util";
import PriceLoader from "../../components/PriceLoader";

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
    <div className="flex items-start justify-between mb-3 bg-slate-100 rounded-lg p-4">
      <div className="flex items-center">
        <div
          className="w-8 h-8 min-w-8 rounded-full border border-XBlue flex items-center justify-center me-2"
          style={{ backgroundImage: nftDetails.icon }}
        >
          <img src={nftDetails.icon} alt="NFT" className="rounded-full" />
        </div>
        <div>
          <h4 className="text-black font-semibold text-sm">NFT Transfer</h4>
          <h6 className="text-[10px] font-medium text-green-500">Confirmed</h6>
        </div>
      </div>
      <div className=" text-right">
        {loader ? (
          <PriceLoader />
        ) : (
          <>
            <h4 className="text-black text-sm">{nftDetails.name}</h4>
            <h6 className="text-[10px] text-slate-600">
              #{nftDetails.tokenId}
            </h6>
          </>
        )}
      </div>
    </div>
  );
};

export default NFTTx;
