import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Assets from "./Assets";
import Transaction from "./Transaction";
import Header from "./Header";
import Dashboard from "./Dashboard";
import Tabs from "./Tabs";

const Home = () => {
  const [tabs] = useState<WalletTab[]>(["Tokens", "Activity"]);
  const [activeTab, setActiveTab] = useState<WalletTab>("Tokens");
  const [balance, setBalance] = useState(0);
  const location = useLocation();
  const newTxHash = (location.state as any)?.newTxHash as string | undefined;

  useEffect(() => {
    const hash = window.location.hash.slice(1) as WalletTab;
    const activeTab = tabs.find((el) => el === hash);
    if (activeTab) {
      setActiveTab(activeTab);
    } else if (newTxHash) {
      setActiveTab("Activity");
    } else {
      setActiveTab(tabs[0]);
    }
  }, []);

  function handleActiveTabChange(tab: WalletTab): void {
    window.location.hash = tab;
    setActiveTab(tab);
  }

  return (
    <div className="px-5 py-4 flex flex-col h-full">
      <Header balance={balance} />
      <Dashboard activeTab={activeTab} balance={balance} />
      <Tabs
        tabs={tabs}
        setActiveTab={handleActiveTabChange}
        activeTab={activeTab}
      />
      <div className="flex-1 overflow-y-auto mt-3">
        {(() => {
          switch (activeTab) {
            case "Tokens":
              return <Assets onBalanceChange={setBalance} />;
            case "Activity":
              return <Transaction newTxHash={newTxHash} />;
            default:
              return null;
          }
        })()}
      </div>
    </div>
  );
};

export default Home;
