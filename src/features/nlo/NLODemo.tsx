import { useNavigate } from "react-router-dom";
import PageHeader from "@ui/PageHeader";
import { ArrowRight } from "react-feather";

const steps = [
  {
    title: "Deposit",
    description: "Choose token, amount, and your fund distribution.",
    tone: "bg-accent-blue/10 text-accent-blue",
  },
  {
    title: "Orchestration",
    description: "NLO balances allocations across strategies automatically.",
    tone: "bg-XOrange/10 text-XOrange",
  },
  {
    title: "Deployment",
    description: "Funds deploy to pools with live monitoring and rebalancing.",
    tone: "bg-accent-green/10 text-accent-green",
  },
];

const NLODemo = () => {
  const navigate = useNavigate();

  return (
    <div className="app-frame mx-auto bg-dark-bg flex flex-col">
      <PageHeader title="NLO Demo" />

      <div className="flex-1 px-5 overflow-y-auto">
        <div className="app-card p-4 mb-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-txt-muted text-[10px] uppercase tracking-wider">
                Demo Flow
              </p>
              <h2 className="text-white text-[18px] font-semibold mt-1">
                See how NLO works
              </h2>
              <p className="text-txt-secondary text-[12px] mt-1">
                A quick walkthrough of deposit to deployment.
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-dark-surface border border-dark-border flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M8 5v14l11-7-11-7z"
                  stroke="#9CA3AF"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {steps.map((step, idx) => (
            <div
              key={step.title}
              className="flex items-start gap-3 bg-dark-card border border-dark-border rounded-2xl p-4"
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold ${step.tone}`}
              >
                {idx + 1}
              </div>
              <div>
                <p className="text-white text-sm font-medium">{step.title}</p>
                <p className="text-txt-muted text-[11px] mt-1">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 pb-5 space-y-3">
        <button
          className="w-full btn-primary text-sm py-3.5 flex items-center justify-center gap-2"
          onClick={() => navigate("/nlo-name-agent")}
        >
          Start with NLO
          <ArrowRight size={16} />
        </button>
        <button
          className="w-full btn-tertiary text-sm py-3.5"
          onClick={() => navigate(-1)}
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default NLODemo;
