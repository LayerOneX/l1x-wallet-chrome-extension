import { useContext, useEffect, useState } from "react";
import Assets from "./Assets";
import Nft from "./Nft";
import Transaction from "./Transaction";
import Header from "./Header";
import Dashboard from "./Dashboard";
import Tabs from "./Tabs";
import { AppContext } from "../Auth.guard";

const Home = () => {
  const appContext = useContext(AppContext);
  const [tabs] = useState<Tab[]>(["Assets", "NFT", "Transactions"]);
  const [activeTab, setActiveTab] = useState<Tab>("Assets");
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (appContext?.virtualMachine) {
      let timeoutid = setTimeout(() => {
        fetchAccountBalance();
      }, 500);
      return () => clearTimeout(timeoutid);
    }
  }, [appContext?.virtualMachine]);

  async function fetchAccountBalance() {
    const tokens = (await appContext?.virtualMachine.listToken()) || [];
    if (tokens.length) {
      let balance = tokens.reduce(
        (prev, curr) => prev + curr.balance * curr.usdRate,
        0
      );
      setBalance(+balance.toFixed(4));
    }
  }

  useEffect(() => {
    const activeTab = tabs.find((el) => el == window.location.hash.slice(1));
    if (activeTab) {
      setActiveTab(activeTab);
    } else {
      setActiveTab(tabs[0]);
    }
  }, []);

  function handleActiveTabChange(tab: Tab): void {
    window.location.hash = tab;
    setActiveTab(tab);
  }

  return (
    <div className="w-[375px] h-[600px] mx-auto overflow-y-auto px-4 py-5 relative flex flex-col">
      <Header balance={balance} />
      <Dashboard activeTab={activeTab} balance={balance} />
      <Tabs
        tabs={tabs}
        setActiveTab={handleActiveTabChange}
        activeTab={activeTab}
      />
      {(() => {
        switch (activeTab) {
          case "Assets":
            return <Assets />;

          case "NFT":
            return <Nft />;

          case "Transactions":
            return <Transaction />;

          default:
            return "";
        }
      })()}
    </div>
  );
};

export default Home;
