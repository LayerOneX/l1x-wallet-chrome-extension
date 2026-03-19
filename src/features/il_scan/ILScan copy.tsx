import { useEffect, useRef, useState } from "react";
import Logo from "@assets/images/nlo-orbit-logo.png";

type ScreenState = "scanner" | "result";
type ScanStatus = "idle" | "invalid" | "scanning" | "complete";
const SCAN_DURATION_MS = 6000;
const START_PROGRESS = 8;
const MAX_SCANNING_PROGRESS = 96;

const EVM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
const SOLANA_ADDRESS_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

const detectAddressType = (value: string): "EVM" | "Solana" | null => {
  if (EVM_ADDRESS_REGEX.test(value)) return "EVM";
  if (SOLANA_ADDRESS_REGEX.test(value)) return "Solana";
  return null;
};

const maskAddress = (value: string) => {
  if (value.length <= 16) return value;
  return `${value.slice(0, 10)}...${value.slice(-8)}`;
};

const ILScan = () => {
  const [screen, setScreen] = useState<ScreenState>("scanner");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [scanStatus, setScanStatus] = useState<ScanStatus>("idle");
  const [scanProgress, setScanProgress] = useState(0);
  // const actionBtnClass =
  //   "btn-tertiary text-[16px] transition-all duration-200 hover:bg-dark-surface hover:text-white active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dark-border";
  const activeBtnClass =
    "text-[16px] bg-white text-dark-bg border border-white rounded-[14px] font-semibold transition-all duration-200 hover:bg-white/90 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dark-border";
  const progressRaf = useRef<number | null>(null);
  const navigateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearScanTimers = () => {
    if (progressRaf.current !== null) {
      cancelAnimationFrame(progressRaf.current);
      progressRaf.current = null;
    }
    if (navigateTimer.current) {
      clearTimeout(navigateTimer.current);
      navigateTimer.current = null;
    }
  };

  useEffect(() => {
    if (screen !== "scanner") return;
    const value = address.trim();
    const addressType = detectAddressType(value);
    clearScanTimers();

    if (!value) {
      setScanStatus("idle");
      setScanProgress(0);
      return;
    }

    if (!addressType) {
      setScanStatus("invalid");
      setScanProgress(0);
      return;
    }

    setScanStatus("scanning");
    setScanProgress(START_PROGRESS);
    const startedAt = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startedAt;
      const ratio = Math.min(elapsed / SCAN_DURATION_MS, 1);
      const nextProgress =
        START_PROGRESS + (MAX_SCANNING_PROGRESS - START_PROGRESS) * ratio;
      setScanProgress(nextProgress);

      if (ratio < 1) {
        progressRaf.current = requestAnimationFrame(tick);
        return;
      }

      setScanStatus("complete");
      setScanProgress(100);
      navigateTimer.current = setTimeout(() => {
        setScreen("result");
      }, 500);
    };

    progressRaf.current = requestAnimationFrame(tick);

    return clearScanTimers;
  }, [address, screen]);

  useEffect(() => {
    return clearScanTimers;
  }, []);


  return (
    <div
      className="h-full w-full px-4 pt-5 pb-0 flex flex-col text-white relative overflow-hidden bg-dark-bg"
      style={{
        background:
          "radial-gradient(68% 58% at 84% 16%, rgba(255, 103, 23, 0.18) 0%, rgba(255, 103, 23, 0) 65%), radial-gradient(54% 38% at 14% 100%, rgba(35, 56, 115, 0.32) 0%, rgba(35, 56, 115, 0) 68%), #090D16",
      }}
    >
      {screen === "result" && (
        <button
          type="button"
          aria-label="Go back"
          onClick={() => {
            setScreen("scanner");
            setAddress("");
            setScanStatus("idle");
            setScanProgress(0);
          }}
          className="w-7 h-7 flex items-center justify-center text-txt-secondary hover:text-white transition-colors"
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      )}

      <div className="flex-1 mt-4 flex flex-col">
        {screen === "scanner" ? (
          <>
            
            <img src={Logo} className="w-20" alt="Logo" />
            {/* <h1 className="text-[24px] leading-[1.05] font-semibold tracking-[-0.02em]">DeFi liquidity</h1>
            <h2 className="text-3xl font-bold text-XOrange">On Autopilot</h2> */}
            <h1 className="text-3xl leading-[1.05] font-normal ">DeFi liquidity on</h1>
            <h2 className="text-4xl font-bold text-XOrange">autopilot</h2>

            <p className="mt-3.5 text-sm leading-[1.42] text-white max-w-[360px]">
              Discover how much yield impermanent loss has cost you. Paste your wallet to analyze your liquidity positions.
            </p>

            <div
              className="mt-6 rounded-[14px] border border-dark-border bg-dark-card/70 py-4 p-3.5 transition-all duration-250 hover:border-txt-muted hover:bg-dark-card/90"
            >
              <p className="text-[10px] text-txt-muted leading-none">IL Scanner</p>
              <h2 className="mt-1.5 text-[17px] leading-tight font-semibold tracking-[-0.01em]">
                How much has IL cost you?
              </h2>

              <input
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="Paste EVM or Solana address"
                className="mt-3 w-full h-[46px] app-input text-[14px] placeholder:text-txt-muted bg-dark-bg"
              />

              <div className="mt-3">
                {scanStatus === "idle" && (
                  <p className="text-[12px] text-txt-muted">
                    Paste a wallet address to start instant scan.
                  </p>
                )}
                {scanStatus === "invalid" && (
                  <p className="text-[12px] text-accent-red">
                    Invalid address format. Enter a valid EVM or Solana address.
                  </p>
                )}
                {(scanStatus === "scanning" || scanStatus === "complete") && (
                  <>
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-txt-secondary">
                        {scanStatus === "scanning" ? "Scanning wallet activity..." : "Scan completed"}
                      </span>
                      <span className="text-white">{Math.round(scanProgress)}%</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-dark-border overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          scanStatus === "complete"
                            ? "bg-gradient-to-r from-accent-green to-accent-blue"
                            : "bg-gradient-to-r from-accent-blue to-accent-orange"
                        }`}
                        style={{ width: `${Math.max(0, Math.min(scanProgress, 100))}%` }}
                      />
                    </div>
                    <p className="mt-2 text-[11px] text-txt-muted">
                      Detected chain type: <span className="text-white">{detectAddressType(address.trim())}</span>
                    </p>
                  </>
                )}
              </div>
            </div>

            <a
              href="https://nlo.finance/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 w-fit text-[13px] text-txt-secondary underline underline-offset-4 decoration-dark-border hover:text-white transition-colors inline-flex items-center gap-2"
            >
              <span>Learn how NLO works</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 17L17 7" />
                <path d="M8 7h9v9" />
              </svg>
            </a>
          </>
        ) : (
          <>
            <h1 className="text-[18px] leading-[1.2] font-medium text-white">Scan completed</h1>

            <div className="mt-4 inline-flex w-fit items-center gap-2 rounded-full border border-dark-border bg-transparent px-3 py-2 text-[13px] text-txt-secondary">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9AA2B1" strokeWidth="1.9">
                <rect x="4" y="3" width="16" height="16" rx="3" />
                <path d="M8 8h8M8 12h5" />
              </svg>
              <span>{maskAddress(address.trim())}</span>
            </div>

            <div className="mt-5 rounded-[14px] border border-accent-red/40 bg-[linear-gradient(114deg,rgba(85,18,50,0.20)_0%,rgba(56,17,44,0.15)_58%,rgba(34,16,37,0.2)_100%)] px-3.5 py-3">
              <p className="text-[12px] text-txt-muted">Estimated IL lost</p>
              <h2 className="my-3 text-3xl leading-none font-semibold tracking-[-0.02em] text-accent-red">-$30,980</h2>
              <p className="text-xs text-txt-muted">Net vs HODL across <span className="text-white">1 position.</span></p>
              <div className="mt-2.5 border-t border-accent-red/20 pt-2.5 flex items-center justify-between text-xs text-txt-muted">
                {/* <span>Transactions <span className="text-white"> 1351</span></span>
                <span>Positions <span className="text-white"> 1</span></span>
                <span>Confidence <span className="text-white"> Medium </span></span> */}
                NLO could have reduced this by <span className="text-white">~65% </span>
              </div>
            </div>

            <h3 className="mt-6 text-base leading-tight font-medium tracking-[-0.02em] text-white">
              See how NLO protects your liquidity
            </h3>
            <p className="mt-2 text-[14px] leading-[1.33] text-txt-muted">
              Register your email to get regular NLO updates and early access
            </p>

            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@gmail.com"
              className="mt-4 w-full h-[47px] app-input text-[14px] placeholder:text-txt-muted bg-dark-bg"
            />

            {email.trim() ? (
              <button
                type="button"
                className={`mt-5 h-[48px] w-full ${activeBtnClass}`}
              >
                Get Report
              </button>
            ) : null}
          </>
        )}
      </div>

    
    </div>
  );
};

export default ILScan;
