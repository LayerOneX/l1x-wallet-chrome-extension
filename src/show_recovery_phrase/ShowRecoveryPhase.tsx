import {
  ArrowLeftIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import Spinner from "../components/Spinner";
import { Copy } from "react-feather";
import { Tooltip } from "react-tooltip";
import { ExtensionStorage } from "@util/ExtensionStorage.util";
import classNames from "classnames";
import { XCircleIconHtml } from "../components/XCircleIconHtml";
import Swal from "sweetalert2";

const ShowRecoveryPhase = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [recoveryPhrase, setRecoveryPhrase] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loader, setLoader] = useState(false);
  const [copied, setCopied] = useState(false);

  async function validatePassword() {
    try {
      const credentials = await ExtensionStorage.get("login");
      if (credentials?.password != password) {
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
          errorMessage: "Invalid Password. Please try with valid password.",
        };
      }
      const passPhrase = await ExtensionStorage.get("mnemonic");
      setRecoveryPhrase(passPhrase || "");
    } catch (error: any) {
      // alert(error.errorMessage || "Failed to verify login.");
      Swal.fire({
        iconHtml: XCircleIconHtml,
        title: "Failed",
        text: error.errorMessage || "Failed to verify login.",
        customClass: {
          icon: "no-border",
        },
      });
    } finally {
      setLoader(false);
    }
  }

  function copyPhrase() {
    navigator.clipboard.writeText(recoveryPhrase);
    setCopied(true);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="w-[375px] h-[600px] mx-auto overflow-y-auto px-4 py-5 relative flex flex-col">
        <div className="text-lg font-semibold text-XBlue rounded-3xl flex items-center mb-5 text-center">
          <button className="me-4" onClick={() => navigate(-1)} type="button">
            <ArrowLeftIcon className="w-5 h-5 " />
          </button>
          Show Recovery Phase
        </div>
        <div className="flex-grow-[1]">
          <p className="text-sm mb-3">
            <b className="font-semibold">DO NOT SHARE</b> your{" "}
            <b className="font-semibold">Secret Recovery Phase (SRP)</b>. It
            gives full access to your wallet, funds, and accounts.
          </p>
          {!recoveryPhrase ? (
            <div className="mb-3 relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="w-full px-4 py-3 pe-9  border border-slate-300 rounded-md outline-none text-sm"
                value={password}
                maxLength={100}
                onChange={(event) => {
                  if (event.target.value.length <= 100) {
                    setPassword(event.target.value);
                  }
                }}
              />
              <button
                onClick={() => setShowPassword(prevState => !prevState)}
                className="inline-flex items-center justify-center p-1 w-9 h-9 text-center absolute right-1 top-1 outline-black"
                type="button"
              >
                {showPassword ? (
                  <EyeIcon className="w-5 h-5 text-black/80" />
                ) : (
                  <button type="button">
                    <EyeSlashIcon className="w-5 h-5 text-black/80" />
                  </button>
                )}
              </button>
            </div>
          ) : (
            <div className="w-full py-5 px-10 bg-slate-100 rounded-lg mb-3 relative">
              <div className="text-sm  text-center leading-6">
                {recoveryPhrase}
              </div>
              <button
                className="cursor-pointer absolute top-4 right-4"
                onClick={copyPhrase}
                type="button"
              >
                <Copy
                  className="w-4 h-4 text-slate-500"
                  data-tooltip-id="copy-tooltip-click"
                />
                {copied && (
                  <Tooltip
                    className="font-normal !bg-white !text-black shadow-lg !opacity-100 border border-slate-100 !text-[12px]"
                    id="copy-tooltip-click"
                    content="Copied!"
                    defaultIsOpen={true}
                    afterShow={() =>
                      setTimeout(() => {
                        setCopied(false);
                      }, 1000)
                    }
                    events={['click']}
                  />
                )}
              </button>
            </div>
          )}
        </div>

        {!recoveryPhrase && (
          <button
            className={classNames(
              loader || !password
                ? "bg-XOrange/70 pointer-event-none"
                : "bg-XOrange",
              "flex items-center justify-center text-sm text-white px-3 py-2 rounded-3xl w-full min-h-[40px]"
            )}
            type="submit"
            disabled={loader || !password}
          >
            Show {loader && <Spinner />}
          </button>
        )}
      </div>
    </form>
  );
};

export default ShowRecoveryPhase;
