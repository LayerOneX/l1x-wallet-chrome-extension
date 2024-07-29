type Tab = "Assets" | "NFT" | "Transactions";

interface ITabsProps {
  tabs: Tab[];
  activeTab: Tab;
  setActiveTab: (Tab) => void;
}

interface IDashboardProps {
  activeTab: Tab;
  balance: number;
}
