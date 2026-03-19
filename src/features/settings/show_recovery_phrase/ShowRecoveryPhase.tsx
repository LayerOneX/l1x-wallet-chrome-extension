import {
  CheckBadgeIcon,
  EyeIcon,
  EyeSlashIcon,
  ShieldExclamationIcon,
} from "@heroicons/react/24/outline";
import { FormEvent, useState } from "react";
import Spinner from "@components/Spinner";
import { Copy, Check } from "react-feather";
import { Tooltip } from "react-tooltip";
import { ExtensionStorage } from "@util/ExtensionStorage.util";
import { PasswordHash } from "@util/PasswordHash.util";
import { XCircleIconHtml } from "@components/XCircleIconHtml";
import Swal from "sweetalert2";
import PageHeader from "@ui/PageHeader";

const ShowRecoveryPhase = () => {
  const phraseLength = +import.meta.env.VITE_SECRETE_PHASE_LENGTH || 12;
  const [password, setPassword] = useState("");
  const [recoveryPhrase, setRecoveryPhrase] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loader, setLoader] = useState(false);
  const [copied, setCopied] = useState(false);

  async function validatePassword() {
    try {
      const credentials = await ExtensionStorage.get("login");
      if (!credentials?.password) {
        throw {
          errorMessage: "Invalid password. Please try with valid password.",
        };
      }
      const isValid = await PasswordHash.verify(password, credentials.password);
      if (!isValid) {
        throw {
          errorMessage: "Invalid password. Please try with valid password.",
        };
      }
      return true;
    } catch (error: any) {
      throw {
        errorMessage:
          error?.errorMessage ||
          "Failed to validate password. Please try again.",
      };
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ): Promise<void> {
    try {
      event.preventDefault();
      setLoader(true);
      const validPassword = await validatePassword();
      if (!validPassword) {
        throw {
          errorMessage: "Invalid password. Please try with valid password.",
        };
      }
      const passPhrase = await ExtensionStorage.get("mnemonic");
      setRecoveryPhrase(passPhrase || "");
    } catch (error: any) {
      Swal.fire({
        iconHtml: XCircleIconHtml,
        title: "Failed",
        text: error.errorMessage || "Failed to verify password. Please try again.",
        customClass: { icon: "no-border" },
      });
    } finally {
      setLoader(false);
    }
  }

  function copyPhrase() {
    if (!recoveryPhrase) return;
    navigator.clipboard.writeText(recoveryPhrase);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const phraseWords = recoveryPhrase ? recoveryPhrase.split(" ") : [];
  const isPhraseVisible = phraseWords.length > 0;

  return (
    <form onSubmit={handleSubmit} className="h-full">
      <div className="app-frame mx-auto bg-dark-bg flex flex-col h-full relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top,rgba(255,106,46,0.12),transparent_68%)]" />
        <PageHeader title="Show Recovery Phrase" />

        <div className="flex-1 overflow-y-auto px-5 pb-5">
          <div className="wallet-hero p-5 relative overflow-hidden">
            <div className="absolute -right-10 -top-12 h-28 w-28 rounded-full bg-accent-orange/10 blur-2xl" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-dark-border bg-dark-surface/80 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-txt-secondary">
                <ShieldExclamationIcon className="h-3.5 w-3.5 text-accent-orange" />
                Sensitive data
              </div>
              <h2 className="mt-4 text-[22px] font-semibold leading-[1.1] tracking-[-0.03em] text-white">
                {isPhraseVisible ? "Recovery phrase revealed" : "Verify before revealing"}
              </h2>
              <p className="mt-2 text-[13px] leading-5 text-txt-muted max-w-[320px]">
                {isPhraseVisible
                  ? "Store these words offline and in order. Anyone with this phrase can take full control of your wallet."
                  : "Confirm with your password to reveal the wallet’s recovery phrase locally on this device."}
              </p>

              <div className="mt-4 flex items-center gap-2">
                <div className="rounded-full border border-dark-border bg-dark-surface px-3 py-1.5 text-[11px] font-medium text-white">
                  {phraseLength} words
                </div>
                <div className="rounded-full border border-dark-border bg-dark-surface px-3 py-1.5 text-[11px] font-medium text-txt-secondary">
                  Local only
                </div>
              </div>
            </div>
          </div>

          <div className="app-card mt-4 rounded-[20px] p-4">
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${
                  isPhraseVisible
                    ? "border-accent-green/20 bg-accent-green/10"
                    : "border-accent-orange/20 bg-accent-orange/10"
                }`}
              >
                {isPhraseVisible ? (
                  <CheckBadgeIcon className="h-4.5 w-4.5 text-accent-green" />
                ) : (
                  <ShieldExclamationIcon className="h-4.5 w-4.5 text-accent-orange" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-white">
                  {isPhraseVisible ? "Keep this private" : "Security warning"}
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-txt-muted">
                  {isPhraseVisible
                    ? "Do not screenshot, sync, or share these words. Prefer writing them down and storing them somewhere only you can access."
                    : "Never share your Secret Recovery Phrase. Anyone with access to it can drain your wallet and recover your accounts."}
                </p>
              </div>
            </div>
          </div>

          {!isPhraseVisible ? (
            <div className="app-card mt-4 rounded-[20px] p-4">
              <label className="mb-2 block text-[10px] uppercase tracking-[0.18em] text-txt-muted">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password to reveal phrase"
                  className="h-[52px] w-full rounded-[14px] border border-dark-border bg-dark-surface px-4 pr-11 text-sm text-white outline-none transition-colors placeholder:text-txt-muted focus:border-accent-orange"
                  value={password}
                  maxLength={100}
                  onChange={(event) => {
                    if (event.target.value.length <= 100) {
                      setPassword(event.target.value);
                    }
                  }}
                />
                <button
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-txt-muted transition-colors hover:text-white"
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeIcon className="h-5 w-5" />
                  ) : (
                    <EyeSlashIcon className="h-5 w-5" />
                  )}
                </button>
              </div>

              <p className="mt-3 text-[11px] leading-5 text-txt-muted">
                Your recovery phrase is decrypted only after password verification.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <div className="app-card relative rounded-[20px] p-4">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[14px] font-semibold text-white">
                      Secret recovery phrase
                    </p>
                    <p className="mt-1 text-[12px] text-txt-muted">
                      Verify every word and keep the order unchanged.
                    </p>
                  </div>
                  <button
                    className="flex h-10 min-w-10 items-center justify-center gap-2 rounded-full border border-dark-border bg-dark-surface px-3 text-[12px] font-medium text-txt-secondary transition-all hover:border-accent-orange/40 hover:text-white"
                    onClick={copyPhrase}
                    type="button"
                    data-tooltip-id="copy-tooltip-click"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 text-accent-green" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span>Copy</span>
                      </>
                    )}
                    {copied && (
                      <Tooltip
                        className="font-normal !bg-dark-surface !text-white shadow-lg !opacity-100 border border-dark-border !text-[12px]"
                        id="copy-tooltip-click"
                        content="Copied!"
                        defaultIsOpen={true}
                        afterShow={() =>
                          setTimeout(() => setCopied(false), 1000)
                        }
                        events={["click"]}
                      />
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {phraseWords.map((word, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-dark-border bg-dark-surface px-3 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.12)]"
                    >
                      <span className="block text-[10px] font-medium text-txt-muted">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="mt-1 block truncate text-[13px] font-semibold text-white">
                        {word}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>

        {!recoveryPhrase && (
          <div className="px-5 pb-5">
            <button
              className={`w-full rounded-[14px] py-3.5 text-sm font-semibold transition-all ${
                loader || !password
                  ? "bg-dark-card border border-dark-border text-txt-muted cursor-not-allowed"
                  : "btn-primary hover:shadow-lg hover:shadow-accent-orange/20"
              }`}
              type="submit"
              disabled={loader || !password}
            >
              {loader ? <Spinner /> : "Show Recovery Phrase"}
            </button>
          </div>
        )}
      </div>
    </form>
  );
};

export default ShowRecoveryPhase;
