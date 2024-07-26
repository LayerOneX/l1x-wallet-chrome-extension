import { useNavigate } from "react-router-dom";
import { AppContext } from "../Auth.guard";
import Nodata from "../components/Nodata";
import { useContext, useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import Swal from "sweetalert2";
import { XCircleIconHtml } from "../components/XCircleIconHtml";
import brokenNft from '@assets/images/image-broken.svg';

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
      // alert(error?.errorMessage || "Failed to list nft. Please try again.");
      Swal.fire({
        iconHtml: XCircleIconHtml,
        title: "Failed",
        text: error?.errorMessage || "Failed to list nft. Please try again.",
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
      <div className="grid grid-cols-3 gap-3">
        {nftList.map((nft) => (
          <div
            className="bg-slate-100 w-full h-[106px] rounded-lg flex items-center justify-center overflow-hidden cursor-pointer relative"
            onClick={() => navigate(`/send-nft?tokenId=${nft.tokenId}`)}
            title={nft.name}
          >
            <img src={nft.icon || brokenNft} className="max-w-full" alt="nft image" />
            <span className="absolute bottom-1 left-1 bg-white text-[10px] px-2 py-1 rounded-full overflow-hidden max-w-[100px] text-ellipsis font-medium whitespace-nowrap">
              {nft.name}
            </span>
          </div>
        ))}

        {loader &&
          new Array(3)
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
      {nftList.length <= 0 && <Nodata />}
    </>
  );
};

export default Nft;
