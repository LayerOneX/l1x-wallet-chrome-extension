import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "@ui/PageHeader";
import PerformanceChart from "./components/PerformanceChart";
import { mockPositions, mockPools, mockActivities } from "./mock-data";

type Tab = "Performance" | "Pools" | "Activity";

const PositionDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<Tab>("Performance");

  const position = mockPositions.find((p) => p.id === id) || mockPositions[0];
  const pnl = position.currentValue - position.invested;

  const tabs: Tab[] = ["Performance", "Pools", "Activity"];

  return (
    <div className="app-frame mx-auto bg-dark-bg flex flex-col">
      <PageHeader title="" />

      <div className="flex-1 overflow-y-auto px-5">
        {/* Title + Exit */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-white text-[18px] font-medium">
            {position.agentName}
          </h1>
          <button
            className="text-txt-secondary text-[11px] border border-dark-border rounded-full px-3 py-1.5 hover:bg-dark-card"
            onClick={() => navigate(`/exit-position/${id}`)}
          >
            Exit Position
          </button>
        </div>

        {/* Value card */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-4 mb-4 relative overflow-hidden">
          <svg
            className="absolute right-3 top-3 opacity-10"
            width="72"
            height="72"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2"
          >
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-txt-muted text-[10px] uppercase tracking-wider mb-1">
                Current Value
              </p>
              <h2 className="text-white text-[26px] font-semibold">
                ${position.currentValue.toLocaleString()}
              </h2>
            </div>
            <span className="inline-flex items-center gap-1 bg-accent-blue/10 text-accent-blue text-[11px] px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-blue" />
              Running
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-dark-surface rounded-lg p-3">
              <p className="text-txt-muted text-[10px] uppercase mb-1">
                Invested
              </p>
              <p className="text-white text-sm font-semibold">
                ${position.invested.toLocaleString()}
              </p>
            </div>
            <div className="bg-dark-surface rounded-lg p-3">
              <p className="text-txt-muted text-[10px] uppercase mb-1">
                Total PNL
              </p>
              <p
                className={`text-sm font-semibold ${pnl >= 0 ? "text-accent-green" : "text-accent-red"}`}
              >
                {pnl >= 0 ? "+" : ""}${pnl.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
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

        {/* Tab content */}
        {activeTab === "Performance" && <PerformanceChart />}

        {activeTab === "Pools" && (
          <div className="space-y-2">
            {mockPools.map((pool) => (
              <div
                key={pool.id}
                className="bg-dark-card border border-dark-border rounded-xl p-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">
                      {pool.pair}
                    </p>
                    <p className="text-accent-blue text-[11px]">
                      APY {pool.apy}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-sm font-medium">
                      ${pool.value.toLocaleString()}
                    </p>
                    <p className="text-txt-muted text-[10px]">
                      Inv. ${pool.invested.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "Activity" && (
          <div className="space-y-2">
            {mockActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between bg-dark-card border border-dark-border rounded-xl p-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      activity.type === "deposit"
                        ? "bg-accent-green/10"
                        : activity.type === "rebalance"
                          ? "bg-accent-blue/10"
                          : "bg-accent-red/10"
                    }`}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={
                        activity.type === "deposit"
                          ? "#22C55E"
                          : activity.type === "rebalance"
                            ? "#2F80FF"
                            : "#FF4D6D"
                      }
                      strokeWidth="2"
                    >
                      {activity.type === "deposit" && (
                        <path d="M12 5v14M5 12l7 7 7-7" />
                      )}
                      {activity.type === "rebalance" && (
                        <path d="M23 4v6h-6M1 20v-6h6M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
                      )}
                      {activity.type === "withdraw" && (
                        <path d="M12 19V5M5 12l7-7 7 7" />
                      )}
                    </svg>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">
                      {activity.description}
                    </p>
                  </div>
                </div>
                <span className="text-txt-muted text-xs">
                  {activity.timestamp}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PositionDetails;
