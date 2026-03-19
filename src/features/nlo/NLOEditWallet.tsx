import { useContext, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PageHeader from "@ui/PageHeader";
import { AppContext } from "../../Auth.guard";

const NLOEditWallet = () => {
  const navigate = useNavigate();
  const appContext = useContext(AppContext);
  const [params] = useSearchParams();
  const returnTo = params.get("return") || "";
  const returnId = params.get("id") || "";
  const initial =
    params.get("address") ||
    sessionStorage.getItem("nloDestinationWallet") ||
    appContext?.publicKey ||
    "";

  const [address, setAddress] = useState(initial);

  const suggestions = useMemo(() => {
    const list = [
      appContext?.publicKey,
      "0x1e9259414503C92E097f7c86Af2468F19c51135",
      "0xf0d3499b3f68fca4e8e8f1a7d9c0b1e2f3a4b5c6",
    ].filter(Boolean) as string[];
    return Array.from(new Set(list));
  }, [appContext?.publicKey]);

  const isValid = address.trim().length >= 12;

  function handleSave() {
    if (!isValid) return;
    sessionStorage.setItem("nloDestinationWallet", address.trim());
    if (returnTo === "withdraw") {
      navigate("/withdraw");
      return;
    }
    if (returnTo === "exit") {
      navigate(`/exit-position/${returnId || "p1"}`);
      return;
    }
    navigate(-1);
  }

  return (
    <div className="app-frame mx-auto bg-dark-bg flex flex-col">
      <PageHeader title="Destination Wallet" />

      <div className="flex-1 px-5 overflow-y-auto">
        <div className="app-card p-4 mb-4">
          <label className="text-txt-muted text-[10px] uppercase tracking-wider mb-1 block">
            Wallet Address
          </label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter or paste address"
            className="app-input w-full text-[12px] font-mono"
          />
          <p className="text-txt-muted text-[11px] mt-2">
            Funds will be sent to this address. Double-check before saving.
          </p>
        </div>

        <div className="mb-3">
          <p className="text-txt-muted text-[10px] uppercase tracking-wider mb-2">
            Saved Wallets
          </p>
          <div className="space-y-2">
            {suggestions.map((wallet) => (
              <button
                key={wallet}
                onClick={() => setAddress(wallet)}
                className={`w-full text-left bg-dark-card border rounded-2xl px-4 py-3 ${
                  address === wallet ? "border-accent-blue/50" : "border-dark-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm font-mono truncate">
                    {wallet}
                  </span>
                  {address === wallet && (
                    <span className="text-accent-blue text-[10px]">
                      Selected
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 pb-5">
        <button
          className={`w-full py-3.5 rounded-xl text-sm font-medium ${
            isValid
              ? "bg-white text-dark-bg hover:bg-gray-100"
              : "bg-dark-card border border-dark-border text-txt-muted cursor-not-allowed"
          }`}
          disabled={!isValid}
          onClick={handleSave}
        >
          Save Wallet
        </button>
      </div>
    </div>
  );
};

export default NLOEditWallet;
