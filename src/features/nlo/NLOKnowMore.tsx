import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PageHeader from "@ui/PageHeader";
import { mockFundDistribution } from "./mock-data";

const NLOKnowMore = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const context = params.get("context") || "deposit";

  const content = useMemo(() => {
    switch (context) {
      case "withdraw":
        return {
          title: "Withdrawal Allocation",
          subtitle:
            "Adjust how funds are sourced across active strategies when withdrawing.",
        };
      case "exit":
        return {
          title: "Exit Allocation",
          subtitle:
            "Control how each strategy contributes to your exit request.",
        };
      default:
        return {
          title: "Fund Distribution",
          subtitle:
            "Set how new deposits are distributed across active strategies.",
        };
    }
  }, [context]);

  return (
    <div className="app-frame mx-auto bg-dark-bg flex flex-col">
      <PageHeader title={content.title} />

      <div className="flex-1 px-5 overflow-y-auto">
        <div className="app-card p-4 mb-4">
          <p className="text-white text-sm font-medium mb-1">
            {content.subtitle}
          </p>
          <p className="text-txt-muted text-[12px] leading-5">
            NLO keeps your allocation normalized so your distribution always
            totals 100%. Any rounding remainder is balanced automatically to
            keep strategy weights consistent.
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {mockFundDistribution.map((item, idx) => (
            <div
              key={item.name}
              className="flex items-center justify-between bg-dark-card border border-dark-border rounded-2xl px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    idx === 0
                      ? "bg-accent-blue/15 text-accent-blue"
                      : idx === 1
                        ? "bg-cyan-400/15 text-cyan-300"
                        : "bg-accent-green/15 text-accent-green"
                  }`}
                >
                  <span className="text-[11px] font-semibold">
                    {item.defaultPercent}%
                  </span>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">
                    {item.name}
                  </p>
                  <p className="text-txt-muted text-[11px]">
                    Auto-rebalancing strategy
                  </p>
                </div>
              </div>
              <span className="text-txt-muted text-[11px]">Balanced</span>
            </div>
          ))}
        </div>

        <div className="app-card p-4">
          <p className="text-white text-sm font-medium mb-2">
            What happens when you adjust
          </p>
          <div className="space-y-2 text-txt-muted text-[12px] leading-5">
            <p>• Other strategies rebalance automatically to keep totals at 100%.</p>
            <p>• Remaining percentage is applied proportionally to active strategies.</p>
            <p>• You can reset to balanced allocation at any time.</p>
          </div>
        </div>
      </div>

      <div className="px-5 pb-5">
        <button
          className="w-full btn-secondary text-sm py-3.5"
          onClick={() => navigate(-1)}
        >
          Got it
        </button>
      </div>
    </div>
  );
};

export default NLOKnowMore;
