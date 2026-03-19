import { useContext, useEffect, useMemo, useState } from "react";
import { Copy, Edit2, ChevronRight } from "react-feather";
import { AppContext } from "../../../Auth.guard";
import { ExtensionStorage } from "@util/ExtensionStorage.util";
import { useNavigate } from "react-router-dom";

interface NLOAccountSheetProps {
  open: boolean;
  onClose: () => void;
  wallet?: IXWalletAccount;
  onUpdate?: () => void;
}

const NLOAccountSheet = ({ open, onClose, wallet: walletProp, onUpdate }: NLOAccountSheetProps) => {
  const appContext = useContext(AppContext);
  const navigate = useNavigate();
  const [account, setAccount] = useState<IXWalletAccount | null>(null);
  const [allWallets, setAllWallets] = useState<IXWalletAccount[]>([]);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [nameError, setNameError] = useState("");
  const [hideError, setHideError] = useState("");
  const [showHideConfirm, setShowHideConfirm] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const wallets = await ExtensionStorage.get("wallets");
      const target = walletProp || wallets?.ACTIVE || null;
      setAccount(target);
      setName(target?.accountName || "Account 1");
      const list = wallets
        ? Object.values(wallets)
            .flat()
            .filter(Boolean) as IXWalletAccount[]
        : [];
      setAllWallets(list);
      setEditing(false);
      setNameError("");
      setHideError("");
    })();
  }, [open, walletProp]);

  const truncated = useMemo(() => {
    const address = account?.publicKey || appContext?.publicKey || "";
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  }, [account?.publicKey, appContext?.publicKey]);

  const fullAddress = account?.publicKey || appContext?.publicKey || "";

  async function handleSave() {
    if (!account || !name.trim() || saving) return;
    const trimmed = name.trim();
    const duplicate = allWallets.find(
      (wallet) =>
        wallet.publicKey !== account.publicKey &&
        wallet.accountName?.toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) {
      setNameError("Account name already exists.");
      return;
    }
    setSaving(true);
    try {
      const updated = { ...account, accountName: trimmed };
      await appContext?.virtualMachine.updateAccountName(updated);
      setAccount(updated);
      setEditing(false);
      setNameError("");
      onUpdate?.();
    } finally {
      setSaving(false);
    }
  }

  function handleCopy() {
    if (!fullAddress) return;
    navigator.clipboard.writeText(fullAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  async function handleHideWallet() {
    if (!account) return;
    const hidden = (await ExtensionStorage.get("hiddenWallets")) || [];
    const visible = allWallets.filter(
      (wallet) => !hidden.includes(wallet.publicKey)
    );
    if (visible.length <= 1) {
      setHideError("You can't hide your only wallet.");
      setShowHideConfirm(false);
      return;
    }

    const nextHidden = Array.from(
      new Set([...hidden, account.publicKey])
    );
    await ExtensionStorage.set("hiddenWallets", nextHidden);

    const wallets = await ExtensionStorage.get("wallets");
    if (wallets?.ACTIVE?.publicKey === account.publicKey) {
      const nextActive = visible.find(
        (wallet) => wallet.publicKey !== account.publicKey
      );
      if (nextActive) {
        wallets.ACTIVE = nextActive;
        await ExtensionStorage.set("wallets", wallets);
      }
    }

    setShowHideConfirm(false);
    onUpdate?.();
    onClose();
  }

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-50">
      <button
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-label="Close"
      />

      <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[400px]">
        <div
          className="sheet-enter bg-dark-card border border-dark-border rounded-t-[28px] px-5 pt-3 pb-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-10 h-1 rounded-full bg-dark-border mx-auto mb-4" />

          <div className="flex flex-col items-center text-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-dark-surface border border-dark-border overflow-hidden mb-3">
              {account?.icon ? (
                <img
                  src={account.icon}
                  alt="account"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-dark-border" />
              )}
            </div>

              <div className="flex items-center gap-2">
              {editing ? (
                <input
                  autoFocus
                  value={name}
                  maxLength={30}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSave();
                    }
                    if (e.key === "Escape") {
                      setName(account?.accountName || "Account 1");
                      setEditing(false);
                      setNameError("");
                    }
                  }}
                  className="bg-dark-surface border border-dark-border rounded-lg px-3 py-1 text-white text-sm outline-none w-[170px]"
                />
              ) : (
                <h3 className="text-white text-[15px] font-semibold">
                  {name || "Account 1"}
                </h3>
              )}
              <button
                className="text-txt-muted hover:text-white"
                onClick={() => {
                  setEditing(true);
                  setNameError("");
                }}
                aria-label="Edit account name"
              >
                <Edit2 size={14} />
              </button>
            </div>
            {nameError && (
              <p className="text-accent-red text-[11px] mt-2">{nameError}</p>
            )}

            <div className="flex items-center gap-2 mt-2 text-[11px] text-txt-muted">
              <span className="font-mono">{truncated}</span>
              <button
                className="text-txt-muted hover:text-white"
                onClick={handleCopy}
                aria-label="Copy address"
              >
                <Copy size={12} />
              </button>
              {copied && (
                <span className="text-accent-green text-[10px]">Copied</span>
              )}
            </div>

            {editing && (
              <div className="flex items-center gap-2 mt-3">
                <button
                  className="px-3 py-1 rounded-lg bg-white text-dark-bg text-xs font-semibold"
                  onClick={handleSave}
                  disabled={!name.trim() || saving}
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  className="px-3 py-1 rounded-lg bg-dark-surface border border-dark-border text-txt-muted text-xs"
                  onClick={() => {
                    setName(account?.accountName || "Account 1");
                    setEditing(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="border-t border-dark-border pt-3 space-y-2">
            {[
              {
                title: "Networks (16)",
                desc: "All networks that can accept and send tokens, assets",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="8" stroke="#9CA3AF" strokeWidth="1.6" />
                    <path d="M12 4v16M4 12h16" stroke="#9CA3AF" strokeWidth="1.2" />
                  </svg>
                ),
                onClick: () => {
                  onClose();
                  navigate("/select-networks");
                },
              },
              {
                title: "Private Key",
                desc: "Reveal and export your private key",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="8" cy="12" r="3" stroke="#9CA3AF" strokeWidth="1.6" />
                    <path d="M11 12h9l-2 2m2-2-2-2" stroke="#9CA3AF" strokeWidth="1.6" />
                  </svg>
                ),
                onClick: () => {
                  onClose();
                  navigate("/show-private-key");
                },
              },
              {
                title: "Hide Wallet",
                desc: "Hide this wallet from your primary list",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M4 12s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5z" stroke="#9CA3AF" strokeWidth="1.6" />
                    <circle cx="12" cy="12" r="2.5" stroke="#9CA3AF" strokeWidth="1.6" />
                  </svg>
                ),
                onClick: () => setShowHideConfirm(true),
              },
            ].map((item) => (
              <button
                key={item.title}
                className="w-full flex items-center gap-3 bg-dark-surface/40 border border-dark-border rounded-2xl px-4 py-3 text-left hover:bg-dark-surface"
                type="button"
                onClick={item.onClick}
              >
                <div className="w-9 h-9 rounded-full bg-dark-surface border border-dark-border flex items-center justify-center shrink-0">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{item.title}</p>
                  <p className="text-txt-muted text-[11px] truncate">
                    {item.desc}
                  </p>
                </div>
                <ChevronRight size={14} className="text-txt-muted shrink-0" />
              </button>
            ))}
          </div>

          {hideError && (
            <p className="text-accent-red text-[11px] mt-3">{hideError}</p>
          )}
        </div>
      </div>

      {showHideConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-[300px] bg-dark-card border border-dark-border rounded-[22px] p-5 text-center">
            <h3 className="text-white text-[16px] font-semibold mb-2">
              Hide Wallet?
            </h3>
            <p className="text-txt-secondary text-[12px] leading-5 mb-5">
              This wallet will be hidden from your primary list. You can unhide
              it from Wallet Accounts.
            </p>
            <button
              onClick={handleHideWallet}
              className="w-full bg-white text-dark-bg py-3 rounded-xl text-sm font-semibold mb-3 hover:bg-gray-100"
            >
              Hide Wallet
            </button>
            <button
              onClick={() => setShowHideConfirm(false)}
              className="text-txt-secondary text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NLOAccountSheet;
