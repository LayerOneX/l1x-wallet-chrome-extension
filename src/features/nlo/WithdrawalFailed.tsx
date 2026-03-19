import { useNavigate, useSearchParams } from "react-router-dom";

const WithdrawalFailed = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const type = params.get("type") || "withdraw";

  return (
    <div className="app-frame mx-auto bg-dark-bg flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Failure Icon */}
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-full border border-accent-red/30 flex items-center justify-center shadow-[0_0_0_14px_rgba(255,77,109,0.08)]">
            <div className="w-16 h-16 rounded-full bg-accent-red/10 flex items-center justify-center">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#EF4444"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
          </div>
        </div>

        <h1 className="text-white text-[22px] font-semibold mb-2">
          Withdrawal Failed
        </h1>
        <p className="text-txt-secondary text-[13px] text-center leading-5">
          We couldn't complete the transfer.
          <br />
          No funds were deducted.
        </p>
      </div>

      {/* Bottom Buttons */}
      <div className="px-5 pb-5 flex gap-3">
        <button
          onClick={() => { type === "exit" ? navigate(-1) : navigate("/withdraw"); }}
          className="flex-1 bg-white text-dark-bg py-3.5 rounded-xl text-sm font-semibold hover:bg-gray-100"
        >
          Try Again
        </button>
        <button
          onClick={() => navigate("/portfolio")}
          className="flex-1 bg-dark-card border border-dark-border text-txt-secondary py-3.5 rounded-xl text-sm font-medium hover:bg-dark-surface"
        >
          View Details
        </button>
      </div>
    </div>
  );
};

export default WithdrawalFailed;
