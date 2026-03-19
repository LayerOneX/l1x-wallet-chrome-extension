type WalletTab = "Tokens" | "NFTs" | "Activity";

// Legacy alias for backward compatibility
type Tab = WalletTab;

interface ITabsProps {
  tabs: WalletTab[];
  activeTab: WalletTab;
  setActiveTab: (tab: WalletTab) => void;
}

interface IDashboardProps {
  activeTab: WalletTab;
  balance: number;
}
