import { Download } from "react-feather";
import L1XIcon from "../../assets/images/L1X_icon.png"

const TermsAndConditions = (props: ITermsAndConditionsProps) => {
  function submitForm() {
    props.setForm((prevState) => ({
      ...prevState,
      termsAccepted: true,
    }));
  }

  return (
    <div className="text-white app-frame mx-auto bg-aurora px-6 pt-12 pb-8 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="mb-8">
          <div className="w-28 h-28 flex items-center justify-center">
            <img src={L1XIcon} alt="X_Wallet Logo" className="w-full h-full rotating drop-shadow-[0_0_30px_rgba(255,106,46,0.15)]" />
          </div>
        </div>

        <p className="text-white/60 text-base font-light tracking-wide mb-2">Welcome to</p>
        <h1 className="text-XOrange text-5xl font-bold tracking-tight mb-4">
          X_Wallet
        </h1>
        <p className="text-white/40 text-sm font-light tracking-widest uppercase">
          Your crypto wallet. Smarter.
        </p>
      </div>

      <div className="space-y-3 mt-8">
        <button
          className="w-full bg-XOrange text-white py-4 rounded-2xl text-sm font-semibold hover:brightness-110 transition-all duration-200 shadow-lg shadow-XOrange/20"
          onClick={submitForm}
        >
          Create Wallet
        </button>
        <button
          className="w-full bg-white/5 border border-white/10 text-white/70 py-4 rounded-2xl text-sm font-medium hover:bg-white/10 hover:text-white transition-all duration-200 flex items-center justify-center gap-2"
          onClick={() => props.importWallet()}
        >
          <Download size={14} />
          Import Wallet
        </button>
      </div>
    </div>
  );
};

export default TermsAndConditions;
