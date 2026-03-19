import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react";
import { useContext, useEffect, useState } from "react";
import { ChevronDown } from "react-feather";
import NetworkChains from "./NetworkChains";
import { ExtensionStorage } from "@util/ExtensionStorage.util";
import classNames from "classnames";
import { CheckIcon } from "@heroicons/react/16/solid";
import { AppContext } from "../Auth.guard";

const AccountListDropdown = () => {
  const appContext = useContext(AppContext);
  const [wallets, setWallets] = useState<IXWalletAccount[]>([]);
  const [activeWallet, setActiveWallet] = useState<IXWalletAccount | null>(
    null
  );

  useEffect(() => {
    listWallets();
  }, []);

  useEffect(() => {
    if (activeWallet && activeWallet.publicKey != appContext?.publicKey) {
      appContext?.changeActiveAccount(activeWallet);
    }
  }, [activeWallet]);

  async function listWallets() {
    const storage = await ExtensionStorage.get("wallets");
    if (storage) {
      const { ACTIVE, ...wallets } = storage;
      const allWallets = Object.values(wallets).flat();
      const hidden = (await ExtensionStorage.get("hiddenWallets")) || [];
      const visible = allWallets.filter(
        (wallet) => !hidden.includes(wallet.publicKey)
      );
      setWallets(visible);
      if (ACTIVE && !hidden.includes(ACTIVE.publicKey)) {
        setActiveWallet(ACTIVE);
      } else {
        setActiveWallet(visible[0] || null);
      }
    }
  }

  return (
    <div className="w-full relative bg-dark-card border border-dark-border p-4 rounded-xl mb-4">
      <div className="mb-3 relative">
        <Listbox value={activeWallet} onChange={setActiveWallet}>
          {({ open }) => (
            <>
              <div className="relative mt-2">
                <ListboxButton className="w-full px-4 py-3 bg-dark-surface border border-dark-border rounded-xl outline-none text-sm text-white">
                  <span className="flex items-center">
                    <img
                      src={activeWallet?.icon}
                      alt=""
                      className="h-5 w-5 flex-shrink-0 rounded-full"
                    />
                    <span className="ml-3 block truncate">
                      {activeWallet?.accountName}
                    </span>
                  </span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-2">
                    <ChevronDown
                      className="h-5 w-5 text-txt-muted"
                      aria-hidden="true"
                    />
                  </span>
                </ListboxButton>

                <Transition
                  show={open}
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <ListboxOptions className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-xl bg-dark-surface border border-dark-border py-1 text-base shadow-lg focus:outline-none sm:text-sm">
                    {wallets.map((wallet) => (
                      <ListboxOption
                        key={wallet.publicKey}
                        className={({ focus }) =>
                          classNames(
                            focus ? "bg-dark-card" : "",
                            "relative cursor-default select-none py-2 pl-3 pr-9 text-sm text-white"
                          )
                        }
                        value={wallet}
                      >
                        <div className="flex items-center">
                          <img
                            src={wallet.icon}
                            alt=""
                            className="h-5 w-5 flex-shrink-0 rounded-full"
                          />
                          <span
                            className={classNames(
                              activeWallet?.publicKey == wallet.publicKey
                                ? "font-semibold"
                                : "font-normal",
                              "ml-3 block truncate"
                            )}
                          >
                            {wallet.accountName}
                          </span>
                        </div>

                        {activeWallet?.publicKey == wallet.publicKey && (
                          <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-XOrange">
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        )}
                      </ListboxOption>
                    ))}
                  </ListboxOptions>
                </Transition>
              </div>
            </>
          )}
        </Listbox>
      </div>
      <div className="flex align-middle">
        <h6 className="text-xs mb-1 font-semibold ps-2 text-txt-secondary">
          {appContext?.virtualMachine.activeNetwork.name}
        </h6>
      </div>
      <div className="bg-dark-surface border border-dark-border p-2 rounded-full w-full h-10 flex items-center gap-1">
        <NetworkChains />
      </div>
    </div>
  );
};

export default AccountListDropdown;
