import { X } from "react-feather";
import { Link, useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import Swal from "sweetalert2";
import { XCircleIconHtml } from "../components/XCircleIconHtml";
import Skeleton from "react-loading-skeleton";
import { AppContext } from "../Auth.guard";
import Nodata from "../components/Nodata";
import Spinner from "../components/Spinner";
import {
  disconnectAccountToSite,
  listAccountConnectedSites,
} from "@util/Account.util";

const ConnectedSites = () => {
  const appContext = useContext(AppContext);
  const navigate = useNavigate();
  const [connectedSites, setConnectedSites] = useState<IConnectedSite[]>([]);
  const [loader, setLoader] = useState(false);
  const [disconnectSiteLoader, setDisconnectSiteLoader] = useState<string>(""); // url of site

  useEffect(() => {
    listConnectedSites();
  }, []);

  function confirmDisconnect(url: string) {
    Swal.fire({
      title: `Do you want to disconnect`,
      text: url,
      showDenyButton: true,
      confirmButtonText: "Disconnect",
      denyButtonText: `Cancel`,
      customClass: {
        popup: "disconnect-site",
        confirmButton: "confirm-btn",
        cancelButton: "cancel-btn",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        disconnectSite(url);
      }
    });
  }

  async function disconnectSite(url: string) {
    try {
      setDisconnectSiteLoader(url);
      await disconnectAccountToSite(url, appContext?.publicKey || "");
      listConnectedSites();
    } catch (error: any) {
      Swal.fire({
        iconHtml: XCircleIconHtml,
        title: "Failed",
        text:
          error?.errorMessage || "Failed to disconnect site. Please try again.",
        customClass: {
          icon: "no-border",
        },
      });
    } finally {
      setDisconnectSiteLoader("");
    }
  }

  async function listConnectedSites() {
    try {
      setLoader(true);
      const sites = await listAccountConnectedSites(
        appContext?.publicKey || ""
      );
      setConnectedSites(sites);
    } catch (error: any) {
      Swal.fire({
        iconHtml: XCircleIconHtml,
        title: "Failed",
        text: error?.errorMessage || "Failed to list sites. Please try again.",
        customClass: {
          icon: "no-border",
        },
      });
    } finally {
      setLoader(false);
    }
  }

  return (
    <div className="w-[375px] h-[600px] mx-auto overflow-y-auto ps-4 py-5 relative flex flex-col">
      <div className="text-lg font-semibold text-XBlue rounded-3xl flex items-center justify-between mb-5 text-center pe-4">
        Connected Websites
        <button
          className="w-7 h-7 flex items-center justify-center bg-slate-100 rounded-full"
          onClick={() => navigate(-1)}
        >
          <X className="w-5 h-5 " />{" "}
        </button>
      </div>
      {/* <div className="pe-4">
        <p className="text-sm mb-5 ">
          <b>{appContext?.accountName}</b> is connected to these sites. They can
          view your account address.
        </p>
      </div> */}

      {connectedSites.length > 0 && (
        <div className="w-[100%] h-[450px] overflow-y-auto pe-4">
          {connectedSites.map((site) => (
            <div className="flex items-center justify-between mb-3 gap-2">
              <div className="flex items-center">
                <div className="w-6 h-6 min-w-6 rounded-full overflow-hidden me-2">
                  <img src={site.favIcon} alt="" className="w-full" />
                </div>
                <Link
                  to={site.url}
                  className="text-xs text-XDarkBlue font-semibold overflow-hidden text-ellipsis inline-block max-w-48 text-nowrap"
                  target="_blank"
                  title={site.url}
                >
                  {site.url}
                </Link>
              </div>
              <button
                className="text-xs text-blue-500 "
                onClick={() => confirmDisconnect(site.url)}
              >
                {disconnectSiteLoader == site.url ? (
                  <Spinner />
                ) : (
                  "Disconnected"
                )}
              </button>
            </div>
          ))}
        </div>
      )}

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

      {!connectedSites.length && <Nodata />}
    </div>
  );
};

export default ConnectedSites;
