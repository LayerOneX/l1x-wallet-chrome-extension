import { useNavigate, useSearchParams } from "react-router-dom";
import { mockStrategies } from "./mock-data";

const PositionsActive = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const amount = parseFloat(searchParams.get("amount") || "250");
  let distribution: { strategy: string; amount: number }[] = [];
  try {
    distribution = JSON.parse(
      decodeURIComponent(searchParams.get("distribution") || "[]")
    );
  } catch {
    distribution = mockStrategies.map((s) => ({
      strategy: s.name,
      amount: amount / 3,
    }));
  }
  const agentName = localStorage.getItem("nlo_agent_name") || "Jarvis";

  return (
    <div className="app-frame mx-auto bg-dark-bg flex flex-col">
      <div className="flex-1 px-5 flex flex-col items-center pt-10">
        {/* Success icon */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-full border border-accent-green/50 bg-dark-bg flex items-center justify-center shadow-[0_0_0_12px_rgba(34,197,94,0.08)]">
            <div className="w-12 h-12 rounded-full bg-accent-green/10 flex items-center justify-center">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#10B981"
                strokeWidth="2.5"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>
        </div>

        <h2 className="text-white text-[22px] font-semibold mb-2">
          Positions Active
        </h2>
        <p className="text-txt-muted text-[13px] text-center mb-8">
          Your funds are now being managed by {agentName} (NLO).
        </p>

        {/* Breakdown card */}
        <div className="w-full app-card p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-txt-muted text-sm">Total Invested</span>
            <span className="text-white text-[18px] font-semibold">
              ${amount.toFixed(0)}
            </span>
          </div>

          <div className="space-y-3">
            {distribution.map((d) => {
              const strategy = mockStrategies.find(
                (s) =>
                  s.name.toLowerCase() === d.strategy.toLowerCase() ||
                  s.name
                    .toLowerCase()
                    .replace("-", "")
                    .includes(d.strategy.toLowerCase().replace("-", ""))
              );
              return (
                <div
                  key={d.strategy}
                  className="flex items-center justify-between bg-dark-surface rounded-xl p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-dark-card border border-dark-border flex items-center justify-center">
                      <svg
                        width="14"
                        height="14"
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
                        {strategy?.name || d.strategy}
                      </p>
                      <p className="text-txt-muted text-[10px]">
                        Auto-Rebalancing
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-txt-muted text-[10px] uppercase">
                      Invested
                    </p>
                    <p className="text-white text-sm font-medium">
                      ${d.amount.toFixed(0)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom actions */}
      <div className="px-5 pb-5 grid grid-cols-2 gap-3">
        <button
          className="py-3 rounded-xl text-sm font-medium bg-white text-dark-bg hover:bg-gray-100"
          onClick={() => navigate("/new-position")}
        >
          Add New Position
        </button>
        <button
          className="py-3 rounded-xl text-sm font-medium bg-dark-card border border-dark-border text-white hover:bg-dark-surface"
          onClick={() => navigate("/portfolio")}
        >
          Back to Portfolio
        </button>
      </div>
    </div>
  );
};

export default PositionsActive;
