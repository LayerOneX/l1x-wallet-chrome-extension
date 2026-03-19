import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { FormEvent, useState } from "react";
import Spinner from "@components/Spinner";
import { Copy } from "react-feather";
import { Tooltip } from "react-tooltip";
import { ExtensionStorage } from "@util/ExtensionStorage.util";
import { PasswordHash } from "@util/PasswordHash.util";
import Swal from "sweetalert2";
import { XCircleIconHtml } from "@components/XCircleIconHtml";
import PageHeader from "@ui/PageHeader";

const ShowPrivateKey = () => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [privateKey, setPrivatekey] = useState("");
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
      const wallets = await ExtensionStorage.get("wallets");
      setPrivatekey(wallets?.ACTIVE?.privateKey || "");
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
    navigator.clipboard.writeText(privateKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="app-frame mx-auto bg-dark-bg flex flex-col">
        <PageHeader title="Show Private Key" />

        <div className="flex-1 px-5">
          <p className="text-txt-muted text-[13px] mb-5 leading-5">
            Your private key grants access to the currently active wallet
            address.
          </p>

          {!privateKey ? (
            <div>
              <label className="text-txt-muted text-[10px] uppercase tracking-wider mb-2 block">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  className="w-full bg-dark-card border border-dark-border rounded-xl px-4 py-3 pr-10 text-white text-sm placeholder:text-txt-muted outline-none focus:border-txt-muted"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-txt-muted"
                  type="button"
                >
                  {showPassword ? (
                    <EyeIcon className="w-5 h-5" />
                  ) : (
                    <EyeSlashIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-dark-card border border-dark-border rounded-2xl p-4 relative">
              <div className="text-white text-sm text-center leading-6 break-all pr-6">
                {privateKey}
              </div>
              <button
                className="absolute top-4 right-4 text-txt-muted hover:text-white"
                onClick={copyPhrase}
                type="button"
                data-tooltip-id="copy-tooltip-click"
              >
                <Copy className="w-4 h-4" />
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
          )}
        </div>

        {!privateKey && (
          <div className="px-5 pb-5">
            <button
              className={`w-full py-3.5 rounded-xl text-sm font-medium ${
                loader || !password
                  ? "bg-dark-card border border-dark-border text-txt-muted cursor-not-allowed"
                  : "bg-white text-dark-bg hover:bg-gray-100"
              }`}
              type="submit"
              disabled={loader || !password}
            >
              {loader ? <Spinner /> : "Show"}
            </button>
          </div>
        )}
      </div>
    </form>
  );
};

export default ShowPrivateKey;
