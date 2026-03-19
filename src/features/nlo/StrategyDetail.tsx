import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Edit2 } from "react-feather";
import PageHeader from "@ui/PageHeader";
import { mockStrategies, mockPositions } from "./mock-data";

type Tab = "Active" | "Closed";

const StrategyDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<Tab>("Active");

  const strategy = mockStrategies.find((s) => s.id === id) || mockStrategies[0];
  const positions = mockPositions.filter(
    (p) => p.strategyId === strategy.id
  );
  const activePositions = positions.filter((p) => !p.closedAt);
  const closedPositions = positions.filter((p) => !!p.closedAt);

  const totalInvested = positions.reduce((s, p) => s + p.invested, 0);
  const totalValue = positions.reduce((s, p) => s + p.currentValue, 0);
  const totalYield = totalValue - totalInvested;

  const currentPositions =
    activeTab === "Active" ? activePositions : closedPositions;

  return (
    <div className="app-frame mx-auto bg-dark-bg flex flex-col">
      <PageHeader title="" />

      <div className="flex-1 overflow-y-auto px-5">
        <h1 className="text-white text-[18px] font-medium mb-4">
          {strategy.name}
        </h1>

        {/* Summary */}
        <div className="mb-4">
          <p className="text-txt-muted text-[10px] uppercase tracking-wider mb-1">
            {strategy.name.split("-")[0]} Total
          </p>
          <h2 className="text-white text-[30px] font-semibold mb-4">
            ${totalValue.toLocaleString()}
          </h2>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="app-card p-3">
              <p className="text-txt-muted text-[10px] uppercase mb-1">
                Invested
              </p>
              <p className="text-white text-sm font-semibold">
                ${totalInvested.toLocaleString()}
              </p>
            </div>
            <div className="app-card p-3">
              <p className="text-txt-muted text-[10px] uppercase mb-1">
                Total Yield
              </p>
              <p className="text-accent-green text-sm font-semibold">
                +${totalYield.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 mb-4 border-b border-dark-border">
          {(["Active", "Closed"] as Tab[]).map((tab) => (
            <button
              key={tab}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                tab === activeTab
                  ? "text-white border-white"
                  : "text-txt-muted border-transparent"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab} positions
            </button>
          ))}
        </div>

        {/* Position cards */}
        <div className="space-y-3">
          {currentPositions.map((position) => {
            const pnl = position.currentValue - position.invested;
            const pnlPercent = ((pnl / position.invested) * 100).toFixed(1);

            return (
              <div
                key={position.id}
                className="bg-dark-card border border-dark-border rounded-2xl p-4 cursor-pointer hover:bg-dark-surface"
                onClick={() => navigate(`/position-details/${position.id}`)}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-txt-muted text-[10px]">
                    {position.closedAt
                      ? `Closed: ${position.closedAt}`
                      : `Created: ${position.createdAt}`}
                  </p>
                  {position.closedAt ? (
                    <span className="text-txt-muted text-[10px]">
                      {position.closeReason}
                    </span>
                  ) : (
                    <Edit2 size={12} className="text-txt-muted" />
                  )}
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-dark-surface border border-dark-border flex items-center justify-center">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#3B82F6"
                      strokeWidth="2"
                    >
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">
                      {position.agentName}
                    </p>
                    <p className="text-txt-muted text-[10px]">
                      Auto balancing funds.
                    </p>
                  </div>
                </div>

                <div
                  className={`grid ${position.closedAt ? "grid-cols-3" : "grid-cols-2"} gap-3`}
                >
                  <div>
                    <p className="text-txt-muted text-[10px] uppercase mb-0.5">
                      Invested
                    </p>
                    <p className="text-white text-sm font-semibold">
                      ${position.invested.toLocaleString()}
                    </p>
                  </div>
                  {position.closedAt ? (
                    <>
                      <div>
                        <p className="text-txt-muted text-[10px] uppercase mb-0.5">
                          PNL
                        </p>
                        <p className="text-sm font-semibold">
                          <span className="text-accent-green">+${pnl}</span>{" "}
                          <span className="text-accent-green text-[10px]">
                            +{pnlPercent}%
                          </span>
                        </p>
                      </div>
                      <div>
                        <p className="text-txt-muted text-[10px] uppercase mb-0.5">
                          Total
                        </p>
                        <p className="text-white text-sm font-semibold">
                          +${position.currentValue.toLocaleString()}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div>
                      <p className="text-txt-muted text-[10px] uppercase mb-0.5">
                        Current Value
                      </p>
                      <p className="text-white text-sm font-semibold flex items-center gap-2">
                        ${position.currentValue.toLocaleString()}
                        <span className="text-accent-green text-[10px] bg-accent-green/10 px-2 py-0.5 rounded-full">
                          +{pnlPercent}%
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StrategyDetail;
