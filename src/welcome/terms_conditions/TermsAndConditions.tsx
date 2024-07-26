import { Checkbox } from "@headlessui/react";
import { CheckIcon } from "@heroicons/react/16/solid";
import { Link } from "react-router-dom";
import futureWalletAnimation from "@assets/images/future-crypto.gif";
import layeronexLogoSmall from "@assets/images/l1x-icon.png";
import { useState } from "react";
import ManifestJSON from "../../../manifest.json";

const TermsAndConditions = (props: ITermsAndConditionsProps) => {
  const [termsAccepted, setTermsAccepted] = useState(false);
  function submitForm() {
    if (!termsAccepted) {
      return;
    }
    props.setForm((prevState) => ({
      ...prevState,
      termsAccepted: true,
    }));
  }

  return (
    <div className="text-white w-[375px] h-[600px] mx-auto overflow-y-auto bg-XDarkBlue p-5 relative">
      <div className="text-center mt-5">
        <div className="">
          <img
            src={futureWalletAnimation}
            className="max-w-40 mx-auto mb-4"
            alt="Future Wallet Animation"
          />
        </div>
        <p className="block font-light text-2xl mb-1"> Welcome to</p>
        <h1 className="mb-3 text-2xl font-semibold">
          The future of crypto wallets
        </h1>

        <div className="w-full mt-16  mx-auto">
          <div className="flex justify-center text-center mb-5">
            <Checkbox
              checked={termsAccepted}
              onChange={(event) => setTermsAccepted(event)}
              className="group block size-4 min-w-[16px] rounded border bg-white data-[checked]:bg-blue-700 data-[checked]:border-blue-700 cursor-pointer"
            >
              <CheckIcon />
            </Checkbox>
            <span className="text-white ms-2 text-xs ">
              I agree to X Wallet
              <Link
                to="https://wallet.l1x.foundation/terms-of-service"
                target="_blank"
                className="text-white text-xs underline ms-1"
              >
                Terms and Conditions.
              </Link>
            </span>
          </div>
          <div className="mx-auto max-w-60">
            <button
              className="bg-XOrange text-white  px-5 py-2 text-sm rounded-lg w-full mb-3 hover:bg-white hover:text-XOrange"
              disabled={!termsAccepted}
              onClick={submitForm}
            >
              Create New Account{" "}
            </button>

            <button
              className="bg-white text-black  px-5 py-2 text-sm rounded-lg w-full hover:bg-white hover:text-XOrange"
              onClick={() => props.importWallet()}
            >
              Import Existing Wallet
            </button>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between px-5 py-3 bg-white/10 absolute bottom-0 left-0 w-full">
        <span className="text-[10px] font-light">V {ManifestJSON.version}</span>
        <span className="text-[10px] font-light flex items-center">
          Powered by{" "}
          <img src={layeronexLogoSmall} className="w-5 h-5 mx-1" alt="logo" />{" "}
          LayerOneX
        </span>
      </div>
    </div>
  );
};

export default TermsAndConditions;
