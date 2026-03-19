import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../Auth.guard";
import { ChevronRight, ChevronDown, Plus } from "react-feather";
import { mockPortfolio, mockAgent } from "./mock-data";
import nloLogo from "@assets/images/L1X_icon.png";
import NLOAccountSheet from "./components/NLOAccountSheet";

const Portfolio = () => {
  const appContext = useContext(AppContext);
  const navigate = useNavigate();
  const [showAccountSheet, setShowAccountSheet] = useState(false);
  const portfolio = mockPortfolio;
  const hasPositions = portfolio.strategies.length > 0;
  const storedAgent = localStorage.getItem("nlo_agent_name");
  const agent = { ...mockAgent, name: storedAgent || mockAgent.name };

  if (!hasPositions) {
    return (
      <PortfolioEmpty
        onOpenAccount={() => setShowAccountSheet(true)}
        onCloseAccount={() => setShowAccountSheet(false)}
        accountOpen={showAccountSheet}
      />
    );
  }

  return (
    <div className="px-5 py-4 flex flex-col h-full relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <img src={nloLogo} alt="NLO" className="w-8 h-8 rounded-full" />
          <span className="text-white font-semibold text-sm">
            {agent.name} NLO
          </span>
        </div>
        <button
          className="flex items-center gap-2 bg-dark-card border border-dark-border rounded-full px-3 py-1.5"
          onClick={() => setShowAccountSheet(true)}
        >
          <div className="w-5 h-5 rounded-full bg-accent-blue/30 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-accent-blue" />
          </div>
          <span className="text-white text-xs">
            {appContext?.publicKey
              ? `${appContext.publicKey.slice(0, 4)}...${appContext.publicKey.slice(-4)}`
              : "0xjso...98jsl"}
          </span>
          <ChevronDown size={12} className="text-txt-secondary" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-4">
        {/* Holdings */}
        <div className="text-center mb-4">
          <p className="text-txt-muted text-[10px] font-semibold uppercase tracking-wider mb-1">
            NLO Holdings
          </p>
          <h2 className="text-white text-[32px] font-semibold tracking-[-0.02em]">
            ${portfolio.totalHoldings.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </h2>
        </div>

        {/* Invested / Total Yield */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="app-card p-3">
            <p className="text-[10px] text-txt-muted uppercase tracking-wider mb-1">
              Invested
            </p>
            <p className="text-white text-[16px] font-semibold">
              ${portfolio.totalInvested.toLocaleString()}
            </p>
          </div>
          <div className="app-card p-3">
            <p className="text-[10px] text-txt-muted uppercase tracking-wider mb-1">
              Total Yield
            </p>
            <p className="text-accent-green text-[16px] font-semibold">
              +${portfolio.totalYield.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="sticky top-0 z-10 bg-dark-bg pt-1 pb-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate("/new-position")}
              className="flex items-center justify-center gap-2 bg-white text-dark-bg rounded-xl py-3 text-sm font-semibold hover:bg-gray-100"
            >
              <Plus size={16} />
              Add Position
            </button>
            <button
              onClick={() => navigate("/withdraw")}
              className="flex items-center justify-center gap-2 bg-dark-card border border-dark-border rounded-xl py-3 text-white text-sm font-medium hover:bg-dark-surface"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="7" y1="17" x2="17" y2="7" />
                <polyline points="7 7 17 7 17 17" />
              </svg>
              Withdraw
            </button>
          </div>
        </div>

        {/* Active Strategies */}
        <p className="text-[10px] text-txt-muted uppercase tracking-wider mb-3">
          Active Strategy
        </p>
        <div className="space-y-3">
          {portfolio.strategies.map((strategy) => (
            <button
              key={strategy.id}
              onClick={() => navigate(`/strategy-detail/${strategy.id}`)}
              className="w-full app-card p-3 text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-accent-blue/20 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">
                      {strategy.name}
                    </p>
                    <p className="text-txt-muted text-xs">
                      {strategy.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-txt-secondary">
                  <span className="text-xs">({strategy.allocations} Allocations)</span>
                  <ChevronRight size={14} />
                </div>
              </div>
              <div className="bg-dark-surface rounded-lg p-2 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-txt-muted uppercase">
                    Current Value
                  </p>
                  <p className="text-white font-semibold">
                    ${strategy.currentValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <span className="text-accent-green text-xs bg-accent-green/10 px-2 py-0.5 rounded">
                  +{strategy.pnlPercent}%
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <NLOAccountSheet
        open={showAccountSheet}
        onClose={() => setShowAccountSheet(false)}
      />
    </div>
  );
};

const PortfolioEmpty = ({
  onOpenAccount,
  onCloseAccount,
  accountOpen,
}: {
  onOpenAccount: () => void;
  onCloseAccount: () => void;
  accountOpen: boolean;
}) => {
  const navigate = useNavigate();
  const appContext = useContext(AppContext);
  const storedAgent = localStorage.getItem("nlo_agent_name");

  return (
    <div className="px-5 py-4 flex flex-col h-full relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <img src={nloLogo} alt="NLO" className="w-8 h-8 rounded-full" />
          <span className="text-white font-semibold text-sm">
            {storedAgent || "Jarvis"} NLO
          </span>
        </div>
        <button
          className="flex items-center gap-1 bg-dark-card border border-dark-border rounded-full px-3 py-1.5"
          onClick={onOpenAccount}
        >
          <div className="w-5 h-5 rounded-full bg-accent-blue" />
          <span className="text-white text-xs">
            {appContext?.publicKey
              ? `${appContext.publicKey.slice(0, 4)}...${appContext.publicKey.slice(-4)}`
              : "0xjso...98jsl"}
          </span>
          <ChevronDown size={12} className="text-txt-secondary" />
        </button>
      </div>

      {/* Empty State */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <img src={nloLogo} alt="NLO" className="w-16 h-16 mb-6" />
        <h2 className="text-white text-[20px] font-semibold mb-1">
          Create your first
        </h2>
        <h2 className="text-white text-[20px] font-semibold mb-2">NLO position</h2>
        <p className="text-txt-secondary text-[13px] text-center mb-8">
          NLO manages your automated liquidity strategies.
        </p>

        <div className="w-full space-y-3">
          <button
            onClick={() => navigate("/new-position")}
            className="w-full flex items-center justify-center gap-2 bg-white text-black rounded-xl py-3.5 font-semibold"
          >
            <Plus size={16} />
            Create Position
          </button>
          <button
            className="w-full bg-dark-card border border-dark-border text-white rounded-xl py-3.5 font-medium"
            onClick={() => navigate("/nlo-wallet")}
          >
            View NLO Account details
          </button>
        </div>
      </div>

      <NLOAccountSheet open={accountOpen} onClose={onCloseAccount} />
    </div>
  );
};

export default Portfolio;
