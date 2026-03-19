import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const TransferProcessing = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [activeDot, setActiveDot] = useState(0);

  const amount = params.get("amount") || "0";
  const token = params.get("token") || "USDT";
  const type = params.get("type") || "withdraw";
  const wallet = params.get("wallet") || "";

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setActiveDot((prev) => (prev + 1) % 4);
    }, 500);

    const timer = setTimeout(() => {
      // Simulate success (80% chance) or failure (20% chance)
      const success = Math.random() > 0.2;
      if (success) {
        navigate(
          `/withdrawal-complete?amount=${amount}&token=${token}&wallet=${encodeURIComponent(wallet)}`
        );
      } else {
        navigate(
          `/withdrawal-failed?amount=${amount}&token=${token}&type=${type}`
        );
      }
    }, 3000);

    return () => {
      clearInterval(dotInterval);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="app-frame mx-auto bg-dark-bg flex flex-col items-center justify-center px-6">
      {/* Icon */}
      <div className="relative mb-10">
        <div className="w-24 h-24 rounded-full border border-accent-blue/30 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-accent-blue/10 flex items-center justify-center">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#3B82F6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>
          </div>
        </div>
      </div>

      {/* Text */}
      <h1 className="text-white text-[22px] font-medium mb-2">
        Initiated Transfer
      </h1>
      <p className="text-txt-secondary text-[13px] mb-8">Processing On-Chain</p>

      {/* Animated Dots */}
      <div className="flex items-center gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
              i <= activeDot ? "bg-accent-blue" : "bg-dark-border"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default TransferProcessing;
