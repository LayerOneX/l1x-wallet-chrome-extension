import classNames from "classnames";
import { FormEvent, useContext, useEffect, useState } from "react";
import { X } from "react-feather";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../Auth.guard";
import Spinner from "../components/Spinner";
import AccountListDropdown from "../components/AccountListDropdown";
import Swal from "sweetalert2";
import { XCheckCircleIconHtml } from "../components/XCheckCircleIconHtml";
import { XCircleIconHtml } from "../components/XCircleIconHtml";

const ImportNFT = () => {
  const appContext = useContext(AppContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    collectionAddress: "",
    tokenId: "",
    loader: false,
  });
  const disableSubmit = form.loader || !form.collectionAddress || !form.tokenId;

  useEffect(() => {
    resetForm();
  }, [appContext]);

  function resetForm() {
    setForm({
      collectionAddress: "",
      tokenId: "",
      loader: false,
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    try {
      event.preventDefault();
      setForm((prevState) => ({
        ...prevState,
        loader: true,
      }));
      if (!appContext?.virtualMachine) {
        throw {
          errorMessage:
            "Invalid account type. Please select correct account type.",
        };
      }
      const importedNFT = await appContext.virtualMachine.importNFT(
        form.collectionAddress,
        form.tokenId,
        appContext?.publicKey || ""
      );
      if (!importedNFT) {
        throw {
          errorMessage: "Failed to import NFT. Please try again.",
        };
      }
      // alert("NFT imported successfully!");
      Swal.fire({
        iconHtml: XCheckCircleIconHtml,
        title: "Success",
        text: "NFT imported successfully!",
        customClass: {
          icon: "no-border",
        },
      });
      navigate(-1);
    } catch (error: any) {
      // alert(error?.errorMessage || "Failed to import token. Please try again.");
      Swal.fire({
        iconHtml: XCircleIconHtml,
        title: "Failed",
        text:
          error?.errorMessage || "Failed to import token. Please try again.",
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
            Import NFT
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
              placeholder="Paste Collection Address"
              className="w-full px-4 py-3 pe-9  border border-slate-300 rounded-md outline-none text-sm"
              value={form.collectionAddress}
              onChange={(event) =>
                setForm((prevState) => ({
                  ...prevState,
                  collectionAddress: event.target.value,
                }))
              }
            />
          </div>
          <div className="mb-3 relative">
            {" "}
            <input
              type="text"
              placeholder="Enter the token ID "
              className="w-full px-4 py-3 pe-9  border border-slate-300 rounded-md outline-none text-sm"
              value={form.tokenId}
              onChange={(event) =>
                setForm((prevState) => ({
                  ...prevState,
                  tokenId: event.target.value,
                }))
              }
            />
            <span className="text-xs text-gray-700">XWallet supports ERC-721 token standard.</span>
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

export default ImportNFT;
