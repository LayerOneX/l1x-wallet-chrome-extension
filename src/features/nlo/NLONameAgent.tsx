import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "react-feather";
import PageHeader from "@ui/PageHeader";

const NLONameAgent = () => {
  const navigate = useNavigate();
  const [agentName, setAgentName] = useState("");

  function handleSubmit() {
    if (!agentName.trim()) return;
    // Store agent name (mock - in real app would persist)
    localStorage.setItem("nlo_agent_name", agentName.trim());
    navigate("/portfolio");
  }

  return (
    <div className="app-frame mx-auto bg-dark-bg flex flex-col">
      <PageHeader title="" />

      <div className="flex-1 px-5">
        {/* Agent icon */}
        <div className="mt-6 mb-6">
          <div className="w-12 h-12 rounded-xl bg-dark-card border border-dark-border flex items-center justify-center mb-5">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ff6717"
              strokeWidth="1.5"
            >
              <rect x="4" y="4" width="16" height="12" rx="2" />
              <circle cx="9" cy="10" r="1.5" />
              <circle cx="15" cy="10" r="1.5" />
              <path d="M8 20h8" />
              <path d="M12 16v4" />
              <path d="M7 4V2" />
              <path d="M17 4V2" />
            </svg>
          </div>

          <h1 className="text-white text-[22px] font-medium mb-2">
            Name Your Agent
          </h1>
          <p className="text-txt-muted text-[13px] leading-5">
            Give an identity your neural
            <br />
            liquidity orchestrator.
          </p>
        </div>

        {/* Input */}
        <div className="mt-6">
          <label className="text-txt-muted text-[10px] uppercase tracking-wider mb-2 block">
            Agent Designation
          </label>
          <input
            type="text"
            placeholder="E.g. Jarvis"
            className="w-full app-input placeholder:text-txt-muted"
            value={agentName}
            maxLength={30}
            onChange={(e) => setAgentName(e.target.value)}
          />
          <p className="text-txt-muted text-[10px] mt-2">
            This name will be used for all interactions.
          </p>
        </div>
      </div>

      {/* Submit */}
      <div className="px-5 pb-5">
        <button
          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-medium ${
            !agentName.trim()
              ? "bg-dark-card border border-dark-border text-txt-muted cursor-not-allowed"
              : "bg-XOrange text-white hover:bg-XOrange/90"
          }`}
          disabled={!agentName.trim()}
          onClick={handleSubmit}
        >
          Initiate Identity
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default NLONameAgent;
