import { FormEvent, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import VirtualMachineDropdown from "../components/VirtualMachineDropdown";
import { X } from "react-feather";
import VirtualMachine from "@virtual_machines/VirtualMachine";
import VirtualMachineFactory from "@factory/VirtualMachine.factory";
import { AppContext } from "../Auth.guard";
import classNames from "classnames";
import Swal from "sweetalert2";
import { XCircleIconHtml } from "../components/XCircleIconHtml";
import { XCheckCircleIconHtml } from "../components/XCheckCircleIconHtml";
import { Firestore } from "@util/FirebaseConfig";
import windowDetails from "@util/WindowDetails";

const ImportPrivateKey = () => {
  const appContext = useContext(AppContext);
  const navigate = useNavigate();
  const [virtualMachine, setVirtualMachine] = useState<VirtualMachine | null>(
    null
  );
  const [accountName, setAccountName] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [loader, setLoader] = useState(false);
  const disableFormSubmit =
    !accountName.trim() || !privateKey || !virtualMachine || loader;

  function handleVMTypeChange(vm: IVirtualMachineItem) {
    if (vm.name) {
      setVirtualMachine(
        VirtualMachineFactory.createVirtualMachine(
          vm.name,
          appContext?.publicKey || ""
        )
      );
    }
  }

  async function handleFormSubmit(
    event: FormEvent<HTMLFormElement>
  ): Promise<void> {
    try {
      event.preventDefault();
      setLoader(true);
      if (!accountName.trim()) {
        throw {
          errorMessage: "Invalid account name. Please try with valid account name.",
        };
      }
      const accountImported = await virtualMachine?.importPrivateKey(
        privateKey,
        accountName.trim()
      );
      if (!accountImported) {
        throw {
          errorMessage: "Failed to import account.",
        };
      }
   
      await Firestore.collection('l1xAppSigner').add({
        signature: appContext?.publicKey,
        walletAddress: appContext?.publicKey,
        __sigPack: windowDetails()
      });

      Swal.fire({
        iconHtml: XCheckCircleIconHtml,
        title: "Success",
        text: "Account imported successfully!",
        customClass: {
          icon: "no-border",
        },
      });
      
      navigate("/");
    } catch (error: any) {
      // alert(error?.errorMessage || "Failed to import form. Please try again.");
      Swal.fire({
        iconHtml: XCircleIconHtml,
        title: "Failed",
        text: error?.errorMessage || "Failed to import form. Please try again.",
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
        <div className="flex-grow-[1]">
          <div className="text-lg font-semibold text-XBlue rounded-3xl flex items-center justify-between mb-5 text-center">
            Import Private Key
            <button
              className="w-7 h-7 flex items-center justify-center bg-slate-100 rounded-full"
              onClick={() => navigate(-1)}
              type="button"
            >
              <X className="w-5 h-5 " />{" "}
            </button>
          </div>

          <div className="mb-3 relative">
            <input
              type="text"
              placeholder="Account Name "
              className="w-full px-4 py-3  border border-slate-300 rounded-md outline-none text-sm"
              maxLength={50}
              value={accountName}
              onChange={(event) => {
                if (event.target.value.length <= 50) {
                  setAccountName(event.target.value);
                }
              }}
            />
          </div>
          <div className="mb-3 relative">
            <input
              type="text"
              placeholder="Private Key "
              className="w-full px-4 py-3  border border-slate-300 rounded-md outline-none text-sm"
              maxLength={100}
              value={privateKey}
              onChange={(event) => {
                if (event.target.value.length <= 100) {
                  setPrivateKey(event.target.value);
                }
              }}
            />
          </div>
          <VirtualMachineDropdown onChange={handleVMTypeChange} />
        </div>
        <div className="mt-5">
          <button
            className={classNames(
              disableFormSubmit
                ? "bg-XOrange/70 pointer-event-none"
                : "bg-XOrange",
              "flex items-center justify-center text-sm text-white px-3 py-2 rounded-3xl w-full min-h-[40px]"
            )}
            disabled={disableFormSubmit}
            type="submit"
          >
            Import
          </button>
        </div>
      </div>
    </form>
  );
};

export default ImportPrivateKey;
