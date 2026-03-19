import { Link } from "react-router-dom";
import PageHeader from "@ui/PageHeader";
import { ExternalLink } from "react-feather";

const HelpCenter = () => {
  return (
    <div className="app-frame mx-auto bg-dark-bg flex flex-col">
      <PageHeader title="Help Center" />

      <div className="flex-1 px-5">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-dark-card border border-dark-border flex items-center justify-center mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9AA2B1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M9.09 9a3 3 0 1 1 5.82 1c0 2-3 2-3 4" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <p className="text-white text-[16px] font-semibold mb-2">
            Need immediate help?
          </p>
          {/* <p className="text-txt-muted text-[13px] leading-5 max-w-[280px]">
            We've got your back, find help by reaching out to us on{" "}
            <Link
              className="font-semibold text-XOrange"
              to="https://discord.gg/layeronex"
              target="_blank"
            >
              Discord
            </Link>
          </p> */}
        </div>

        <p className="text-white text-sm font-semibold mb-3">
          View our support pages
        </p>
        <div className="space-y-2">
          <Link
            to="https://www.wallet.l1x.foundation/terms-conditions"
            target="_blank"
            className="flex items-center justify-between bg-dark-card border border-dark-border rounded-2xl px-4 py-3 text-sm text-white hover:bg-dark-surface"
          >
            Terms and Conditions
            <ExternalLink size={14} className="text-txt-muted" />
          </Link>
          <Link
            to="https://www.wallet.l1x.foundation/privacy-policy"
            target="_blank"
            className="flex items-center justify-between bg-dark-card border border-dark-border rounded-2xl px-4 py-3 text-sm text-white hover:bg-dark-surface"
          >
            Privacy Policy
            <ExternalLink size={14} className="text-txt-muted" />
          </Link>
          {/* <Link
            to="https://wallet.l1x.foundation/how-to/import-wallet"
            target="_blank"
            className="flex items-center justify-between bg-dark-card border border-dark-border rounded-2xl px-4 py-3 text-sm text-white hover:bg-dark-surface"
          >
            How to import a wallet
            <ExternalLink size={14} className="text-txt-muted" />
          </Link>
          <Link
            to="https://wallet.l1x.foundation/how-to/send-swap"
            target="_blank"
            className="flex items-center justify-between bg-dark-card border border-dark-border rounded-2xl px-4 py-3 text-sm text-white hover:bg-dark-surface"
          >
            How to send/swap/buy
            <ExternalLink size={14} className="text-txt-muted" />
          </Link>
          <Link
            to="https://wallet.l1x.foundation/how-to"
            target="_blank"
            className="flex items-center justify-between bg-dark-card border border-dark-border rounded-2xl px-4 py-3 text-sm text-white hover:bg-dark-surface"
          >
            Other topics
            <ExternalLink size={14} className="text-txt-muted" />
          </Link> */}
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
