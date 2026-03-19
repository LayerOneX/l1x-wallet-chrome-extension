import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const steps = ["Transaction", "Orchestration", "Deployment"];

const DepositProgress = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(0);

  const amount = searchParams.get("amount") || "0";
  const token = searchParams.get("token") || "USDC";
  const distribution = searchParams.get("distribution") || "[]";

  useEffect(() => {
    const timers = [
      setTimeout(() => setCurrentStep(1), 1500),
      setTimeout(() => setCurrentStep(2), 3000),
      setTimeout(() => {
        navigate(
          `/positions-active?amount=${amount}&distribution=${encodeURIComponent(distribution)}`
        );
      }, 4500),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="app-frame mx-auto bg-dark-bg flex flex-col rainbow-border rounded-[24px] overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Icon */}
        <div className="relative mb-8">
          <div className="w-20 h-20 rounded-full bg-dark-surface border border-accent-blue/40 flex items-center justify-center">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#3B82F6"
              strokeWidth="1.5"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="12" cy="12" r="3" />
              <path d="M3 9h18M3 15h18M9 3v18M15 3v18" opacity="0.3" />
            </svg>
          </div>
          <div className="absolute inset-0 rounded-full border-2 border-accent-blue/20 animate-ping" />
        </div>

        <h2 className="text-white text-[22px] font-semibold mb-2">
          Deposit Initiated
        </h2>
        <p className="text-txt-muted text-[13px] mb-10">
          Connecting to ETH Chain for {token}
        </p>

        {/* Progress steps */}
        <div className="space-y-5">
          {steps.map((step, i) => (
            <div key={step} className="flex items-center gap-3">
              {i < currentStep ? (
                // Completed
                <div className="w-6 h-6 rounded-full bg-accent-green/20 flex items-center justify-center">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="3"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              ) : i === currentStep ? (
                // Active
                <div className="w-6 h-6 rounded-full border-2 border-accent-blue flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-accent-blue" />
                </div>
              ) : (
                // Pending
                <div className="w-6 h-6 rounded-full border-2 border-dark-border" />
              )}
              <span
                className={`text-sm ${
                  i <= currentStep ? "text-white font-medium" : "text-txt-muted"
                }`}
              >
                {step}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DepositProgress;
