import { useNavigate } from "react-router-dom";
import { ArrowRight, Info, Play } from "react-feather";

const NLOWelcome = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* NLO Icon */}
        <div className="mb-6">
          <svg
            width="88"
            height="88"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="50" cy="50" r="30" stroke="#F8FAFC" strokeWidth="2" />
            <circle cx="50" cy="50" r="12" fill="#ff6a2e" />
            <circle cx="33" cy="30" r="4.5" fill="#ff6a2e" opacity="0.7" />
            <path
              d="M50 18 Q70 30 66 50"
              stroke="#F8FAFC"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M50 82 Q30 70 34 50"
              stroke="#F8FAFC"
              strokeWidth="2"
              fill="none"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-white text-[22px] font-medium text-center mb-1">
          Neural Liquidity
        </h1>
        <h2 className="text-XOrange text-[22px] font-semibold text-center mb-4">
          Orchestrator
        </h2>

        {/* Description */}
        <p className="text-txt-muted text-[13px] text-center leading-5 px-6">
          NLO is an automated DeFi account that manages liquidity strategies
          based on your selected risk level.
        </p>
      </div>

      {/* Bottom actions */}
      <div className="px-5 pb-5 space-y-3">
        <button
          className="w-full flex items-center justify-center gap-2 btn-primary text-sm py-3.5"
          onClick={() => navigate("/nlo-name-agent")}
        >
          Get Started
          <ArrowRight size={16} />
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            className="flex items-center justify-center gap-2 btn-tertiary text-[12px] py-3"
            onClick={() => navigate("/nlo-learn")}
          >
            <Info size={14} />
            Learn About NLO
          </button>
          <button
            className="flex items-center justify-center gap-2 btn-tertiary text-[12px] py-3"
            onClick={() => navigate("/nlo-demo")}
          >
            <Play size={14} />
            View Demo
          </button>
        </div>
      </div>
    </div>
  );
};

export default NLOWelcome;
