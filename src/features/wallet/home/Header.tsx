import { ChevronDown, Copy, Globe, X } from "react-feather";
import { FC, useContext, useEffect, useState } from "react";
import { AppContext } from "../../../Auth.guard";
import { useNavigate } from "react-router-dom";
import { Tooltip } from "react-tooltip";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import {
  disconnectAccountToSite,
  getAccount,
  listConnectedAccounts,
} from "@util/Account.util";
import classNames from "classnames";
import { Util } from "@util/Util";

const Header: FC<{ balance: number }> = () => {
  const [activeTab, setActiveTab] = useState<chrome.tabs.Tab | null>(null);
  const [connectedAccounts, setConnectedAccounts] = useState<IXWalletAccount[]>(
    []
  );
  const navigate = useNavigate();
  const appContext = useContext(AppContext);
  const [copied, setCopied] = useState("");
  const [showConnectedAccounts, setShowConnectedAccounts] = useState(false);
  const site = activeTab?.url ? new URL(activeTab?.url).origin : "";

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      let currentTab = tabs[0];
      setActiveTab(currentTab);
    });
  }, []);

  useEffect(() => {
    fetchConnectedAccounts();
  }, [site]);

  function copyPublickey(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(text);
  }

  async function fetchConnectedAccounts() {
    if (site) {
      const addresslist = await listConnectedAccounts(site);
      if (addresslist && addresslist.length > 0) {
        const accounts: IXWalletAccount[] = [];
        await Promise.all(
          addresslist.map(async (address) => {
            const account = await getAccount(address);
            if (account) {
              accounts.push(account);
            }
          })
        );
        setConnectedAccounts([...accounts]);
      } else {
        setConnectedAccounts([]);
      }
    }
  }

  return (
    <>
      {/* Top bar: site icon left, account pill right */}
      <div className="flex items-center justify-between w-full mb-3">
        <button
          className="relative w-9 h-9 flex items-center justify-center"
          onClick={() => setShowConnectedAccounts(true)}
        >
          {activeTab?.favIconUrl ? (
            <img
              src={activeTab?.favIconUrl}
              className="w-6 h-6 rounded"
              alt="site"
            />
          ) : (
            <Globe className="text-txt-muted" size={20} />
          )}
          <div
            className={classNames(
              connectedAccounts.length ? "bg-accent-green" : "bg-txt-muted",
              "absolute w-2.5 h-2.5 border-2 border-dark-bg rounded-full -right-0.5 -bottom-0.5"
            )}
          />
        </button>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              if (appContext?.publicKey) {
                copyPublickey(appContext.publicKey);
              }
            }}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-dark-card border border-dark-border hover:border-XOrange/30 transition-colors"
            data-tooltip-id="copy-header-address"
          >
            {copied === appContext?.publicKey ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <Copy size={12} className="text-txt-muted" />
            )}
          </button>
          {copied === appContext?.publicKey && (
            <Tooltip
              className="font-normal !bg-dark-surface !text-white shadow-lg !opacity-100 border border-dark-border !text-[12px]"
              id="copy-header-address"
              content="Copied!"
              defaultIsOpen={true}
              events={["click"]}
            />
          )}
          <button
            onClick={() => navigate("/wallet-list")}
            className="flex items-center gap-2 bg-dark-card border border-dark-border rounded-full px-3 py-1.5"
          >
            <span className="text-white text-[11px] font-medium">
              {appContext?.publicKey
                ? `${appContext.publicKey.slice(0, 4)}...${appContext.publicKey.slice(-4)}`
                : "0x00...0000"}
            </span>
            <ChevronDown size={12} className="text-txt-secondary" />
          </button>
        </div>
      </div>

      {/* Connected accounts modal */}
      {showConnectedAccounts && (
        <>
          <div className="justify-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
            <div className="relative w-full py-6 mx-auto max-w-[96%] md:max-w-md">
              <div className="rounded-2xl relative flex flex-col w-full bg-dark-card border border-dark-border outline-none focus:outline-none px-5 py-4 md:py-8">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="text-lg font-semibold text-white truncate"
                    title={activeTab?.title}
                  >
                    {activeTab?.title}
                  </div>
                  <button
                    className="text-txt-secondary hover:text-white"
                    onClick={() => setShowConnectedAccounts(false)}
                  >
                    <X size={20} />
                  </button>
                </div>
                {!connectedAccounts.length && (
                  <p className="mb-6 text-txt-secondary text-sm">
                    X Wallet is not connected to this site. To connect to a web3
                    site, find and click the connect button.
                  </p>
                )}

                {connectedAccounts.map((account) => (
                  <div
                    key={account.publicKey}
                    className="bg-dark-surface flex items-center justify-between p-3 rounded-xl w-full mb-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-dark-border overflow-hidden">
                        <img
                          src={account.icon}
                          alt="avatar"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-white leading-tight">
                          {account.accountName}
                        </h4>
                        <p className="text-xs text-txt-muted flex items-center">
                          {Util.wrapPublicKey(account.publicKey)}
                          <button
                            className="cursor-pointer"
                            data-tooltip-id="copy-publickey-click"
                            onClick={() =>
                              copyPublickey(account?.publicKey || "")
                            }
                          >
                            <Copy className="w-3 h-3 ms-1.5 text-XOrange" />
                          </button>
                          {copied === account?.publicKey && (
                            <Tooltip
                              className="font-normal !bg-dark-surface !text-white shadow-lg !opacity-100 border border-dark-border !text-[12px]"
                              id="copy-publickey-click"
                              content="Copied!"
                              defaultIsOpen={true}
                              afterShow={() =>
                                setTimeout(() => setCopied(""), 1000)
                              }
                              events={["click"]}
                            />
                          )}
                        </p>
                      </div>
                    </div>
                    <Menu>
                      <MenuButton className="w-8 h-8 flex justify-center items-center">
                        <EllipsisVerticalIcon className="w-5 text-txt-secondary" />
                      </MenuButton>
                      <MenuItems
                        anchor="bottom"
                        className="bg-dark-surface border border-dark-border z-50 rounded-lg right-12 !left-auto drop-shadow-md"
                      >
                        <MenuItem>
                          <button
                            className="block w-full text-left data-[focus]:bg-dark-border py-3 px-6 rounded-lg text-white text-sm"
                            onClick={() => {
                              disconnectAccountToSite(
                                site,
                                account.publicKey
                              ).then(() => fetchConnectedAccounts());
                            }}
                          >
                            Disconnect
                          </button>
                        </MenuItem>
                      </MenuItems>
                    </Menu>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="opacity-65 fixed inset-0 z-40 bg-black"></div>
        </>
      )}
    </>
  );
};

export default Header;
