import {
  GlobeAsiaAustraliaIcon,
  WalletIcon,
  ShieldCheckIcon,
  ServerStackIcon,
} from "@heroicons/react/24/outline";
import { Globe, HelpCircle, Lock } from "react-feather";
import { Link, useNavigate } from "react-router-dom";
import { ExtensionStorage } from "@util/ExtensionStorage.util";
import { useState } from "react";
import { ChevronRight } from "react-feather";
import { version } from "../../../../manifest.json";

interface SettingsItem {
  icon: React.ReactNode;
  title: string;
  description: string;
  to?: string;
  onClick?: () => void;
}

const Settings = () => {
  const navigate = useNavigate();
  const [locking, setLocking] = useState(false);

  const menuItems: SettingsItem[] = [
    {
      icon: <WalletIcon className="w-5 h-5 text-txt-secondary" />,
      title: "Wallet Accounts",
      description: "View and manage your wallet addresses",
      to: "/wallet-list",
    },
    // {
    //   icon: <CreditCard className="w-5 h-5 text-txt-secondary" />,
    //   title: "NLO Account",
    //   description: "Access your Neural Liquidity Orchestrator account",
    //   to: "/nlo-wallet",
    // },
    {
      icon: <Globe className="w-5 h-5 text-txt-secondary" />,
      title: "Transactions",
      description: "View your transaction history",
      to: "/transactions",
    },
    {
      icon: <GlobeAsiaAustraliaIcon className="w-5 h-5 text-txt-secondary" />,
      title: "Connected Sites",
      description: "Manage websites connected to your wallet",
      to: "/connected-sites",
    },
    {
      icon: <ServerStackIcon className="w-5 h-5 text-txt-secondary" />,
      title: "Networks",
      description: "Add and manage custom RPC networks",
      to: "/manage-networks",
    },
    {
      icon: <Lock className="w-5 h-5 text-txt-secondary" />,
      title: "Lock Wallet",
      description: "Lock your wallet to prevent unauthorized access",
      onClick: handleLockWallet,
    },
    {
      icon: <ShieldCheckIcon className="w-5 h-5 text-txt-secondary" />,
      title: "Secret Recovery Phrase",
      description: "View your wallet recovery phrase",
      to: "/recovery-phase",
    },
    // Help Center hidden for now
    {
      icon: <HelpCircle className="w-5 h-5 text-txt-secondary" />,
      title: "Help Center",
      description: "Get support and answers to common questions",
      to: "/help-center",
    },
  ];
  async function handleLockWallet() {
    if (locking) return;
    setLocking(true);
    await ExtensionStorage.remove("lastWalletUnlocked");
    window.dispatchEvent(new Event("xwallet-lock"));
    navigate("/");
  }

  return (
    <div className="px-5 py-5 flex flex-col h-full">
      <h1 className="text-white text-[20px] font-semibold mb-1">Settings</h1>
      <p className="text-txt-muted text-xs mb-5">Manage your wallet preferences</p>

      <div className="flex-1 overflow-y-auto space-y-1">
        {menuItems.map((item) => {
          const content = (
            <div className="flex items-center gap-3 px-3 py-3.5 rounded-2xl hover:bg-dark-card transition-colors duration-150 cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-dark-surface border border-dark-border flex items-center justify-center shrink-0">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-[13px] font-medium">{item.title}</p>
                <p className="text-txt-muted text-[11px] mt-0.5 truncate">
                  {item.description}
                </p>
              </div>
              <ChevronRight size={14} className="text-white/20 shrink-0" />
            </div>
          );

          if (item.onClick) {
            return (
              <button
                key={item.title}
                className="w-full text-left"
                onClick={item.onClick}
              >
                {content}
              </button>
            );
          }

          return (
            <Link key={item.title} to={item.to || "#"}>
              {content}
            </Link>
          );
        })}

        <div className="mt-5"></div>
          <p className="text-txt-muted text-[11px] mt-0.5 truncate text-center">
            {version ? `x_Wallet v${version}` : "x_Wallet"}
          </p>
      </div>
    </div>
  );
};

export default Settings;

