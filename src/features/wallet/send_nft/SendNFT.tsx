import { ChevronDown } from "react-feather";
import classNames from "classnames";
import Spinner from "@components/Spinner";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react";
import { CheckIcon } from "@heroicons/react/24/outline";
import { FormEvent, useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AppContext } from "../../../Auth.guard";
import { isAddress } from "ethers";
import { v4 as uuidv4 } from "uuid";
import Swal from "sweetalert2";
import { XCircleIconHtml } from "@components/XCircleIconHtml";
import PageHeader from "@ui/PageHeader";
import brokenNft from "@assets/images/image-broken.svg";

const SendNFT = () => {
  const appContext = useContext(AppContext);
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
      Swal.fire({
        iconHtml: XCircleIconHtml,
        title: "Failed",
        text: "Failed to fetch collection list. Please try again.",
        customClass: { icon: "no-border" },
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
      };
      appContext?.virtualMachine.initiateTransaction(transaction);
    } catch (error: any) {
      Swal.fire({
        iconHtml: XCircleIconHtml,
        title: "Failed",
        text:
          error?.errorMessage ||
          "Failed to initiate transaction. Please try again.",
        customClass: { icon: "no-border" },
      });
    } finally {
      setLoader(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="app-frame mx-auto bg-dark-bg overflow-y-auto flex flex-col">
        <PageHeader title="Send NFT" />

        <div className="flex-1 px-4">
          {/* NFT preview */}
          {selectedNFT && (
            <div className="flex flex-col items-center mt-4 mb-6">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-dark-surface border border-dark-border mb-3">
                <img
                  src={selectedNFT?.icon || brokenNft}
                  className="w-full h-full object-cover"
                  alt={selectedNFT?.name}
                />
              </div>
              <h2 className="text-white text-sm font-semibold">
                {selectedNFT?.name || "Select NFT"}
              </h2>
            </div>
          )}

          {/* NFT selector */}
          <div className="mb-4 relative">
            <label className="text-txt-muted text-[10px] uppercase tracking-wider mb-2 block">
              Select NFT
            </label>
            <Listbox value={selectedNFT} onChange={setSelectedNFT}>
              {({ open }) => (
                <div className="relative">
                  <ListboxButton className="w-full px-4 py-3 bg-dark-card border border-dark-border rounded-xl outline-none text-sm text-white">
                    <span className="flex items-center">
                      {selectedNFT && (
                        <img
                          src={selectedNFT?.icon || brokenNft}
                          alt=""
                          className="h-5 w-5 flex-shrink-0 rounded"
                        />
                      )}
                      <span className="ml-3 block truncate">
                        {selectedNFT?.name || "Select NFT"}
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
                      {nftlist.map((nft) => (
                        <ListboxOption
                          key={nft.tokenId}
                          className={({ focus }) =>
                            classNames(
                              focus ? "bg-dark-card" : "",
                              "relative cursor-default select-none py-2 pl-3 pr-9 text-sm text-white"
                            )
                          }
                          value={nft}
                        >
                          {({ selected }) => (
                            <>
                              <div className="flex items-center">
                                <img
                                  src={nft.icon || brokenNft}
                                  alt=""
                                  className="h-5 w-5 flex-shrink-0 rounded"
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

                              {selected && (
                                <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-XOrange">
                                  <CheckIcon
                                    className="h-5 w-5"
                                    aria-hidden="true"
                                  />
                                </span>
                              )}
                            </>
                          )}
                        </ListboxOption>
                      ))}
                    </ListboxOptions>
                  </Transition>
                </div>
              )}
            </Listbox>
          </div>

          {/* Receiver address */}
          <div>
            <label className="text-txt-muted text-[10px] uppercase tracking-wider mb-2 block">
              To Wallet
            </label>
            <input
              type="text"
              placeholder="Enter or paste address"
              className="w-full bg-dark-card border border-dark-border rounded-xl px-4 py-3 text-white text-sm placeholder:text-txt-muted outline-none focus:border-txt-muted"
              value={receiverAddress}
              onChange={(e) => setReveiverAddress(e.target.value)}
            />
            {receiverAddress && !validReceiverAddress && (
              <p className="text-accent-red text-xs mt-1">
                Please enter a valid address
              </p>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="px-4 pb-5 mt-5">
          <button
            className={`w-full py-3.5 rounded-xl text-sm font-medium ${
              disableSubmit
                ? "bg-dark-card border border-dark-border text-txt-muted cursor-not-allowed"
                : "bg-white text-dark-bg hover:bg-gray-100"
            }`}
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
