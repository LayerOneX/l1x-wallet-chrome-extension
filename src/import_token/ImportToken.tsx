import classNames from "classnames";
import { FormEvent, useContext, useEffect, useState } from "react";
import { X } from "react-feather";
import { useNavigate } from "react-router-dom";
import Spinner from "../components/Spinner";
import { useDebouncedCallback } from "use-debounce";
import { AppContext } from "../Auth.guard";
import AccountListDropdown from "../components/AccountListDropdown";
import Swal from "sweetalert2";
import { XCheckCircleIconHtml } from "../components/XCheckCircleIconHtml";
import { XCircleIconHtml } from "../components/XCircleIconHtml";

const ImportToken = () => {
  const navigate = useNavigate();
  const appContext = useContext(AppContext);
  const [form, setForm] = useState({
    tokenAddress: "",
    tokenSymbol: "",
    tokenDecimal: 0,
    loader: false,
  });
  const debounce = useDebouncedCallback(fetchTokenDetails, 100);
  const disableSubmit = !form.tokenSymbol || form.loader;

  useEffect(() => {
    resetForm();
  }, [appContext]);

  useEffect(() => {
    if (form.tokenAddress) {
      debounce(form.tokenAddress);
    } else {
      resetForm();
    }
  }, [form.tokenAddress]);

  function resetForm() {
    setForm((prevState) => ({
      ...prevState,
      tokenAddress: "",
      tokenDecimal: 0,
      tokenSymbol: "",
    }));
  }

  async function fetchTokenDetails(tokenAddress: string) {
    try {
      setForm((prevState) => ({
        ...prevState,
        loader: true,
      }));
      const tokenDetails = await appContext?.virtualMachine?.getTokenDetails(
        tokenAddress
      );
      setForm((prevState) => ({
        ...prevState,
        tokenDecimal: tokenDetails?.decimals || 0,
        tokenSymbol: tokenDetails?.symbol || "",
      }));
    } catch (error) {
      setForm((prevState) => ({
        ...prevState,
        tokenDecimal: 0,
        tokenSymbol: "",
      }));
    } finally {
      setForm((prevState) => ({
        ...prevState,
        loader: false,
      }));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    try {
      event.preventDefault();
      setForm((prevState) => ({
        ...prevState,
        loader: true,
      }));
      const tokenImported = await appContext?.virtualMachine?.importToken(
        form.tokenAddress
      );
      if (!tokenImported) {
        throw "Failed to import token. Please try again.";
      }
      // alert("Token imported successfully!");
      Swal.fire({
        iconHtml: XCheckCircleIconHtml,
        title: "Success",
        text: "Token imported successfully!",
        customClass: {
          icon: "no-border",
        },
      });
      navigate("/");
    } catch (error) {
      // alert("Failed to import token. Please try again.");
      Swal.fire({
        iconHtml: XCircleIconHtml,
        title: "Failed",
        text: "Failed to import token. Please try again.",
        customClass: {
          icon: "no-border",
        },
      });
    } finally {
      setForm((prevState) => ({
        ...prevState,
        loader: false,
      }));
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="w-[375px] h-[600px] mx-auto overflow-y-auto px-4 py-5 relative flex flex-col">
        <div className="flex-grow-[1]">
          <div className="text-lg font-semibold text-XBlue rounded-3xl flex items-center justify-between mb-5 text-center">
            Import Token
            <button
              className="w-7 h-7 flex items-center justify-center bg-slate-100 rounded-full"
              onClick={() => navigate(-1)}
              type="button"
            >
              <X className="w-5 h-5 " />{" "}
            </button>
          </div>
          <AccountListDropdown />

          <div className="mb-3 relative">
            {" "}
            <input
              type="text"
              placeholder="Paste Token Address"
              className="w-full px-4 py-3 pe-9  border border-slate-300 rounded-md outline-none text-sm"
              value={form.tokenAddress}
              onChange={(event) =>
                setForm((prevState) => ({
                  ...prevState,
                  tokenAddress: event.target.value,
                }))
              }
            />
          </div>
          <div className="mb-3 relative">
            {" "}
            <input
              type="text"
              placeholder="Token Symbol "
              className="w-full px-4 py-3 pe-9  border border-slate-300 rounded-md outline-none text-sm"
              value={form.tokenSymbol}
              readOnly
            />
          </div>
          <div className="mb-3 relative">
            {" "}
            <input
              type="text"
              placeholder="Token Decimal "
              className="w-full px-4 py-3 pe-9  border border-slate-300 rounded-md outline-none text-sm"
              value={form.tokenDecimal}
              readOnly
            />
          </div>
        </div>
        <div className="mt-5">
          <button
            className={classNames(
              disableSubmit ? "bg-XOrange/70 pointer-event-none" : "bg-XOrange",
              "flex items-center justify-center text-sm text-white px-3 py-2 rounded-3xl w-full min-h-[40px]"
            )}
            disabled={disableSubmit}
            type="submit"
          >
            Import {form.loader && <Spinner />}
          </button>
        </div>
      </div>
    </form>
  );
};
export default ImportToken;
