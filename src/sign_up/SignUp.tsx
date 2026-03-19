import { CheckIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { EyeIcon } from "@heroicons/react/24/outline";
import { ExtensionStorage } from "@util/ExtensionStorage.util";
import { PasswordHash } from "@util/PasswordHash.util";
import { FormEvent, useState } from "react";
import Spinner from "../components/Spinner";
import { XCircleIconHtml } from "../components/XCircleIconHtml";
import Swal from "sweetalert2";


const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  });
  const [loader, setLoader] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const validateForm = () => {
    let valid = true;
    const newError: typeof errors = {};

    if (!form.password || !form.password.trim()) {
      newError.password = "Password is required.";
      valid = false;
    }

    if (
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#!@#$%^&*()`\-\+={}|~\\\/<>,.:;]).{8,}$/.test(
        form.password.trim()
      )
    ) {
      newError.password =
        "Use an 8+ character password with uppercase, lowercase letters, digits, and a special character.";
      valid = false;
    } else if (form.password?.length > 18) {
      newError.password = "Maximum 18 characters allowed for password.";
      valid = false;
    }

    if (form.password.trim() != form.confirmPassword.trim()) {
      newError.confirmPassword = "Passwords do not match.";
      valid = false;
    }

    setErrors(newError);
    return valid;
  };

  async function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    try {
      event.preventDefault();
      setLoader(true);
      const validInput = await validateForm();
      if (!validInput) {
        return;
      }
      const hashedPassword = await PasswordHash.hash(form.password);
      const saveCredentials = await ExtensionStorage.set("login", {
        email: "",
        password: hashedPassword,
      });
      if (!saveCredentials) {
        throw {
          errorMessage: "Failed to save password. Please try again.",
        };
      }
      return true;
    } catch (error: any) {
      Swal.fire({
        iconHtml: XCircleIconHtml,
        title: "Failed",
        text: error?.errorMessage || "Failed to save password.",
        customClass: { icon: "no-border" },
      });
    } finally {
      setLoader(false);
    }
  }

  return (
    <form onSubmit={handleFormSubmit}>
      <div className="app-frame mx-auto overflow-y-auto px-5 py-5 relative flex flex-col bg-dark-bg">
        <h1 className="text-white text-xl font-bold text-center mb-2">
          Create Password
        </h1>
        <p className="text-white/40 text-xs text-center mb-6">
          This password will be used to unlock your wallet.
        </p>

        <div className="flex-1">
          <div className="mb-3">
            <input
              type="password"
              placeholder="Password"
              className="w-full bg-dark-card border border-dark-border rounded-xl px-4 py-3 text-white text-sm placeholder:text-txt-muted outline-none focus:border-XOrange/50 focus:ring-1 focus:ring-XOrange/20 transition-colors duration-200"
              value={form.password}
              onChange={(event) => {
                if (event.target.value.length <= 100) {
                  setForm((prev) => ({
                    ...prev,
                    password: event.target.value,
                  }));
                }
              }}
            />
            {errors.password && (
              <p className="text-accent-red text-xs mt-1">{errors.password}</p>
            )}
          </div>

          <div className="mb-3 relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm Password"
              className="w-full bg-dark-card border border-dark-border rounded-xl px-4 py-3 pr-10 text-white text-sm placeholder:text-txt-muted outline-none focus:border-XOrange/50 focus:ring-1 focus:ring-XOrange/20 transition-colors duration-200"
              value={form.confirmPassword}
              onChange={(event) => {
                if (event.target.value.length <= 100) {
                  setForm((prev) => ({
                    ...prev,
                    confirmPassword: event.target.value,
                  }));
                }
              }}
            />
            <button
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-3.5 text-txt-muted hover:text-white transition-colors duration-200"
              type="button"
            >
              {showPassword ? (
                <EyeIcon className="w-5 h-5" />
              ) : (
                <EyeSlashIcon className="w-5 h-5" />
              )}
            </button>
            {errors.confirmPassword && (
              <p className="text-accent-red text-xs mt-1">
                {errors.confirmPassword}
              </p>
            )}
          </div>
        </div>

        <div
          className="flex items-start mb-4 cursor-pointer"
          onClick={() => setTermsAccepted((prev) => !prev)}
        >
          <div className={`w-4 h-4 min-w-[16px] rounded border mt-0.5 flex items-center justify-center transition-colors duration-200 ${termsAccepted
              ? "bg-XOrange border-XOrange"
              : "border-dark-border bg-dark-card"
            }`}>
            {termsAccepted && <CheckIcon className="w-2.5 h-2.5 text-white stroke-[3]" />}
          </div>
          <span className="ml-2 text-xs text-white/50">
            I understand X_Wallet cannot recover this password and agree to the <a href="https://www.wallet.l1x.foundation/terms-conditions" target="_blank" rel="noopener noreferrer" className="text-XOrange hover:underline">
              Terms and Conditions
            </a>.
          </span>
        </div>

        <button
          className={`w-full py-4 rounded-2xl text-sm font-semibold transition-all duration-200 ${loader || !termsAccepted
              ? "bg-XOrange/40 text-white cursor-not-allowed"
              : "bg-XOrange text-white hover:brightness-110 shadow-lg shadow-XOrange/20"
            }`}
          disabled={loader || !termsAccepted}
          type="submit"
        >
          {loader ? <Spinner /> : "Continue"}
        </button>
      </div>
    </form>
  );
};

export default SignUp;
