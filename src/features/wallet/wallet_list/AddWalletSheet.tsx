import { ChevronRight } from "react-feather";
import { useNavigate } from "react-router-dom";

interface AddWalletSheetProps {
  open: boolean;
  onClose: () => void;
}

const AddWalletSheet = ({ open, onClose }: AddWalletSheetProps) => {
  const navigate = useNavigate();

  if (!open) return null;

  const options = [
    {
      title: "Import private key",
      desc: "Paste your private key to import an existing wallet",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 3v12m0 0l-4-4m4 4l4-4M5 20h14"
            stroke="#9CA3AF"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      onClick: () => {
        onClose();
        navigate("/import-private-key");
      },
    },
    {
      title: "Create new account",
      desc: "Generate a new address",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="8" stroke="#9CA3AF" strokeWidth="1.6" />
          <path
            d="M12 8v8M8 12h8"
            stroke="#9CA3AF"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      ),
      onClick: () => {
        onClose();
        navigate("/create-account");
      },
    },
  ];

  return (
    <div className="absolute inset-0 z-50">
      <button
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-label="Close"
      />

      <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[400px]">
        <div
          className="sheet-enter bg-dark-card border border-dark-border rounded-t-[28px] px-5 pt-3 pb-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-10 h-1 rounded-full bg-dark-border mx-auto mb-5" />

          <h3 className="text-white text-[16px] font-semibold text-center mb-5">
            Add Wallet
          </h3>

          <div className="space-y-2">
            {options.map((item) => (
              <button
                key={item.title}
                className="w-full flex items-center gap-3 bg-dark-surface/40 border border-dark-border rounded-2xl px-4 py-3 text-left hover:bg-dark-surface"
                type="button"
                onClick={item.onClick}
              >
                <div className="w-9 h-9 rounded-full bg-dark-surface border border-dark-border flex items-center justify-center shrink-0">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{item.title}</p>
                  <p className="text-txt-muted text-[11px] truncate">
                    {item.desc}
                  </p>
                </div>
                <ChevronRight size={14} className="text-txt-muted shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddWalletSheet;
