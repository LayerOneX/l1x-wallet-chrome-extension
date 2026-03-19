// import { FormEvent, useContext, useState } from "react";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
// import VirtualMachineDropdown from "@components/VirtualMachineDropdown";
// import VirtualMachine from "@virtual_machines/VirtualMachine";
import VirtualMachineFactory from "@factory/VirtualMachine.factory";
// import { AppContext } from "../../../Auth.guard";
import classNames from "classnames";
import Swal from "sweetalert2";
import { XCircleIconHtml } from "@components/XCircleIconHtml";
import { XCheckCircleIconHtml } from "@components/XCheckCircleIconHtml";
import PageHeader from "@ui/PageHeader";

const ImportPrivateKey = () => {
  // const appContext = useContext(AppContext);
  const navigate = useNavigate();
  // const [virtualMachine, setVirtualMachine] = useState<VirtualMachine | null>(
  //   null
  // );
  const [accountName, setAccountName] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [loader, setLoader] = useState(false);
  const disableFormSubmit =
    !accountName.trim() || !privateKey || loader;

  // function handleVMTypeChange(vm: IVirtualMachineItem) {
  //   if (vm.name) {
  //     setVirtualMachine(
  //       VirtualMachineFactory.createVirtualMachine(
  //         vm.name,
  //         appContext?.publicKey || ""
  //       )
  //     );
  //   }
  // }

  async function handleFormSubmit(
    event: FormEvent<HTMLFormElement>
  ): Promise<void> {
    try {
      event.preventDefault();
      console.log("[ImportPrivateKey] form submitted, accountName:", accountName.trim(), "privateKey length:", privateKey.length);
      setLoader(true);
      if (!accountName.trim()) {
        throw {
          errorMessage: "Invalid account name. Please try with valid account name.",
        };
      }
      const EVMVm = VirtualMachineFactory.createVirtualMachine("EVM", "");
      const L1XVm = VirtualMachineFactory.createVirtualMachine("L1X", "");

      // const accountImported = await virtualMachine?.importPrivateKey(
      //   privateKey,
      //   accountName.trim()
      // );


      const l1xAccount = await L1XVm.importPrivateKey(
        privateKey,
        accountName.trim()
      );

      const evmAccount = await EVMVm.importPrivateKey(
        privateKey,
        accountName.trim()
      );

      if (!evmAccount || !l1xAccount) {
        throw {
          errorMessage: "Failed to import account.",
        };
      }
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
      Swal.fire({
        iconHtml: XCircleIconHtml,
        title: "Failed",
        text: error?.errorMessage || "Failed to import account. Please try again.",
        customClass: {
          icon: "no-border",
        },
      });
    } finally {
      setLoader(false);
    }
  }

  return (
    <form onSubmit={handleFormSubmit} onKeyDown={(e) => {
      if (e.key === "Enter") {
        console.log("[ImportPrivateKey] Enter pressed, disableFormSubmit:", disableFormSubmit);
        if (!disableFormSubmit) {
          e.preventDefault();
          (e.currentTarget as HTMLFormElement).requestSubmit();
        }
      }
    }}>
      <div className="app-frame mx-auto bg-dark-bg flex flex-col">
        <PageHeader title="Import Private Key" />

        <div className="flex-1 overflow-y-auto px-5">
          <div className="mb-4">
            <label className="text-txt-muted text-[10px] uppercase tracking-wider mb-2 block">
              Account Name
            </label>
            <input
              type="text"
              placeholder="Enter Account Name"
              className="w-full app-input placeholder:text-txt-muted"
              maxLength={50}
              value={accountName}
              onChange={(event) => {
                if (event.target.value.length <= 50) {
                  setAccountName(event.target.value);
                }
              }}
            />
          </div>
          <div className="mb-4">
            <label className="text-txt-muted text-[10px] uppercase tracking-wider mb-2 block">
              Private Key
            </label>
            <input
              type="text"
              placeholder="Enter Private Key"
              className="w-full app-input placeholder:text-txt-muted"
              maxLength={100}
              value={privateKey}
              onChange={(event) => {
                if (event.target.value.length <= 100) {
                  setPrivateKey(event.target.value);
                }
              }}
            />
          </div>

          {/* <div className="mb-4">
            <label className="text-txt-muted text-[10px] uppercase tracking-wider mb-2 block">
              Select Network
            </label>
            <VirtualMachineDropdown onChange={handleVMTypeChange} />
          </div> */}
        </div>

        <div className="px-5 pb-5">
          <button
            className={classNames(
              disableFormSubmit
                ? "bg-dark-card border border-dark-border text-txt-muted cursor-not-allowed"
                : "bg-white text-dark-bg hover:bg-gray-100",
              "w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center"
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
