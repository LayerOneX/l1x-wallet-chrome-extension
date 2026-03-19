import { useMemo, useState } from "react";
import PageHeader from "@ui/PageHeader";
import Transaction from "@features/wallet/home/Transaction";
import Nodata from "@components/Nodata";

// const tabs = ["Transactions", "NLO Transactions"] as const;
const tabs = ["Transactions"] as const;
const mockNloTransactions = [
  {
    id: "nlo1",
    title: "Deposit",
    status: "Completed",
    amount: "+250 USDT",
    value: "$251.89",
    date: "TODAY",
  },
  {
    id: "nlo2",
    title: "Orchestration",
    status: "Completed",
    amount: "Rebalanced",
    value: "Alpha-seeker",
    date: "TODAY",
  },
  {
    id: "nlo3",
    title: "Withdrawal",
    status: "Completed",
    amount: "-100 USDT",
    value: "$100.00",
    date: "22 FEB 2026",
  },
];

const Transactions = () => {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>(
    "Transactions"
  );

  return (
    <div className="app-frame mx-auto bg-dark-bg flex flex-col">
      <PageHeader title="Transactions" />

      <div className="flex-1 overflow-y-auto px-5 pb-4">
        <div className="flex items-center bg-dark-card border border-dark-border rounded-full p-1 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`flex-1 text-[11px] font-medium px-3 py-2 rounded-full transition-colors ${
                tab === activeTab
                  ? "bg-dark-surface text-white"
                  : "text-txt-muted hover:text-txt-secondary"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {activeTab === "Transactions" ? (
          <Transaction />
        ) : (
          <NLOTransactions />
        )}
      </div>
    </div>
  );
};

const NLOTransactions = () => {
  const grouped = useMemo(() => {
    return mockNloTransactions.reduce<Record<string, typeof mockNloTransactions>>(
      (acc, tx) => {
        if (!acc[tx.date]) acc[tx.date] = [];
        acc[tx.date].push(tx);
        return acc;
      },
      {}
    );
  }, []);

  if (!mockNloTransactions.length) {
    return (
      <div className="pt-6">
        <Nodata />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([date, txs]) => (
        <div key={date}>
          <p className="text-txt-muted text-[10px] uppercase tracking-wider mb-2">
            {date}
          </p>
          <div className="space-y-2">
            {txs.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between bg-dark-card border border-dark-border rounded-2xl px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-dark-surface border border-dark-border flex items-center justify-center">
                    <span className="text-[10px] text-XOrange font-semibold">
                      NLO
                    </span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">
                      {tx.title}
                    </p>
                    <p className="text-accent-green text-[11px]">
                      {tx.status}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white text-sm font-medium">{tx.amount}</p>
                  <p className="text-txt-muted text-[11px]">{tx.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Transactions;
