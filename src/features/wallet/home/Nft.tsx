import { useNavigate } from "react-router-dom";
import { AppContext } from "../../../Auth.guard";
import Nodata from "@components/Nodata";
import { useContext, useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import Swal from "sweetalert2";
import { XCircleIconHtml } from "@components/XCircleIconHtml";
import brokenNft from "@assets/images/image-broken.svg";
import NetworkFilterButton from "@features/wallet/components/NetworkFilterButton";

const Nft = () => {
  const appContext = useContext(AppContext);
  const navigate = useNavigate();
  const [nftList, setNFTList] = useState<INFT[]>([]);
  const [loader, setLoader] = useState(false);

  useEffect(() => {
    setNFTList([]);
    if (appContext?.virtualMachine) {
      fetchNFTList();
    }
  }, [appContext?.virtualMachine]);

  async function fetchNFTList() {
    try {
      setLoader(true);
      const nftList = await appContext?.virtualMachine.listNFT();
      setNFTList(nftList || []);
    } catch (error: any) {
      Swal.fire({
        iconHtml: XCircleIconHtml,
        title: "Failed",
        text: error?.errorMessage || "Failed to list NFTs. Please try again.",
        customClass: {
          icon: "no-border",
        },
      });
    } finally {
      setLoader(false);
    }
  }

  return (
    <>
      {/* Filter row */}
      <div className="flex items-center justify-between mb-3">
        <NetworkFilterButton />
        <span className="text-txt-muted text-xs">
          ({nftList.length} Tokens)
        </span>
      </div>

      {/* NFT grid */}
      <div className="grid grid-cols-3 gap-3">
        {nftList.map((nft) => (
          <div
            key={`${nft.collectionAddress}-${nft.tokenId}`}
            className="bg-dark-card border border-dark-border w-full h-[106px] rounded-2xl flex items-center justify-center overflow-hidden cursor-pointer relative"
            onClick={() => navigate(`/send-nft?tokenId=${nft.tokenId}`)}
            title={nft.name}
          >
            <img
              src={nft.icon || brokenNft}
              className="w-full h-full object-cover"
              alt={nft.name}
            />
            <span className="absolute bottom-1 left-1 bg-dark-surface/80 text-white text-[10px] px-2 py-0.5 rounded-full overflow-hidden max-w-[90px] text-ellipsis font-medium whitespace-nowrap backdrop-blur-sm">
              {nft.name}
            </span>
          </div>
        ))}

        {loader &&
          new Array(3)
            .fill(1)
            .map((_, i) => (
              <Skeleton
                key={i}
                width={100}
                height={106}
                borderRadius={12}
                baseColor="#1a1d26"
                highlightColor="#22252e"
              />
            ))}
      </div>
      {!loader && nftList.length <= 0 && <Nodata />}
    </>
  );
};

export default Nft;
