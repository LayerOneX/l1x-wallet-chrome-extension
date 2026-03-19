import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react";
import { FC, useEffect, useState } from "react";
import { ChevronDown } from "react-feather";
import classNames from "classnames";
import { CheckIcon } from "@heroicons/react/16/solid";
import { Config } from "@util/Config.util";

interface IWalletListDropdownProps {
  onChange?: (vm: IVirtualMachineItem) => void;
}

const VirtualMachineDropdown: FC<IWalletListDropdownProps> = (props) => {
  const [selectedVMType, setSelectedVMType] = useState(
    Config.virtualMachinesLists[0]
  );

  useEffect(() => {
    if (props.onChange && typeof props.onChange == "function") {
      props.onChange(selectedVMType);
    }
  }, [selectedVMType]);

  return (
    <div className="mb-3 relative">
      <Listbox value={selectedVMType} onChange={setSelectedVMType}>
        {({ open }) => (
          <>
            <div className="relative mt-0">
              <ListboxButton className="w-full px-4 py-3 bg-dark-card border border-dark-border rounded-xl outline-none text-sm text-white">
                <span className="flex items-center">
                  <img
                    src={selectedVMType.icon}
                    alt=""
                    className="h-5 w-5 flex-shrink-0 rounded-full"
                  />
                  <span className="ml-3 block truncate">
                    {selectedVMType.name}
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
                <ListboxOptions className="absolute z-10 mt-2 max-h-56 w-full overflow-auto rounded-xl bg-dark-card border border-dark-border py-1 text-base shadow-lg focus:outline-none sm:text-sm">
                  {Config.virtualMachinesLists.map((vm) => (
                    <ListboxOption
                      key={vm.id}
                      className={({ focus }) =>
                        classNames(
                          focus ? "bg-dark-surface" : "",
                          "relative cursor-default select-none py-2 pl-3 pr-9 text-sm text-white"
                        )
                      }
                      value={vm}
                    >
                      <div className="flex items-center">
                        <img
                          src={vm.icon}
                          alt=""
                          className="h-5 w-5 flex-shrink-0 rounded-full"
                        />
                        <span
                          className={classNames(
                            vm.name == selectedVMType.name
                              ? "font-semibold"
                              : "font-normal",
                            "ml-3 block truncate"
                          )}
                        >
                          {vm.name}
                        </span>
                      </div>

                      {vm.name == selectedVMType.name && (
                        <span
                          className={classNames(
                            vm.name == selectedVMType.name
                              ? "text-XOrange"
                              : "text-XOrange",
                            "absolute inset-y-0 right-0 flex items-center pr-4"
                          )}
                        >
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
  );
};

export default VirtualMachineDropdown;
