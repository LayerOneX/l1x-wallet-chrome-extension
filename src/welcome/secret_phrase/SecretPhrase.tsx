import {
  ArrowLeftIcon,
  DocumentDuplicateIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/16/solid";
import { useEffect, useState } from "react";
import { SecretPhraseHelper } from "./secretPhrase.helper";
import Swal from "sweetalert2";
import { XCircleIconHtml } from "../../components/XCircleIconHtml";

const SecretPhrase = (props: ITermsAndConditionsProps) => {
  const phraseLength = +import.meta.env.VITE_SECRETE_PHASE_LENGTH || 12;
  const originalCopyText = "Copy Seed Phrase";
  const [secretPhrase, setSecretPhrase] = useState(
    new Array(phraseLength).fill("")
  );
  const [showPhrase, setShowPhrase] = useState(false);
  const [copyButtonText, setCopyButtonText] = useState(originalCopyText);
  const [disableNextButton, setDisableNextButton] = useState(true);

  useEffect(() => {
    generateSecretPhrase();
  }, []);

  useEffect(() => {
    if (copyButtonText == "Copied!") {
      setTimeout(() => {
        setCopyButtonText(originalCopyText);
      }, 2000);
    }
  }, [copyButtonText]);

  function navigateNext() {
    const validphraselength = secretPhrase.filter(
      (el) => el?.trim()?.length > 0
    ).length;
    let validPhrase = validphraselength == phraseLength;
    !validPhrase
      ? // alert("Invalid phrase. Please try again.")
        Swal.fire({
          iconHtml: XCircleIconHtml,
          title: "Failed",
          text: "Invalid phrase. Please try again.",
          customClass: {
            icon: "no-border",
          },
        })
      : props.setForm((prevState) => ({
          ...prevState,
          secretPhrase: secretPhrase,
        }));
  }

  function generateSecretPhrase() {
    try {
      const phrase = SecretPhraseHelper.generateMnemonic();
      setSecretPhrase(phrase);
    } catch (error) {
      // alert(error);
      Swal.fire({
        iconHtml: XCircleIconHtml,
        title: "Failed",
        text: "Failed to generate secret phrase. Please try again.",
        customClass: {
          icon: "no-border",
        },
      });
    }
  }

  function navigateBack() {
    props.setForm((prevState) => ({
      ...prevState,
      termsAccepted: false,
    }));
  }

  function copyPhrase() {
    navigator.clipboard.writeText(secretPhrase.join(" "));
    setCopyButtonText("Copied!");
    setDisableNextButton(false);
  }

  return (
    <div className="app-frame mx-auto bg-dark-bg flex flex-col px-5 pt-5 pb-6">
      <button
        className="bg-dark-card border border-dark-border text-white rounded-full h-12 px-4 flex items-center gap-3 text-[14px] font-semibold mb-5 hover:bg-dark-surface transition-colors duration-200"
        onClick={navigateBack}
      >
        <ArrowLeftIcon className="w-5 h-5 text-txt-secondary" />
        Secret Phrase
      </button>

      <div className="flex-1">
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3">
          <p className="text-yellow-400 text-[13px] leading-5">
            <span className="font-bold">⚠</span> Save your{" "}
            <span className="font-semibold">Secret Recovery Phrase (SRP)</span>{" "}
            somewhere safe.{" "}
            <span className="font-bold">Never share it with anyone.</span>{" "}
            It gives full access to your wallet, funds, and accounts.
          </p>
        </div>

        <div
          className={`w-full mt-6 grid grid-cols-3 gap-3 transition-all duration-300 ${
            !showPhrase ? "blur-sm" : ""
          }`}
        >
          {secretPhrase.map((item: string, index) => {
            return (
              <div className="relative" key={`${item}_${index}`}>
                <input
                  type="text"
                  value={item}
                  readOnly
                  className="bg-dark-card border border-dark-border text-[11px] px-3 py-2.5 rounded-xl w-full outline-none text-white shadow-[0_8px_20px_rgba(0,0,0,0.25)]"
                />
                <span className="text-white/30 absolute top-1 left-2 text-[9px]">
                  {index + 1}
                </span>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-5">
          <button
            onClick={() => setShowPhrase((prevState) => !prevState)}
            className="flex items-center justify-center gap-2 text-[12px] bg-white/5 border border-white/10 text-white px-3 py-2.5 rounded-full w-full hover:bg-white/10 transition-colors duration-200"
          >
            {!showPhrase ? (
              <>
                <EyeIcon className="w-5 h-5 text-white/80" />
                Show Seed Phrase
              </>
            ) : (
              <>
                <EyeSlashIcon className="w-5 h-5 text-white/80" />
                Hide Seed Phrase
              </>
            )}
          </button>
          <button
            className={`flex items-center justify-center gap-2 text-[12px] px-3 py-2.5 rounded-full w-full transition-colors duration-200 ${
              showPhrase
                ? "bg-white/5 border border-white/10 text-white hover:bg-white/10"
                : "bg-white/5 border border-white/10 text-white/30 cursor-not-allowed"
            }`}
            onClick={copyPhrase}
            disabled={!showPhrase}
          >
            <DocumentDuplicateIcon className="w-5 h-5" />
            {copyButtonText}
          </button>
        </div>
      </div>

      <button
        className={`flex items-center justify-center text-sm font-semibold text-white px-3 py-4 rounded-2xl w-full transition-all duration-200 ${
          disableNextButton
            ? "bg-XOrange/40 cursor-not-allowed"
            : "bg-XOrange hover:brightness-110 shadow-lg shadow-XOrange/20"
        }`}
        disabled={disableNextButton}
        onClick={navigateNext}
      >
        Next
      </button>
    </div>
  );
};

export default SecretPhrase;
