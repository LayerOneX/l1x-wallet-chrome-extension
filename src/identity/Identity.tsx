import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useContext, useEffect, useState } from "react";
import { AppContext } from "../Auth.guard";
import { serviceGetL1xBadges } from "@util/Helper";
import { Util } from "@util/Util";
import Nodata from "../components/Nodata";
import { Logger } from "@util/Logger.util";
import Skeleton from "react-loading-skeleton";
import Swal from "sweetalert2";
import { XCircleIconHtml } from "../components/XCircleIconHtml";
import { useNavigate } from "react-router-dom";

const Identity = () => {
  const navigate = useNavigate();
  const appContext = useContext(AppContext);
  const [badges, setBadges] = useState([]);
  const [loader, setLoader] = useState(true);

  useEffect(() => {
    listBadges();
  }, []);

  async function listBadges() {
    try {
      setLoader(true);
      const badges = await serviceGetL1xBadges(
        Util.removePrefixOx(appContext?.publicKey || "")
      );
      setBadges(badges?.data);
    } catch (error) {
      Logger.error(error);
      Swal.fire({
        iconHtml: XCircleIconHtml,
        title: "Failed",
        text: "Failed to load badges.",
        customClass: {
          icon: "no-border",
        },
      });
    } finally {
      setLoader(false);
    }
  }

  return (
    <div className="w-[375px] h-[600px] mx-auto overflow-y-auto px-4 py-5 relative flex flex-col">
      <div className="text-lg font-semibold text-XBlue rounded-3xl flex items-center mb-5 text-center">
        <button className="me-4" type="button" onClick={() => navigate(-1)}>
          <ArrowLeftIcon className="w-5 h-5 " />
        </button>
        Identity
      </div>
      <div className="flex-grow-[1] overflow-y-auto">
        {!badges.length && !loader && <Nodata />}
        <div className="grid grid-cols-3 gap-4">
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
          {badges.map((item: any, index) => {
            return (
              <div
                className="relative bg-slate-100 rounded-md overflow-hidden h-[104px] flex items-center justify-center"
                key={index}
              >
                <img
                  src={item?.iconUrl}
                  className="w-full h-[104px] object-cover "
                />
                <span className="uppercase text-[10px] bg-white px-2 py-1 rounded-full text-ellipsis whitespace-nowrap overflow-hidden absolute top-[50%] left-[50%] z-10 -translate-x-[50%] -translate-y-[50%] max-w-[90px] font-semibold">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Identity;
