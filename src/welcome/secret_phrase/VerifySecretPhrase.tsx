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
        // alert("Invalid mnemonic. Please try with valid mnemonic.")
      }
      const virtualMachine = VirtualMachineFactory.createVirtualMachine(
        "L1X",
        ""
      );
      await ExtensionStorage.set("mnemonic", props.form.secretPhrase.join(" "));
      const accountCreated = await virtualMachine.createAccount(
        "Primary Account"
      );
      if (!accountCreated) {
        throw new Error("Failed to create account. Please try again.");
      }
      return true;
    } catch (error) {
      ExtensionStorage.remove("mnemonic");
      props.setForm((prevState) => ({
        ...prevState,
        secretPhraseToVerify: [],
      }));
      Logger.error(error);
      // alert("Failed to store mnemonic.");
      Swal.fire({
        iconHtml: XCircleIconHtml,
        title: "Failed",
        text: "Failed to store mnemonic.",
        customClass: {
          icon: "no-border",
        },
      });
    }
  }

  return (
    <div className="w-[375px] h-[600px] mx-auto overflow-y-auto px-4 py-5 relative flex flex-col">
      <div className="bg-XLightBlue px-3 py-2 text-sm font-semibold text-XBlue rounded-3xl flex items-center mb-5 min-h-[40px]">
        <button className="me-4" onClick={navigateBack}>
          <ArrowLeftIcon className="w-5 h-5 " />
        </button>
        Verify Phrase
      </div>
      <div className="flex-grow-[1]">
        <p className="text-sm">
          Enter the 12-word recovery phrase to import your wallet.
        </p>

        <div className="w-full my-10 grid grid-cols-3 gap-4">
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
                  className="bg-gray-100 text-xs px-4 py-3 rounded-md w-full outline-none"
                />
                <span className="text-slate-400 absolute top-1 left-1 text-[8px]">
                  {index + 1}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <button
        className={`flex items-center justify-center text-sm text-white px-3 py-2 rounded-3xl w-full min-h-[40px] ${
          disableSubmit ? "bg-XOrange/70 pointer-event-none" : "bg-XOrange"
        }`}
        disabled={disableSubmit}
        onClick={handleSubmit}
      >
        Submit
      </button>
    </div>
  );
};

export default VerifySecretPhrase;
