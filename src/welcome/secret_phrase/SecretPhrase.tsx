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
  const originalCopyText = "Copy password";
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
    <div className="w-[375px] h-[600px] mx-auto overflow-y-auto px-4 py-5 relative flex flex-col">
      <div className="bg-XLightBlue px-3 py-2 text-sm font-semibold text-XBlue rounded-3xl flex items-center mb-5 min-h-[40px]">
        <button className="me-4" onClick={navigateBack}>
          <ArrowLeftIcon className="w-5 h-5 " />{" "}
        </button>
        Secret Phrase
      </div>
      <div className="flex-grow-[1]">
        <p className="text-sm">
          <b className="font-semibold">DO NOT SHARE</b> your{" "}
          <b className="font-semibold">Secret Recovery Phase (SRP)</b>. It gives
          full access to your wallet, funds, and accounts.
        </p>

        <div
          className={`w-full my-10 grid grid-cols-3 gap-4 pointer-events-none ${
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
                  className="bg-gray-100 text-xs px-4 py-3 rounded-md w-full outline-none"
                />
                <span className="text-slate-400 absolute top-1 left-1 text-[8px]">
                  {index + 1}
                </span>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setShowPhrase((prevState) => !prevState)}
            className="flex items-center justify-center text-xs bg-gray-100 px-3 py-2 rounded-3xl w-full text-center mb-3"
          >
            {!showPhrase ? (
              <>
                <EyeIcon className="w-6 h-6 text-black/80 me-2" />
                Show Password
              </>
            ) : (
              <>
                <EyeSlashIcon className="w-6 h-6 text-black/80 me-2" />
                Hide Password
              </>
            )}
          </button>
          <button
            className="flex items-center justify-center text-xs bg-gray-100 px-3 py-2 rounded-3xl w-full text-center mb-3"
            onClick={copyPhrase}
          >
            <DocumentDuplicateIcon className="w-6 h-6 text-black/80 me-2" />
            {copyButtonText}
          </button>
        </div>
      </div>

      <button
        className={`flex items-center justify-center text-sm text-white px-3 py-2 rounded-3xl w-full min-h-[40px] ${
          disableNextButton ? "bg-XOrange/70 pointer-event-none" : "bg-XOrange"
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
