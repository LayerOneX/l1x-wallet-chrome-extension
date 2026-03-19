import { FC, memo } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard: FC<IDashboardProps> = memo((props) => {
  const navigate = useNavigate();

  return (
    <div className="w-full mb-0">
      {/* Balance card */}
      <div className="wallet-hero p-4 mb-4">
        <p className="text-txt-muted text-[10px] uppercase tracking-wider text-center mb-1">
          Balance
        </p>
        <h2 className="text-white text-[30px] font-semibold text-center mb-3 tracking-[-0.02em]">
          ${props.balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </h2>

        {/* Send / Receive buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            className="flex items-center justify-center gap-2 bg-dark-surface border border-dark-border text-white text-sm font-medium py-2.5 rounded-xl hover:bg-dark-border"
            onClick={() => navigate("/select-token-send")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>
            Send
          </button>
          <button
            className="flex items-center justify-center gap-2 bg-dark-surface border border-dark-border text-white text-sm font-medium py-2.5 rounded-xl hover:bg-dark-border"
            onClick={() => navigate("/receive")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="17" y1="7" x2="7" y2="17" />
              <polyline points="17 17 7 17 7 7" />
            </svg>
            Receive
          </button>
        </div>
      </div>
    </div>
  );
});

export default Dashboard;
