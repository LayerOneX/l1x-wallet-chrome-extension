import VirtualMachineFactory from "@factory/VirtualMachine.factory";
import { ArrowLeftIcon } from "@heroicons/react/16/solid";
import { ExtensionStorage } from "@util/ExtensionStorage.util";
import { Logger } from "@util/Logger.util";
import { FC, FormEvent, useState } from "react";
import Swal from "sweetalert2";
import { XCircleIconHtml } from "../../components/XCircleIconHtml";

const ImportWallet: FC<{ navigateBack: () => void }> = (props) => {
  const phraseLength = +import.meta.env.VITE_SECRETE_PHASE_LENGTH || 12;
  const [secretPhrase, setSecretPhrase] = useState<string[]>(
    new Array(phraseLength).fill("")
  );
  const disableSubmit = secretPhrase.some((word) => !word.trim());

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const phrase = event.clipboardData
      .getData("text")
      .trim()
      .split(/\s+/)
      .slice(0, phraseLength);
    setSecretPhrase((prevState) => [
      ...phrase,
      ...prevState.slice(phrase.length, prevState.length),
    ]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    try {
      event.preventDefault();
      if (!secretPhrase.join("")) {
        return Swal.fire({
          iconHtml: XCircleIconHtml,
          title: "Failed",
          text: "Invalid mnemonic. Please try with valid mnemonic.",
          customClass: {
            icon: "no-border",
          },
        });
      }
      // store mnemonic
      await ExtensionStorage.set("mnemonic", secretPhrase.join(" "));
      // create account from mnemonic
      const l1xVm = VirtualMachineFactory.createVirtualMachine("L1X", "");
      const evmVm = VirtualMachineFactory.createVirtualMachine("EVM", "");
      const [l1xOk, evmOk] = await Promise.all([
        l1xVm.createAccount("Primary Account"),
        evmVm.createAccount("Primary Account")
      ]);
      if (!l1xOk || !evmOk) {
        throw new Error("Failed to create account. Please try again.");
      }
      return true;
    } catch (error) {
      ExtensionStorage.remove("mnemonic");
      Logger.error(error);
      Swal.fire({
        iconHtml: XCircleIconHtml,
        title: "Failed",
        text: "Failed to import wallet. Please verify your recovery phrase and try again.",
        customClass: {
          icon: "no-border",
        },
      });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="h-full">
      <div className="app-frame mx-auto bg-dark-bg overflow-y-auto px-5 pt-5 pb-6 relative flex flex-col h-full">
        <div className="bg-dark-card border border-dark-border px-4 py-3 text-[14px] font-semibold text-white rounded-full flex items-center mb-5 min-h-[48px]">
          <button
            className="me-4 text-txt-secondary hover:text-white transition-colors"
            onClick={props.navigateBack}
            type="button"
            aria-label="Back"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          Import Phrase
        </div>
        <div className="flex-grow-[1]">
          <p className="text-white text-[14px] leading-6">
            Enter the {phraseLength}-word recovery phrase to import your wallet.
          </p>

          <div className="w-full mt-8 grid grid-cols-3 gap-3">
            {secretPhrase.map((item: string, index) => {
              return (
                <div className="relative" key={`verify_phrase_${index}`}>
                  <input
                    type="text"
                    value={item}
                    onChange={(event) =>
                      setSecretPhrase((prevState) => {
                        const phrase = [...prevState];
                        phrase[index] = event.target.value.trimStart();
                        return phrase;
                      })
                    }
                    onPaste={(event) => handlePaste(event)}
                    autoCapitalize="none"
                    autoCorrect="off"
                    autoComplete="off"
                    spellCheck={false}
                    className="bg-dark-card border border-dark-border text-[12px] px-3 py-2.5 rounded-xl w-full outline-none text-white shadow-[0_8px_20px_rgba(0,0,0,0.25)] focus:border-accent-orange transition-colors"
                  />
                  <span className="text-txt-muted absolute top-1 left-2 text-[9px]">
                    {index + 1}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <button
          className={`flex items-center justify-center text-sm text-black px-3 py-3 rounded-full w-full min-h-[48px] ${
            disableSubmit ? "bg-white/60 cursor-not-allowed" : "bg-white"
          }`}
          disabled={disableSubmit}
        >
          Submit
        </button>
      </div>
    </form>
  );
};

export default ImportWallet;
