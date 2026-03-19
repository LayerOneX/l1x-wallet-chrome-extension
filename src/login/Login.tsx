import { ArrowRightIcon } from "@heroicons/react/24/solid";
import { FormEvent, useState } from "react";
import { ExtensionStorage } from "@util/ExtensionStorage.util";
import { PasswordHash } from "@util/PasswordHash.util";
import Swal from "sweetalert2";
import { XCircleIconHtml } from "../components/XCircleIconHtml";
import Spinner from "../components/Spinner";
import L1XIcon from "../assets/images/L1X_icon.png";

const Login = () => {
  const [loader, setLoader] = useState(false);
  const [password, setPassword] = useState("");

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
      if (!PasswordHash.isHashed(credentials.password)) {
        const hashed = await PasswordHash.hash(password);
        await ExtensionStorage.set("login", {
          email: credentials.email,
          password: hashed,
        });
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
      ExtensionStorage.set("lastWalletUnlocked", Date.now());
    } catch (error: any) {
      Swal.fire({
        iconHtml: XCircleIconHtml,
        title: "Failed",
        text: error.errorMessage || "Failed to verify login.",
        customClass: { icon: "no-border" },
      });
    } finally {
      setLoader(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="app-frame mx-auto overflow-y-auto px-5 pt-8 pb-6 flex flex-col bg-aurora">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="mb-6">
            <div className="w-28 h-28 flex items-center justify-center">
              <img
                src={L1XIcon}
                alt="X_Wallet"
                className="w-full h-full rotating drop-shadow-[0_0_30px_rgba(255,106,46,0.15)]"
              />
            </div>
          </div>

          <p className="text-white/40 text-xs font-medium uppercase tracking-[0.2em] mb-2">
            Welcome back to
          </p>
          <h1 className="text-white text-5xl font-bold tracking-tight mb-1">
            X<span className="text-XOrange">_</span>Wallet
          </h1>
          <p className="text-white/30 text-[11px] tracking-wide mt-1 mb-8">
            Your crypto wallet. Smarter.
          </p>

          <div className="w-full">
            <input
              type="password"
              placeholder="Enter your password"
              className="w-full h-12 bg-dark-card border border-dark-border rounded-xl px-4 text-sm text-white placeholder:text-txt-muted outline-none focus:border-XOrange/50 focus:ring-1 focus:ring-XOrange/20 transition-colors duration-200"
              value={password}
              maxLength={100}
              onChange={(event) => {
                if (event.target.value.length <= 100) {
                  setPassword(event.target.value);
                }
              }}
            />

            <button
              className={`w-full mt-4 py-4 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${
                loader || !password
                  ? "bg-XOrange/40 text-white cursor-not-allowed"
                  : "bg-XOrange text-white hover:brightness-110 shadow-lg shadow-XOrange/20"
              }`}
              type="submit"
              disabled={loader || !password}
            >
              {loader ? (
                <Spinner />
              ) : (
                <>
                  Unlock
                  <ArrowRightIcon className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default Login;
