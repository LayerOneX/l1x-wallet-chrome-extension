import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { FormEvent, useState } from "react";
import XWalletLogo from "./../assets/images/L1X_icon.png";
import { ExtensionStorage } from "@util/ExtensionStorage.util";
import classNames from "classnames";
import Swal from "sweetalert2";
import { XCircleIconHtml } from "../components/XCircleIconHtml";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loader, setLoader] = useState(false);
  const [password, setPassword] = useState("");

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
      ExtensionStorage.set("lastWalletUnlocked", Date.now());
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

  return (
    <form onSubmit={handleSubmit}>
      <div className="w-[375px] h-[600px] mx-auto overflow-y-auto px-4 py-5 relative flex flex-col bg-XDarkBlue ">
        <div className="flex-grow-[1]">
          <div className="text-center my-10">
            <div className="w-28 h-28 mx-auto mb-5 ">
              <img src={XWalletLogo} className="rotating" alt="X Wallet Logo" />
            </div>
            <p className="block font-light text-2xl mb-1 text-white">
              {" "}
              Welcome Back to the
            </p>
            <h1 className="mb-3 text-2xl font-semibold text-white">
              The future of crypto wallets
            </h1>
          </div>
          <div className="mb-6 relative mt-10">
            <input
              type={!showPassword ? "password" : "text"}
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
              onClick={() => setShowPassword((prevState) => !prevState)}
              className="inline-flex items-center justify-center p-1 w-9 h-9 text-center absolute right-1 top-1 outline-black"
              type="button"
            >
              {showPassword ? (
                <>
                  <EyeIcon className="w-5 h-5 text-black/80" />
                </>
              ) : (
                <>
                  <EyeSlashIcon className="w-5 h-5 text-black/80" />
                </>
              )}
            </button>
          </div>
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
            Login
          </button>
        </div>
      </div>
    </form>
  );
};

export default Login;
