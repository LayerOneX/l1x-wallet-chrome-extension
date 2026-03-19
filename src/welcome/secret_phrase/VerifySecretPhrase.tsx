import VirtualMachineFactory from "@factory/VirtualMachine.factory";
import { ArrowLeftIcon } from "@heroicons/react/16/solid";
import { ExtensionStorage } from "@util/ExtensionStorage.util";
import { Logger } from "@util/Logger.util";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { XCircleIconHtml } from "../../components/XCircleIconHtml";

const VerifySecretPhrase = (props: ITermsAndConditionsProps) => {
  const phraseLength = +import.meta.env.VITE_SECRETE_PHASE_LENGTH || 12;
  const [secretPhrase, setSecretPhrase] = useState<string[]>(
    new Array(phraseLength).fill("")
  );
  const [disableSubmit, setDisableSubmit] = useState(true);

  useEffect(() => {
    setDisableSubmit(
      props.form.secretPhrase.join(" ") != secretPhrase.join(" ")
    );
  }, [secretPhrase]);

  function navigateBack() {
    props.setForm((prevState) => ({
      ...prevState,
      secretPhrase: [],
    }));
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const phrase = event.clipboardData.getData("text").split(" ");
    setSecretPhrase((prevState) => [
      ...phrase,
      ...prevState.slice(phrase.length, prevState.length),
    ]);
  }

  async function handleSubmit() {
    try {
      if (props.form.secretPhrase.join(" ") != secretPhrase.join(" ")) {
        return Swal.fire({
          iconHtml: XCircleIconHtml,
          title: "Failed",
          text: "Invalid mnemonic. Please try with valid mnemonic.",
          customClass: {
            icon: "no-border",
          },
        });
      }
      const l1xVm = VirtualMachineFactory.createVirtualMachine(
        "L1X",
        ""
      );
      const evmVm = VirtualMachineFactory.createVirtualMachine(
        "EVM",
        ""
      );
      await ExtensionStorage.set("mnemonic", props.form.secretPhrase.join(" "));

      const l1xOk = await l1xVm.createAccount("Primary Account");
      const evmOk = await evmVm.createAccount("Primary Account");

      if (!evmOk || !l1xOk) {
        throw new Error("Failed to create accounts. Please try again.");
      }
      return true;
    } catch (error) {
      ExtensionStorage.remove("mnemonic");
      props.setForm((prevState) => ({
        ...prevState,
        secretPhraseToVerify: [],
      }));
      Logger.error(error);
      Swal.fire({
        iconHtml: XCircleIconHtml,
        title: "Failed",
        text: "Failed to create wallet. Please try again.",
        customClass: {
          icon: "no-border",
        },
      });
    }
  }

  return (
    <div className="app-frame mx-auto bg-dark-bg overflow-y-auto px-5 pt-5 pb-6 flex flex-col">
      <button
        className="bg-dark-card border border-dark-border text-white rounded-full h-12 px-4 flex items-center gap-3 text-[14px] font-semibold mb-5 hover:bg-dark-surface transition-colors duration-200"
        onClick={navigateBack}
      >
        <ArrowLeftIcon className="w-5 h-5 text-txt-secondary" />
        Verify Phrase
      </button>

      <div className="flex-grow-[1]">
        <p className="text-white/70 text-[14px] leading-6">
          Verify your wallet by entering the recovery phrase you just saved.
        </p>

        <div className="w-full mt-6 grid grid-cols-3 gap-3">
          {secretPhrase.map((item: string, index) => {
            return (
              <div className="relative" key={`verify_phrase_${index}`}>
                <input
                  type="text"
                  value={item}
                  onChange={(event) =>
                    setSecretPhrase((prevState) => {
                      let phrase = [...prevState];
                      phrase[index] = event.target.value;
                      return phrase;
                    })
                  }
                  onPaste={(event) => handlePaste(event)}
                  className="bg-dark-card border border-dark-border text-[12px] px-3 py-2.5 rounded-xl w-full outline-none text-white shadow-[0_8px_20px_rgba(0,0,0,0.25)] focus:border-XOrange/50 focus:ring-1 focus:ring-XOrange/20 transition-colors duration-200"
                />
                <span className="text-white/30 absolute top-1 left-2 text-[9px]">
                  {index + 1}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <button
        className={`flex items-center justify-center text-sm font-semibold text-white px-3 py-4 rounded-2xl w-full transition-all duration-200 ${
          disableSubmit
            ? "bg-XOrange/40 cursor-not-allowed"
            : "bg-XOrange hover:brightness-110 shadow-lg shadow-XOrange/20"
        }`}
        disabled={disableSubmit}
        onClick={handleSubmit}
      >
        Verify & Create Wallet
      </button>
    </div>
  );
};

export default VerifySecretPhrase;
