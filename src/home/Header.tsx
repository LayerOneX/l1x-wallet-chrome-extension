import { ChevronDown, Copy, Globe, Settings, X } from "react-feather";
import { FC, useContext, useEffect, useState } from "react";
import { AppContext } from "../Auth.guard";
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

const Header: FC<{ balance: number }> = (props) => {
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
      if (addresslist) {
        const accounts: IXWalletAccount[] = [];
        await Promise.all(
          addresslist?.map(async (address) => {
            const account = await getAccount(address);
            if (account) {
              accounts.push(account);
            }
          })
        );
        setConnectedAccounts([...accounts]);
      }
    }
  }

  return (
    <>
      <div className="flex items-center justify-between w-full mb-4">
        <div className="flex items-center gradient-border p-2 rounded-full w-full">
          <div className="me-4 w-10 h-10 min-w-10  rounded-full overflow-hidden flex items-center justify-center bg-slate-100">
            <img src={appContext?.accountIcon} className="w-full h-full" />
          </div>
          <div>
            <h4 className="flex items-center w-full font-semibold text-md leading-[18px]">
              <span
                className="inline-block whitespace-nowrap text-ellipsis overflow-hidden max-w-[130px]"
                title={appContext?.accountName}
              >
                {appContext?.accountName}{" "}
              </span>
              <button
                className="cursor-pointer"
                data-tooltip-id="copy-publickey-click"
                onClick={() => copyPublickey(appContext?.publicKey || "")}
              >
                <Copy className="w-4 h-4 ms-2 text-XOrange" />
              </button>
              {copied == appContext?.publicKey && (
                <Tooltip
                  className="font-normal !bg-white !text-black shadow-lg !opacity-100 border border-slate-100 !text-[12px]"
                  id="copy-publickey-click"
                  content="Copied!"
                  defaultIsOpen={true}
                  afterShow={() =>
                    setTimeout(() => {
                      setCopied("");
                    }, 1000)
                  }
                  events={["click"]}
                />
              )}
            </h4>
            <h6 className="font-medium text-sm text-slate-400">
              ${props.balance.toLocaleString() || 0}
            </h6>
          </div>
          <button
            className="ms-auto w-8 h-8 flex items-center justify-center"
            onClick={() => navigate("/wallet-list")}
          >
            <ChevronDown />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-full ms-4  w-[28px] h-[28px] min-w-[28px] cursor-pointer relative"
            onClick={() => setShowConnectedAccounts(true)}
          >
            <div
              className="inactive-site"
              data-tooltip-id="no-account-connected"
              data-tooltip-place="bottom"
            >
              {activeTab?.favIconUrl ? (
                <img
                  src={activeTab?.favIconUrl}
                  className="w-[22px]"
                  alt="image"
                />
              ) : (
                <Globe className="text-gray-400" />
              )}
              <div
                className={classNames(
                  connectedAccounts.length ? "bg-[#22c55e]" : "bg-gray-200",
                  "absolute w-3 h-3 border-2 border-white rounded-full right-0 bottom-0"
                )}
              ></div>
            </div>
            {!connectedAccounts.length && (
              <Tooltip
                className="font-normal !bg-white !text-black shadow-lg !opacity-100 border border-slate-100 !text-[12px]"
                id="no-account-connected"
                content="No Accounts Connected"
                defaultIsOpen={false}
                place={"bottom"}
                afterShow={() =>
                  setTimeout(() => {
                    setCopied("");
                  }, 1000)
                }
              />
            )}
          </button>
          <button
            className="flex items-center justify-center rounded-full text-XBlue  p-2  cursor-pointer"
            onClick={() => navigate("/settings")}
          >
            <Settings />
          </button>
        </div>
      </div>

      {showConnectedAccounts ? (
        <>
          <div className="justify-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
            <div className="relative w-full py-6 mx-auto max-w-[96%] md:max-w-md">
              {/*content*/}
              <div className="">
                <div className="rounded-2xl relative flex flex-col w-full bg-white outline-none focus:outline-none px-5 py-4 md:py-8">
                  {/*body*/}

                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="text-xl font-semibold truncate"
                      title={activeTab?.title}
                    >
                      {" "}
                      {activeTab?.title}{" "}
                    </div>
                    <div
                      className="cursor-pointer flex justify-center items-center text-xs"
                      onClick={() => setShowConnectedAccounts(false)}
                    >
                      <X />
                    </div>
                  </div>
                  {!connectedAccounts.length && (
                    <p className="mb-6">
                      L1X is not connected to this site. To connect to a web3
                      site, find and click the connect button.
                    </p>
                  )}

                  {/* List accounts */}
                  {connectedAccounts.map((account) => (
                    <div className="bg-XLightBlue flex items-center justify-between p-2 rounded-full w-full mb-3 hover:bg-XLightBlue">
                      <div className="flex items-center justify-between gap-3">
                        <div className="me-2 w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 relative">
                          <img src={account.icon} alt="image" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-md leading-[18px]">
                            {account.accountName}
                          </h4>
                          <p className="font-medium text-[10px] text-slate-400">
                            {Util.wrapPublicKey(account.publicKey)}
                            <button
                              className="cursor-pointer"
                              data-tooltip-id="copy-publickey-click"
                              onClick={() =>
                                copyPublickey(account?.publicKey || "")
                              }
                            >
                              <Copy className="w-4 h-4 ms-2 text-XOrange" />
                            </button>
                            {copied == account?.publicKey && (
                              <Tooltip
                                className="font-normal !bg-white !text-black shadow-lg !opacity-100 border border-slate-100 !text-[12px]"
                                id="copy-publickey-click"
                                content="Copied!"
                                defaultIsOpen={true}
                                afterShow={() =>
                                  setTimeout(() => {
                                    setCopied("");
                                  }, 1000)
                                }
                                events={["click"]}
                              />
                            )}
                          </p>
                        </div>
                      </div>
                      <div>
                        <Menu>
                          <MenuButton className="w-10 h-10 flex justify-center items-center">
                            {" "}
                            <EllipsisVerticalIcon className="w-6 text-gray-800" />
                          </MenuButton>
                          <MenuItems
                            anchor="bottom"
                            className="bg-white z-50 rounded-md right-12 !left-auto drop-shadow-md"
                          >
                            <MenuItem>
                              <a
                                className="block data-[focus]:bg-blue-100 py-3 px-6 rounded-md"
                                href="#"
                                onClick={() => {
                                  disconnectAccountToSite(
                                    site,
                                    account.publicKey
                                  ).then(() => fetchConnectedAccounts());
                                }}
                              >
                                Disconnect
                              </a>
                            </MenuItem>
                          </MenuItems>
                        </Menu>
                      </div>
                    </div>
                  ))}
                  {/* End list accounts */}
                </div>
              </div>
            </div>
          </div>
          <div className="opacity-65 fixed inset-0 z-40 bg-[#212121]"></div>
        </>
      ) : null}
    </>
  );
};

export default Header;
