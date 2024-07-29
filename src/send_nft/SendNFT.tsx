import { ChevronDown, X } from "react-feather";
import classNames from "classnames";
import Spinner from "../components/Spinner";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react";
import { CheckIcon } from "@heroicons/react/24/outline";
import { FormEvent, useContext, useEffect, useState } from "react";
import AccountListDropdown from "../components/AccountListDropdown";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppContext } from "../Auth.guard";
import { isAddress } from "ethers";
import { v4 as uuidv4 } from "uuid";
import Swal from "sweetalert2";
import { XCircleIconHtml } from "../components/XCircleIconHtml";

const SendNFT = () => {
  const appContext = useContext(AppContext);
  const navigate = useNavigate();
  const [searchPrams] = useSearchParams();
  const [nftlist, setNftList] = useState<INFT[]>([]);
  const [selectedNFT, setSelectedNFT] = useState<INFT>();
  const [loader, setLoader] = useState(false);
  const [receiverAddress, setReveiverAddress] = useState("");
  const validReceiverAddress = isAddress(receiverAddress);
  const disableSubmit =
    loader ||
    !selectedNFT ||
    !selectedNFT.collectionAddress ||
    !selectedNFT.tokenId ||
    !receiverAddress ||
    !validReceiverAddress;

  useEffect(() => {
    listNFT();
  }, [appContext?.virtualMachine]);

  useEffect(() => {
    const tokenId = searchPrams.get("tokenId");
    if (nftlist.length && tokenId) {
      const selectedNft = nftlist.find(
        (el) => tokenId && el.tokenId == tokenId
      );
      setSelectedNFT(selectedNft || nftlist[0]);
    }
  }, [nftlist, searchPrams]);

  async function listNFT() {
    try {
      const list = (await appContext?.virtualMachine.listNFT()) || [];
      setNftList(list);
      setSelectedNFT(list[0]);
    } catch (error) {
      // alert("Failed to fetch collection list. Please try again.");
      Swal.fire({
        iconHtml: XCircleIconHtml,
        title: "Failed",
        text: "Failed to fetch collection list. Please try again.",
        customClass: {
          icon: "no-border",
        },
      });
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    try {
      event.preventDefault();
      setLoader(true);
      if (!appContext?.virtualMachine) {
        throw new Error("Account not found!");
      }
      const transactionId = uuidv4();
      const transaction: ITransferNFT = {
        id: transactionId,
        timestamp: Date.now(),
        type: "transfer-nft",
        from: appContext?.publicKey || "",
        to: receiverAddress,
        amount: 1,
        source: "extension",
        collectionAddress: selectedNFT?.collectionAddress || "",
        tokenId: selectedNFT?.tokenId || "",
        networkType: appContext?.virtualMachine.networkType,
        chainId: appContext.virtualMachine.activeNetwork.chainId.toString(),
        rpc: appContext.virtualMachine.activeNetwork.rpc,
        feeLimit: 100000 as any
      };
      appContext?.virtualMachine.initiateTransaction(transaction);
    } catch (error: any) {
      Swal.fire({
        iconHtml: XCircleIconHtml,
        title: "Failed",
        text:
          error?.errorMessage ||
          "Failed to initiate transaction. Please try again.",
        customClass: {
          icon: "no-border",
        },
      });
    } finally {
      setLoader(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="w-[375px] h-[600px] mx-auto overflow-y-auto px-4 py-5 relative flex flex-col">
        <div className="flex-grow-[1]">
          <div className="text-lg font-semibold text-XBlue rounded-3xl flex items-center justify-between mb-5 text-center">
            Send NFT
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
            <Listbox value={selectedNFT} onChange={setSelectedNFT}>
              {({ open }) => (
                <>
                  <div className="relative mt-2">
                    <ListboxButton className="w-full px-4 py-3  border border-slate-300 rounded-md outline-none text-sm">
                      <span className="flex items-center">
                        {selectedNFT && (
                          <img
                            src={selectedNFT?.icon}
                            alt=""
                            className="h-5 w-5 flex-shrink-0 rounded-full"
                          />
                        )}
                        <span className="ml-3 block truncate">
                          {selectedNFT?.name || "Select NFT"}
                        </span>
                      </span>
                      <span className="pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-2">
                        <ChevronDown
                          className="h-5 w-5 text-gray-400"
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
                      <ListboxOptions className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                        {nftlist.map((nft) => (
                          <ListboxOption
                            key={nft.tokenId}
                            className={({ focus }) =>
                              classNames(
                                focus ? "bg-slate-100" : "",
                                !focus ? "text-gray-900" : "",
                                "relative cursor-default select-none py-2 pl-3 pr-9 text-sm"
                              )
                            }
                            value={nft}
                          >
                            {({ selected, focus }) => (
                              <>
                                <div className="flex items-center">
                                  <img
                                    src={nft.icon}
                                    alt=""
                                    className="h-5 w-5 flex-shrink-0 rounded-full"
                                  />
                                  <span
                                    className={classNames(
                                      selected
                                        ? "font-semibold"
                                        : "font-normal",
                                      "ml-3 block truncate"
                                    )}
                                  >
                                    {nft.name}
                                  </span>
                                </div>

                                {selected ? (
                                  <span
                                    className={classNames(
                                      focus ? "text-XOrange" : "text-XOrange",
                                      "absolute inset-y-0 right-0 flex items-center pr-4"
                                    )}
                                  >
                                    <CheckIcon
                                      className="h-5 w-5"
                                      aria-hidden="true"
                                    />
                                  </span>
                                ) : null}
                              </>
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
          <div className="relative">
            <input
              type="text"
              placeholder="Paste Destination Wallet Address"
              className="w-full px-4 py-3 pe-9  border border-slate-300 rounded-md outline-none text-sm"
              value={receiverAddress}
              onChange={(e) => setReveiverAddress(e.target.value)}
            />
            {receiverAddress && !validReceiverAddress && (
              <small className="text-xs text-red-500 font-medium">
                Please enter valid address
              </small>
            )}
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
            {!loader ? "Send" : <Spinner />}
          </button>
        </div>
      </div>
    </form>
  );
};

export default SendNFT;
