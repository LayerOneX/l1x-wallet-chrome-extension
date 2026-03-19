import { Link } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import Swal from "sweetalert2";
import { XCircleIconHtml } from "@components/XCircleIconHtml";
import Skeleton from "react-loading-skeleton";
import { AppContext } from "../../../Auth.guard";
import Nodata from "@components/Nodata";
import Spinner from "@components/Spinner";
import {
  disconnectAccountToSite,
  listAccountConnectedSites,
} from "@util/Account.util";
import PageHeader from "@ui/PageHeader";

const ConnectedSites = () => {
  const appContext = useContext(AppContext);
  const [connectedSites, setConnectedSites] = useState<IConnectedSite[]>([]);
  const [loader, setLoader] = useState(false);
  const [disconnectSiteLoader, setDisconnectSiteLoader] = useState<string>("");
  function getHost(url: string) {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  }

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
        customClass: { icon: "no-border" },
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
        customClass: { icon: "no-border" },
      });
    } finally {
      setLoader(false);
    }
  }

  return (
    <div className="app-frame mx-auto bg-dark-bg flex flex-col">
      <PageHeader title="Connected Websites" />

      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {connectedSites.length > 0 && (
          <div className="space-y-2">
            {connectedSites.map((site) => (
              <div
                key={site.url}
                className="flex items-center justify-between bg-dark-card border border-dark-border rounded-2xl p-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 min-w-8 rounded-full overflow-hidden bg-dark-surface">
                    <img
                      src={site.favIcon}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <Link
                      to={site.url}
                      className="text-sm text-white font-medium overflow-hidden text-ellipsis whitespace-nowrap max-w-[190px] block"
                      target="_blank"
                      title={site.url}
                    >
                      {getHost(site.url)}
                    </Link>
                    <span className="text-[11px] text-txt-muted overflow-hidden text-ellipsis whitespace-nowrap max-w-[190px] block">
                      {site.url}
                    </span>
                  </div>
                </div>
                <button
                  className="text-xs text-txt-secondary font-medium flex-shrink-0 ml-2 bg-dark-surface border border-dark-border rounded-full px-3 py-1"
                  onClick={() => confirmDisconnect(site.url)}
                >
                  {disconnectSiteLoader == site.url ? (
                    <Spinner />
                  ) : (
                    "Disconnect"
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {loader &&
          new Array(5).fill(1).map((_, i) => (
            <Skeleton
              key={i}
              height={52}
              borderRadius={12}
              className="mb-2"
              baseColor="#1a1d26"
              highlightColor="#22252e"
            />
          ))}

        {!loader && !connectedSites.length && <Nodata />}
      </div>
    </div>
  );
};

export default ConnectedSites;
