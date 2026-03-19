import { useNavigate } from "react-router-dom";
import { ChevronRight } from "react-feather";
import PageHeader from "@ui/PageHeader";

const NLOWallet = () => {
  const navigate = useNavigate();

  const items = [
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
        </svg>
      ),
      title: "Private Key",
      description: "Click and reveal and keep it secure.",
      to: "/show-private-key",
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      ),
      title: "Secret recovery phrase",
      description: "This is your phrases to recover your wallet",
      to: "/recovery-phase",
    },
  ];

  return (
    <div className="app-frame mx-auto bg-dark-bg flex flex-col">
      <PageHeader title="NLO Wallet" />

      <div className="flex-1 px-5">
        <div className="space-y-2">
          {items.map((item) => (
            <button
              key={item.title}
              onClick={() => navigate(item.to)}
              className="w-full flex items-center gap-3 bg-dark-card border border-dark-border rounded-2xl p-4 text-left hover:bg-dark-surface"
            >
              <div className="w-9 h-9 rounded-full bg-dark-surface flex items-center justify-center shrink-0">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium">{item.title}</p>
                <p className="text-txt-muted text-[11px]">{item.description}</p>
              </div>
              <ChevronRight size={16} className="text-txt-muted shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NLOWallet;
