import { useContext, useEffect, useState } from "react";
import { AppContext } from "../../../Auth.guard";
import { QRCodeSVG } from "qrcode.react";
import { Copy } from "react-feather";
import { Tooltip } from "react-tooltip";
import PageHeader from "@ui/PageHeader";
import { ExtensionStorage } from "@util/ExtensionStorage.util";

const Receive = () => {
  const appContext = useContext(AppContext);
  const [copied, setCopied] = useState(false);
  const [accountName, setAccountName] = useState("Account");

  const publicKey = appContext?.publicKey || "";
  const networkName =
    appContext?.virtualMachine?.activeNetwork?.name || "Network";

  useEffect(() => {
    loadAccountName();
  }, []);

  async function loadAccountName() {
    const storage = await ExtensionStorage.get("wallets");
    if (storage?.ACTIVE) {
      setAccountName(storage.ACTIVE.accountName || "Account");
    }
  }

  function copyAddress() {
    navigator.clipboard.writeText(publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="app-frame mx-auto bg-dark-bg flex flex-col">
      <PageHeader title={`Receive / ${networkName}`} />

      <div className="flex-1 px-5 flex flex-col items-center pt-6">
        {/* QR Code */}
        <div className="bg-white rounded-2xl p-4 mb-4">
          <QRCodeSVG
            value={publicKey}
            size={160}
            bgColor="#ffffff"
            fgColor="#000000"
            level="M"
          />
        </div>

        <p className="text-txt-muted text-[12px] mb-6">
          Share QR code to receive tokens / collectibles
        </p>

        {/* Account label */}
        <div className="mb-3">
          <span className="bg-dark-card border border-dark-border text-txt-secondary text-xs px-4 py-1.5 rounded-full">
            {accountName}
          </span>
        </div>

        {/* Full address */}
        <div className="w-full bg-dark-card border border-dark-border rounded-xl px-4 py-3 mb-4">
          <p className="text-white text-xs font-mono text-center break-all leading-5">
            <span className="font-bold">{publicKey.slice(0, 6)}</span>
            {publicKey.slice(6, -5)}
            <span className="font-bold">{publicKey.slice(-5)}</span>
          </p>
        </div>

        {/* Copy button */}
        <button
          onClick={copyAddress}
          className="w-full flex items-center justify-center gap-2 bg-dark-card border border-dark-border text-white text-sm font-medium py-3 rounded-xl hover:bg-dark-surface mb-4"
          data-tooltip-id="copy-receive"
        >
          {copied ? "Copied!" : "Copy Address"}
          <Copy size={14} className="text-txt-muted" />
        </button>
        {copied && (
          <Tooltip
            className="font-normal !bg-dark-surface !text-white shadow-lg !opacity-100 border border-dark-border !text-[12px]"
            id="copy-receive"
            content="Copied!"
            defaultIsOpen={true}
            events={["click"]}
          />
        )}

        {/* Warning */}
        <p className="text-txt-muted text-[11px] text-center leading-4">
          Only send assets on the {networkName} to this address. Sending from
          other networks may result in loss.
        </p>
      </div>
    </div>
  );
};

export default Receive;
