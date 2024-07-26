import { X } from "react-feather";
import VirtualMachineDropdown from "../components/VirtualMachineDropdown";
import { useNavigate } from "react-router-dom";
import { FormEvent, useContext, useEffect, useState } from "react";
import VirtualMachine from "@virtual_machines/VirtualMachine";
import VirtualMachineFactory from "@factory/VirtualMachine.factory";
import { AppContext } from "../Auth.guard";
import classNames from "classnames";
import Spinner from "../components/Spinner";
import Swal from "sweetalert2";
import { XCheckCircleIconHtml } from "../components/XCheckCircleIconHtml";
import { XCircleIconHtml } from "../components/XCircleIconHtml";
import { ExtensionStorage } from "@util/ExtensionStorage.util";

const CreateAccount = () => {
  const appContext = useContext(AppContext);
  const navigate = useNavigate();
  const [virtualMachine, setVirtualMachine] = useState<VirtualMachine | null>(
    null
  );
  const [accountName, setAccountName] = useState("");
  const [loader, setLoader] = useState(false);
  const [wallets, setWallets] = useState<IXWalletAccount[]>([]);
  const disableFormSubmit =
    !accountName.trim() || !virtualMachine || loader;

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
      const account = await virtualMachine?.createAccount(accountName);
      if (!account) {
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
        text: error?.errorMessage || "Failed to create form. Please try again.",
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
            Create New Account
            <button
              className="w-7 h-7 flex items-center justify-center bg-slate-100 rounded-full"
              type={"button"}
              onClick={() => navigate(-1)}
            >
              <X className="w-5 h-5 " />{" "}
            </button>
          </div>

          <div className="mb-3 relative">
            <input
              type="text"
              placeholder="Enter Account Name "
              className="w-full px-4 py-3  border border-slate-300 rounded-md outline-none text-sm"
              value={accountName}
              onChange={(event) => {
                if (event.target.value.length <= 50) {
                  setAccountName(event.target.value);
                }
              }}
              maxLength={50}
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
            Submit {loader && <Spinner />}
          </button>
        </div>
      </div>
    </form>
  );
};

export default CreateAccount;
