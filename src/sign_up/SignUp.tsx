import { CheckIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { EyeIcon } from "@heroicons/react/24/outline";
import { ExtensionStorage } from "@util/ExtensionStorage.util";
import { FormEvent, useState } from "react";
import Spinner from "../components/Spinner";
import { XCircleIconHtml } from "../components/XCircleIconHtml";
import Swal from "sweetalert2";
import { Checkbox } from "@headlessui/react";
import classNames from "classnames";

const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loader, setLoader] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const validateForm = () => {
    let valid = true;
    const newError: typeof errors = {};

    if (!form.email || !form.email.trim()) {
      newError.email = "Email is required.";
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newError.email = "Invalid email address.";
      valid = false;
    }

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
      newError.password = "Max 18 character are allowed for password.";
      valid = false;
    }

    if (form.password.trim() != form.confirmPassword.trim()) {
      newError.confirmPassword = "Password not match.";
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
      const saveCredentials = await ExtensionStorage.set("login", {
        email: form.email,
        password: form.password,
      });
      if (!saveCredentials) {
        throw {
          errorMessage: "Failed to submit form. Please try again.",
        };
      }
      return true;
    } catch (error: any) {
      // alert(error?.errorMessage || "Failed to submit form.");
      Swal.fire({
        iconHtml: XCircleIconHtml,
        title: "Failed",
        text: error?.errorMessage || "Failed to submit form.",
        customClass: {
          icon: "no-border",
        },
      });
    } finally {
      setLoader(false);
    }
  }

  return (
    <form onSubmit={handleFormSubmit}>
      <div className="w-[375px] h-[600px] mx-auto overflow-y-auto px-4 py-5 relative flex flex-col">
        <div className="text-lg font-semibold text-XBlue rounded-3xl flex items-center justify-center mb-5 min-h-[40px] text-center">
          Create Account Password
        </div>
        <div className="flex-grow-[1]">
          <div className="mb-3 relative">
            <input
              type="text"
              placeholder="Email"
              className="w-full px-4 py-3  border border-slate-300 rounded-md outline-none text-sm"
              maxLength={100}
              value={form.email}
              onChange={(event) => {
                if (event.target.value.length <= 100) {
                  setForm((prevState) => ({
                    ...prevState,
                    email: event.target.value,
                  }));
                }
              }}
            />
            {errors.email && (
              <small className="text-xs text-red-500 font-medium">
                {errors.email}
              </small>
            )}
          </div>
          <div className="mb-3 relative">
            <input
              type="password"
              placeholder="Password"
              className="w-full px-4 py-3 pe-9  border border-slate-300 rounded-md outline-none text-sm"
              value={form.password}
              onChange={(event) => {
                if (event.target.value.length <= 100) {
                  setForm((prevState) => ({
                    ...prevState,
                    password: event.target.value,
                  }));
                }
              }}
            />
            {errors.password && (
              <small className="text-xs text-red-500 font-medium">
                {errors.password}
              </small>
            )}
          </div>
          <div className="mb-3 relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm Password"
              className="w-full px-4 py-3 pe-9  border border-slate-300 rounded-md outline-none text-sm"
              value={form.confirmPassword}
              onChange={(event) => {
                if (event.target.value.length <= 100) {
                  setForm((prevState) => ({
                    ...prevState,
                    confirmPassword: event.target.value,
                  }));
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
            {errors.confirmPassword && (
              <small className="text-xs text-red-500 font-medium">
                {errors.confirmPassword}
              </small>
            )}
          </div>
        </div>
        <div className="flex mb-3">
          <Checkbox
            checked={termsAccepted}
            onChange={(event) => setTermsAccepted(event)}
            className="group block size-4 min-w-[16px] rounded border bg-white data-[checked]:bg-blue-700 data-[checked]:border-blue-700 cursor-pointer"
          >
            {termsAccepted && <CheckIcon />}
          </Checkbox>
          <label className="ms-2 text-xs cursor-pointer">
            I understand that XWallet cannot recover this password for me.
          </label>
        </div>
        <button
          className={classNames(
            loader || !termsAccepted
              ? "bg-XOrange/70 pointer-event-none"
              : "bg-XOrange",
            "flex items-center justify-center text-sm text-white px-3 py-2 rounded-3xl w-full min-h-[40px]"
          )}
          disabled={loader || !termsAccepted}
          type="submit"
        >
          Continue {loader && <Spinner />}
        </button>
      </div>
    </form>
  );
};

export default SignUp;
