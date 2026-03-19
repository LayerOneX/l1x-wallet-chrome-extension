import { useEffect, useRef, useState, useCallback, useContext } from "react";
import Logo from "@assets/images/nlo-orbit-logo.png";
import { isAddress } from "ethers";
import { AppContext } from "../../Auth.guard";
import { Util } from "@util/Util";


type ScreenState = "scanner" | "result";
type ScanStatus = "idle" | "invalid" | "scanning" | "complete";

const SCAN_DURATION_MS = 6000;
const START_PROGRESS = 8;
const MAX_SCANNING_PROGRESS = 96;

const SOLANA_ADDRESS_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

const detectAddressType = (value: string): "EVM" | "Solana" | null => {
  if (isAddress(value)) return "EVM";
  if (SOLANA_ADDRESS_REGEX.test(value)) return "Solana";
  return null;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const validateEmail = (value: string): string | null => {
  if (!value.trim()) return null;
  if (!EMAIL_REGEX.test(value.trim())) return "Please enter a valid email address.";
  return null;
};

const maskAddress = (value: string) => {
  if (value.length <= 16) return value;
  return `${value.slice(0, 10)}...${value.slice(-8)}`;
};

type ScanResults = {
  estimated_il_loss_usd?: number;
  total_positions_analyzed?: number;
  [key: string]: any;
};

const ILScan = () => {
  const appContext = useContext(AppContext);
  const [screen, setScreen] = useState<ScreenState>("scanner");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [scanStatus, setScanStatus] = useState<ScanStatus>("idle");
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResults, setScanResults] = useState<ScanResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEmailSubmitting, setIsEmailSubmitting] = useState(false);
  const [isEmailSubmitted, setIsEmailSubmitted] = useState(false);
  const [isAlreadyScanned, setIsAlreadyScanned] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const progressRaf = useRef<number | null>(null);
  const streamRef = useRef<EventSource | null>(null);

  const clearTimersAndStream = useCallback(() => {
    if (progressRaf.current !== null) {
      cancelAnimationFrame(progressRaf.current);
      progressRaf.current = null;
    }
    if (streamRef.current) {
      streamRef.current.close();
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return clearTimersAndStream;
  }, [clearTimersAndStream]);

  const startProgressAnimation = useCallback(() => {
    const startedAt = Date.now();
    setScanProgress(START_PROGRESS);

    const tick = () => {
      const elapsed = Date.now() - startedAt;
      const ratio = Math.min(elapsed / SCAN_DURATION_MS, 1);
      const nextProgress =
        START_PROGRESS + (MAX_SCANNING_PROGRESS - START_PROGRESS) * ratio;

      setScanProgress(nextProgress);

      if (ratio < 1) {
        progressRaf.current = requestAnimationFrame(tick);
      }
      // Stay at MAX_SCANNING_PROGRESS (96%) until real results arrive;
      // the stream/fetch handlers set progress to 100 and status to "complete".
    };

    progressRaf.current = requestAnimationFrame(tick);
  }, []);

  const startIlEstimateStream = useCallback(
    (wallet: string, wType: "evm" | "solana") => {
      if (streamRef.current) {
        streamRef.current.close();
        streamRef.current = null;
      }

      const params = new URLSearchParams({
        wallet,
        wallet_type: wType,
        lookback_days: "3650",
        max_pages: "150",
      });

      const es = new EventSource(
        `https://nlo.finance/api/il-estimate-stream?${params.toString()}`
      );
      streamRef.current = es;

      es.addEventListener("progress", (event: any) => {
        if (!event?.data) return;
        try {
          JSON.parse(event.data);
        } catch {
          // ignore malformed progress payloads
        }
      });

      es.addEventListener("result", async (event: any) => {
        es.close();
        streamRef.current = null;

        if (!event?.data) {
          setError("Failed to retrieve IL estimate. Please try again.");
          return;
        }

        try {
          const parsed = JSON.parse(event.data);
          const results: ScanResults =
            parsed.scan_results || parsed.results || parsed;

          setScanResults(results);
          setScanStatus("complete");
          setScanProgress(100);

          try {
            await fetch("https://nlo.finance/api/save-scan", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                wallet,
                wallet_type: wType,
                scan_results: results,
              }),
            });
          } catch (e) {
            console.error("Failed to save scan", e);
          }

          setScreen("result");
        } catch (e) {
          console.error("Failed to parse IL stream result event", e);
          setError("Failed to parse IL estimate. Please try again.");
        }
      });

      es.addEventListener("error_event", (event: any) => {
        es.close();
        streamRef.current = null;

        let message = "Something went wrong while scanning. Please try again.";
        if (event?.data) {
          try {
            const parsed = JSON.parse(event.data);
            if (parsed?.message) {
              message = parsed.message;
            }
          } catch {
            // ignore JSON errors
          }
        }

        setError(message);
      });

      es.onerror = (err) => {
        console.error("IL estimate stream error", err);
        setError("Failed to fetch IL estimate. Please try again later.");
        es.close();
        streamRef.current = null;
      };
    },
    []
  );

  const startScan = useCallback(
    async (wallet: string, addrType: "EVM" | "Solana") => {
      clearTimersAndStream();
      setError(null);
      setScanResults(null);
      setIsAlreadyScanned(false);

      setScanStatus("scanning");
      startProgressAnimation();

      try {
        // First check if wallet has cached results
        const ilRes = await fetch("https://nlo.finance/api/il-estimate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wallet }),
        });

        if (ilRes.ok) {
          const parsed = await ilRes.json();

          if (parsed.cached) {
            // Already scanned — show cached results immediately
            const results: ScanResults =
              parsed.scan_results || parsed.results || parsed;
            setScanResults(results);
            setIsAlreadyScanned(true);
            setScanStatus("complete");
            setScanProgress(100);
            setScreen("result");
            return;
          }
        }

        // New wallet — use SSE stream for live scan status
        const wType = addrType === "EVM" ? "evm" : "solana";
        startIlEstimateStream(wallet, wType);
      } catch (e) {
        console.error("il-estimate failed", e);
        // Fallback to stream if il-estimate errors
        const wType = addrType === "EVM" ? "evm" : "solana";
        startIlEstimateStream(wallet, wType);
      }
    },
    [clearTimersAndStream, startProgressAnimation, startIlEstimateStream]
  );

  // Prefill address with active wallet when available
  useEffect(() => {
    const activeAddress = appContext?.publicKey?.trim();
    if (screen === "scanner" && activeAddress) {
      setAddress((prev) => (prev ? prev : activeAddress));
    }
  }, [appContext?.publicKey, screen]);

  // Explicit scan trigger (Search button)
  const handleScanClick = useCallback(() => {
    if (screen !== "scanner") return;

    const value = address.trim();
    const addrType = detectAddressType(value);

    clearTimersAndStream();
    setError(null);
    setScanResults(null);

    if (!value) {
      setScanStatus("idle");
      setScanProgress(0);
      return;
    }

    if (!addrType) {
      setScanStatus("invalid");
      setScanProgress(0);
      setError("Invalid address format. Enter a valid EVM or Solana address.");
      return;
    }

    startScan(value, addrType);
  }, [address, screen, clearTimersAndStream, startScan]);

  const handleSubmitEmail = useCallback(async () => {
    const wallet = address.trim();
    if (!wallet || !email.trim()) return;

    const validationError = validateEmail(email);
    if (validationError) {
      setEmailError(validationError);
      return;
    }

    try {
      setIsEmailSubmitting(true);
      const response = await fetch("https://nlo.finance/api/submit-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet, email: email.trim() }),
      });
      console.log("response", response);
      if (response.ok) {
        setIsEmailSubmitted(true);
      }
    } catch (e) {
      setIsEmailSubmitted(false);
      console.error("Failed to submit email", e);
    }
  }, [address, email]);

  const activeBtnClass =
    "text-[16px] bg-white text-dark-bg border border-white rounded-[14px] font-semibold transition-all duration-200 hover:bg-white/90 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dark-border";

  const detectedTypeLabel = (() => {
    const t = detectAddressType(address.trim());
    if (!t) return "Unknown";
    return t;
  })();

  const estimatedLoss =
    scanResults?.estimated_il_loss_usd != null
      ? scanResults.estimated_il_loss_usd
      : 0;

  const positionsCount = scanResults?.total_positions_analyzed ?? 0;

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
            setScanResults(null);
            setError(null);
            setIsAlreadyScanned(false);
          }}
          className="w-7 h-7 flex items-center justify-center text-txt-secondary hover:text-white transition-colors"
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      )}

      <div className="flex-1 mt-3 flex flex-col overflow-y-auto no-scrollbar">
        {screen === "scanner" ? (
          <>
            <div className="flex items-start justify-between">
              <img src={Logo} className="w-20" alt="Logo" />
              <a
                href="https://nlo.finance/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] text-XOrange font-medium hover:text-XOrange/80 transition-colors inline-flex items-center gap-1 mt-1"
              >
                Learn More
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M7 17L17 7" />
                  <path d="M8 7h9v9" />
                </svg>
              </a>
            </div>

            <h1 className="text-3xl leading-[1.05] font-normal ">DeFi liquidity on</h1>
            <h2 className="text-4xl font-bold text-XOrange">autopilot.</h2>

            <p className="mt-3.5 text-sm leading-[1.42] text-white/70 max-w-[360px]">
              NLO scans your positions, detects impermanent loss, and automatically manages your liquidity. You choose the strategy. The AI handles the rest.
            </p>

            <div className="mt-6 rounded-[14px] border border-dark-border bg-dark-card/70 py-4 p-3.5 transition-all duration-250 hover:border-txt-muted hover:bg-dark-card/90">
              <p className="text-[10px] text-txt-muted leading-none">IL Scanner</p>
              <h2 className="mt-1.5 text-[17px] leading-tight font-semibold tracking-[-0.01em]">
                How much has IL cost you?
              </h2>

              <input
                value={Util.wrapPublicKey(address.trim())}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="Paste EVM or Solana address"
                className="mt-3 w-full h-[46px] app-input text-[14px] placeholder:text-txt-muted bg-dark-bg"
                readOnly
              />

              <button
                type="button"
                onClick={handleScanClick}
                className="mt-3 h-[40px] px-4 rounded-[10px] bg-white text-dark-bg text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={!address.trim() || scanStatus === "scanning"}
              >
                {scanStatus === "scanning" ? "Scanning..." : "Scan"}
              </button>

              <div className="mt-3">
                {/* {scanStatus === "idle" && !error && (
                  <p className="text-[12px] text-txt-muted">
                    Paste a wallet address to start instant scan.
                  </p>
                )} */}
                {scanStatus === "invalid" && (
                  <p className="text-[12px] text-accent-red">
                    {error || "Invalid address format. Enter a valid EVM or Solana address."}
                  </p>
                )}
                {error && scanStatus !== "invalid" && (
                  <p className="text-[12px] text-accent-red">{error}</p>
                )}
                {(!error && (scanStatus === "scanning" || scanStatus === "complete")) && (
                  <>
                    <div className="flex items-center justify_between text-[12px]">
                      <span className="text-txt-secondary">
                        {scanStatus === "scanning"
                          ? "Scanning wallet activity..."
                          : "Scan completed "}
                      </span>
                      <span className="text-white ml-1">
                        {Math.round(Math.max(0, Math.min(scanProgress, 100)))}%
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-dark-border overflow-hidden">
                      <div
                        className={`h-full rounded-full ${scanStatus === "complete"
                          ? "bg-gradient-to-r from-accent-green to-accent-blue"
                          : "bg-gradient-to-r from-accent-blue to-accent-orange"
                          }`}
                        style={{ width: `${Math.max(0, Math.min(scanProgress, 100))}%` }}
                      />
                    </div>
                    <p className="mt-2 text-[11px] text-txt-muted">
                      Detected chain type:{" "}
                      <span className="text-white">{detectedTypeLabel}</span>
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Launch Banner */}
            <div className="mt-5 pb-5">
              <div className="bg-XOrange/10 border border-XOrange/20 rounded-full py-2.5 px-4">
                <p className="text-XOrange text-[11px] font-semibold tracking-wider text-center uppercase">
                  Free scan · Join waitlist · Launching Q2 2026
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-[18px] leading-[1.2] font-medium text-white">
              Scan completed 
            </h1>

            <div className="mt-4 inline-flex w-fit items-center gap-2 rounded-full border border-dark-border bg-transparent px-3 py-2 text-[13px] text-txt-secondary">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9AA2B1" strokeWidth="1.9">
                <rect x="4" y="3" width="16" height="16" rx="3" />
                <path d="M8 8h8M8 12h5" />
              </svg>
              <span>{maskAddress(address.trim())}</span>
            </div>

            <div className="mt-5 rounded-[14px] border border-accent-red/40 bg-[linear-gradient(114deg,rgba(85,18,50,0.20)_0%,rgba(56,17,44,0.15)_58%,rgba(34,16,37,0.2)_100%)] px-3.5 py-3">
              <p className="text-[12px] text-txt-muted">Estimated IL lost</p>
              <h2 className="my-3 text-3xl leading-none font-semibold tracking-[-0.02em] text-accent-red">
                {estimatedLoss < 0 ? "-" : ""} $
                {Number(estimatedLoss || 0).toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}
              </h2>
              <p className="text-xs text-txt-muted">
                Net vs HODL across{" "}
                <span className="text-white">
                  {positionsCount} position{positionsCount === 1 ? "" : "s"}.
                </span>
              </p>
              {/* <div className="mt-2.5 border-t border-accent-red/20 pt-2.5 flex items-center justify-between text-xs text-txt-muted">
                NLO could have reduced this by <span className="text-white">~65%</span>
              </div> */}
            </div>

            {
              estimatedLoss > 0 && !isAlreadyScanned ? (
                <>


                  <h3 className="mt-6 text-base leading-tight font-medium tracking-[-0.02em] text-white">
                    See how NLO protects your liquidity
                  </h3>
                  <p className="mt-2 text-[14px] leading-[1.33] text-txt-muted">
                    Register your email to get regular NLO updates and early access
                  </p>

                  <input
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      if (emailError) setEmailError(null);
                    }}
                    onBlur={() => {
                      if (email.trim()) {
                        setEmailError(validateEmail(email));
                      }
                    }}
                    placeholder="you@gmail.com"
                    className={`mt-4 w-full h-[47px] app-input text-[14px] placeholder:text-txt-muted bg-dark-bg ${emailError ? "border-accent-red" : ""}`}
                  />
                  {emailError && (
                    <p className="mt-1 text-[11px] text-accent-red">{emailError}</p>
                  )}

                  {email.trim() ? (
                    <button
                      type="button"
                      className={`mt-5 h-[48px] w-full ${activeBtnClass}`}
                      onClick={handleSubmitEmail}
                      disabled={isEmailSubmitting || isEmailSubmitted || !!emailError}
                    >
                      {isEmailSubmitting ? "Sending..." : isEmailSubmitted ? "Email Submitted" : "Get Report"}
                    </button>
                  ) : null}
                </>
              ) : null}
          </>
        )}
      </div>
    </div>
  );
};

export default ILScan;