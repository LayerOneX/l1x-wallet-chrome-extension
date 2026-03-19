// import VirtualMachineDropdown from "@components/VirtualMachineDropdown";
import { useNavigate } from "react-router-dom";
import { FormEvent, useContext, useEffect, useState } from "react";
// import VirtualMachine from "@virtual_machines/VirtualMachine";
import VirtualMachineFactory from "@factory/VirtualMachine.factory";
import { AppContext } from "../../../Auth.guard";
import classNames from "classnames";
import Spinner from "@components/Spinner";
import Swal from "sweetalert2";
import { XCheckCircleIconHtml } from "@components/XCheckCircleIconHtml";
import { XCircleIconHtml } from "@components/XCircleIconHtml";
import { ExtensionStorage } from "@util/ExtensionStorage.util";
import PageHeader from "@ui/PageHeader";

const CreateAccount = () => {
  const appContext = useContext(AppContext);
  const navigate = useNavigate();
  // const [virtualMachine, setVirtualMachine] = useState<VirtualMachine | null>(
  //   null
  // );
  const [accountName, setAccountName] = useState("");
  const [loader, setLoader] = useState(false);
  const [wallets, setWallets] = useState<IXWalletAccount[]>([]);
  const disableFormSubmit =
    !accountName.trim() || loader;

  useEffect(() => {
    if (appContext?.virtualMachine) {
      listWallets();
    }
  }, [appContext?.virtualMachine]);

  async function listWallets() {
    const storage = await ExtensionStorage.get("wallets");
    if (storage) {
      const { ACTIVE, ...wallets } = storage;
      setWallets(Object.values(wallets).flat());
    }
  }

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
      setLoader(true);
      if (!accountName.trim()) {
        throw {
          errorMessage:
            "Invalid account name. Please try with valid account name.",
        };
      }
      if (wallets.find((el) => el.accountName == accountName)) {
        throw {
          errorMessage:
            "Account name already exists. Please try with different account name.",
        };
      }

      const EVMVm = VirtualMachineFactory.createVirtualMachine("EVM", "");
      const L1XVm = VirtualMachineFactory.createVirtualMachine("L1X", "");

      // const account = await virtualMachine?.createAccount(accountName);
      const l1xAccount = await L1XVm.createAccount(accountName);
      const evmAccount = await EVMVm.createAccount(accountName);
     
      if (!evmAccount || !l1xAccount) {
        throw {
          errorMessage: "Failed to create account.",
        };
      }
      Swal.fire({
        iconHtml: XCheckCircleIconHtml,
        title: "Success",
        text: "Account created successfully",
        customClass: {
          icon: "no-border",
        },
      });
      navigate("/");
    } catch (error: any) {
      Swal.fire({
        iconHtml: XCircleIconHtml,
        title: "Failed",
        text: error?.errorMessage || "Failed to create account. Please try again.",
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
      if (e.key === "Enter" && !disableFormSubmit) {
        e.preventDefault();
        (e.currentTarget as HTMLFormElement).requestSubmit();
      }
    }}>
      <div className="app-frame mx-auto bg-dark-bg flex flex-col">
        <PageHeader title="Create New Account" />

        <div className="flex-1 overflow-y-auto px-5">
          <div className="mb-4">
            <label className="text-txt-muted text-[10px] uppercase tracking-wider mb-2 block">
              Account Name
            </label>
            <input
              type="text"
              placeholder="Enter Account Name"
              className="w-full app-input placeholder:text-txt-muted"
              value={accountName}
              onChange={(event) => {
                if (event.target.value.length <= 50) {
                  setAccountName(event.target.value);
                }
              }}
              maxLength={50}
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
              "w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
            )}
            disabled={disableFormSubmit}
            type="submit"
          >
            Submit {loader && <Spinner />}
          </button>
        </div>
      </div>
    </form>
  );
};

export default CreateAccount;
