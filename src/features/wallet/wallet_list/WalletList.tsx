import { Copy } from "react-feather";
import { useNavigate } from "react-router-dom";
import {
  MouseEvent as ReactMouseEvent,
  useContext,
  useEffect,
  useState,
} from "react";
import { ExtensionStorage } from "@util/ExtensionStorage.util";
import { Util } from "@util/Util";
import classNames from "classnames";
import { AppContext } from "../../../Auth.guard";
import { Tooltip } from "react-tooltip";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import NLOAccountSheet from "../../nlo/components/NLOAccountSheet";
import AddWalletSheet from "./AddWalletSheet";
import { listConnectedAccounts } from "@util/Account.util";

const WalletList = () => {
  const navigate = useNavigate();
  const appContext = useContext(AppContext);
  const [wallets, setWallets] = useState<IXWalletAccount[]>([]);
  const [hiddenWallets, setHiddenWallets] = useState<IXWalletAccount[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [copied, setCopied] = useState("");
  const [selectedWallet, setSelectedWallet] = useState<IXWalletAccount | null>(
    null
  );
  const [showAccountSheet, setShowAccountSheet] = useState(false);
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [connectedToSite, setConnectedToSite] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (appContext?.virtualMachine) {
      listWallets();
    }
  }, [appContext?.virtualMachine]);

  useEffect(() => {
    // Get the current active tab and check which accounts are connected to it
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const tab = tabs[0];
      if (tab?.url) {
        try {
          const origin = new URL(tab.url).origin;
          const accounts = await listConnectedAccounts(origin);
          if (accounts && accounts.length > 0) {
            setConnectedToSite(new Set(accounts.map((a) => a.toLowerCase())));
          }
        } catch {
          // Invalid URL (e.g. chrome:// pages)
        }
      }
    });
  }, []);

  async function listWallets() {
    const storage = await ExtensionStorage.get("wallets");
    if (storage) {
      const { ACTIVE, ...wallets } = storage;
      const allWallets = Object.values(wallets).flat();
      const hidden = (await ExtensionStorage.get("hiddenWallets")) || [];
      setWallets(
        allWallets.filter((wallet) => !hidden.includes(wallet.publicKey))
      );
      setHiddenWallets(
        allWallets.filter((wallet) => hidden.includes(wallet.publicKey))
      );
    }
  }

  function copyPublickey(event: MouseEvent, data: string) {
    event.preventDefault();
    event.stopPropagation();
    navigator.clipboard.writeText(data);
    setCopied(data);
  }

  function openAccountSheet(
    event: ReactMouseEvent,
    wallet: IXWalletAccount
  ) {
    event.preventDefault();
    event.stopPropagation();
    setSelectedWallet(wallet);
    setShowAccountSheet(true);
  }

  async function unhideWallet(
    event: MouseEvent | ReactMouseEvent<HTMLButtonElement>,
    wallet: IXWalletAccount
  ) {
    event.preventDefault();
    event.stopPropagation();
    const hidden = (await ExtensionStorage.get("hiddenWallets")) || [];
    const nextHidden = hidden.filter((key: string) => key !== wallet.publicKey);
    await ExtensionStorage.set("hiddenWallets", nextHidden);
    listWallets();
  }

  const [search, setSearch] = useState("");
  const filteredWallets = wallets.filter((wallet) => {
    const q = search.toLowerCase();
    return (
      (wallet.accountName.toLowerCase().includes(q) ||
        wallet.publicKey.toLowerCase().includes(q)) && wallet.type === "EVM"
    );
  });
  const filteredHidden = hiddenWallets.filter((wallet) => {
    const q = search.toLowerCase();
    return (
      wallet.accountName.toLowerCase().includes(q) ||
      wallet.publicKey.toLowerCase().includes(q)
    );
  });

  const isActive = (key: string) => appContext?.publicKey === key;
  const isConnectedToSite = (key: string) => connectedToSite.has(key.toLowerCase());

  return (
    <div className="app-frame mx-auto bg-dark-bg flex flex-col relative">
      {/* Gradient header overlay */}
      <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-[#1a2f2a] via-[#151d1b] to-transparent pointer-events-none z-0" />

      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 px-5 pt-5 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center text-white"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-white text-base font-semibold">Accounts</h1>
      </div>

      {/* Search */}
      <div className="relative z-10 px-5 pb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search account by name or public key"
            className="w-full bg-transparent border border-dark-border/60 rounded-xl px-4 py-2.5 pr-10 text-white text-[13px] placeholder:text-txt-muted outline-none focus:border-dark-border"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 text-txt-muted"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
      </div>

      {/* Account list */}
      <div className="relative z-10 flex-1 overflow-y-auto px-3">
        {filteredWallets.map((wallet) => (
          <div
            key={wallet.publicKey}
            className={classNames(
              isActive(wallet.publicKey)
                ? "bg-[#1a2f2a]/60"
                : "hover:bg-dark-surface/40",
              "flex items-center gap-3 px-2 py-2.5 rounded-lg cursor-pointer transition-colors"
            )}
            onClick={() => {
              appContext?.changeActiveAccount(wallet);
              navigate(-1);
            }}
          >
            {/* Avatar */}
            {/* <div className="w-10 h-10 rounded-full  flex-shrink-0 bg-dark-surface relative">
              <img
                src={wallet.icon}
                className="w-full h-full object-cover"
                alt=""
              />
              {isActive(wallet.publicKey) && (
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-accent-green border-2 border-dark-bg" />
              )}
            </div> */}

            {/* Name & Address */}
            <div className="flex-1 min-w-0">
              {/* <h4 className="text-white text-[13px] font-medium truncate leading-tight">
                {wallet.accountName}
              {isActive(wallet.publicKey) && (
                <span className="absolute top-1 w-3 h-3 rounded-full bg-accent-green border-2 border-dark-bg" />
              )}
              </h4> */}
              <h4 className="text-white text-[13px] font-medium leading-tight flex items-center gap-1">
                <span className="truncate">{wallet.accountName}</span>
                {isActive(wallet.publicKey) && (
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-accent-green border border-dark-bg translate-y-[-1px]" />
                )}
              </h4>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-txt-muted text-[11px] font-mono">
                  {Util.wrapPublicKey(wallet.publicKey)}
                </span>
                {isConnectedToSite(wallet.publicKey) && (
                  <span className="text-[9px] font-medium text-accent-green bg-accent-green/10 border border-accent-green/30 rounded-full px-1.5 py-[1px] leading-tight ml-0.5 flex-shrink-0">
                    Connected
                  </span>
                )}
                <button
                  className="cursor-pointer flex-shrink-0"
                  data-tooltip-id={wallet.publicKey}
                  onClick={(event: any) => {
                    event.stopPropagation();
                    copyPublickey(event, wallet.publicKey);
                  }}
                >
                  <Copy className="w-3 h-3 text-txt-muted" />
                </button>
                {copied === wallet.publicKey && (
                  <Tooltip
                    className="font-normal !bg-dark-surface !text-white shadow-lg !opacity-100 border border-dark-border !text-[12px]"
                    id={wallet.publicKey}
                    content="Copied!"
                    defaultIsOpen={true}
                    afterShow={() =>
                      setTimeout(() => setCopied(""), 1000)
                    }
                    events={["click"]}
                  />
                )}
              </div>
            </div>

            {/* Balance */}
            {/* <span className="text-white text-[13px] font-medium flex-shrink-0">
              $0.00
            </span> */}

            {/* Three-dot button → opens account sheet */}
            <button
              className="w-6 h-8 flex items-center justify-center flex-shrink-0"
              onClick={(e) => openAccountSheet(e, wallet)}
            >
              <EllipsisVerticalIcon className="w-[18px] text-txt-muted" />
            </button>
          </div>
        ))}

        {/* Hidden wallets section */}
        {hiddenWallets.length > 0 && (
          <button
            className="w-full text-left text-txt-muted text-xs mt-3 mb-1 px-2"
            onClick={() => setShowHidden((prev) => !prev)}
          >
            {showHidden ? "Hide" : "Show"} hidden wallets (
            {hiddenWallets.length})
          </button>
        )}

        {showHidden &&
          filteredHidden.map((wallet) => (
            <div
              key={wallet.publicKey}
              className="flex items-center gap-3 px-2 py-2.5 rounded-lg opacity-60"
            >
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-dark-surface">
                <img
                  src={wallet.icon}
                  className="w-full h-full object-cover"
                  alt=""
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white text-[13px] font-medium truncate leading-tight">
                  {wallet.accountName}
                </h4>
                <span className="text-txt-muted text-[11px] font-mono">
                  {Util.wrapPublicKey(wallet.publicKey)}
                </span>
              </div>
              <button
                className="text-accent-blue text-xs font-medium flex-shrink-0"
                onClick={(event) => unhideWallet(event, wallet)}
              >
                Show
              </button>
            </div>
          ))}
      </div>

      {/* Bottom action */}
      <div className="relative z-10 px-5 pb-5 pt-2">
        <button
          className="w-full py-3 rounded-xl text-sm font-medium bg-dark-card border border-dark-border text-white hover:bg-dark-surface transition-colors"
          onClick={() => setShowAddWallet(true)}
        >
          Add Account
        </button>
      </div>

      {/* Account details sheet */}
      <NLOAccountSheet
        open={showAccountSheet}
        onClose={() => {
          setShowAccountSheet(false);
          setSelectedWallet(null);
        }}
        wallet={selectedWallet ?? undefined}
        onUpdate={listWallets}
      />

      {/* Add wallet sheet */}
      <AddWalletSheet
        open={showAddWallet}
        onClose={() => setShowAddWallet(false)}
      />
    </div>
  );
};

export default WalletList;
