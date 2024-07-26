import { ChevronDown, X } from "react-feather";
import AccountListDropdown from "../components/AccountListDropdown";
import { CheckIcon } from "@heroicons/react/20/solid";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react";
import classNames from "classnames";
import { FormEvent, useContext, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppContext } from "../Auth.guard";
import { isAddress } from "ethers";
import { v4 as uuidv4 } from "uuid";
import Spinner from "../components/Spinner";
import Swal from "sweetalert2";
import { XCircleIconHtml } from "../components/XCircleIconHtml";
import { Util } from "@util/Util";
import PriceLoader from "../components/PriceLoader";
import { toFixedIfNeeded } from "@util/Helper";

const SendToken = () => {
  const appContext = useContext(AppContext);
  const navigate = useNavigate();
  const [searchPrams] = useSearchParams();
  const [tokenList, setTokenList] = useState<IToken[]>([]);
  const [selectedToken, setSelectedToken] = useState<IToken>({} as IToken);
  const [receiverAddress, setReveiverAddress] = useState("");
  const [transferAmount, setTransferAmount] = useState<number>("" as any);
  const [loader, setLoader] = useState(false);
  const [tokenListLoader, setTokenListLoader] = useState(true);
  const validReceiverAddress = isAddress(receiverAddress);
  const ownTransfer =
    Util.removePrefixOx(receiverAddress) ==
    Util.removePrefixOx(appContext?.publicKey || "");
  const disableSubmit =
    !selectedToken ||
    !receiverAddress ||
    !transferAmount ||
    transferAmount > selectedToken.balance ||
    transferAmount <= 0 ||
    !validReceiverAddress ||
    loader ||
    ownTransfer ||
    tokenListLoader;

  useEffect(() => {
    if (appContext?.virtualMachine) {
      let timeoutid = setTimeout(() => {
        fetchTokenList();
      }, 500);
      return () => {
        clearTimeout(timeoutid);
        setSelectedToken({} as any);
      };
    }
  }, [appContext?.virtualMachine]);

  useEffect(() => {
    const symbol = searchPrams.get("symbol");
    if (tokenList.length && symbol) {
      const selectedToken = tokenList.find(
        (el) => symbol && el.symbol == symbol
      );
      setSelectedToken(selectedToken || tokenList[0]);
    }
  }, [tokenList, searchPrams]);

  async function fetchTokenList() {
    try {
      setTokenListLoader(true);
      const list = await appContext?.virtualMachine.listToken();
      setTokenList(list || []);
    } catch (error) {
      // alert("Failed to fetch token list. Please try again.");
      Swal.fire({
        iconHtml: XCircleIconHtml,
        title: "Failed",
        text: "Failed to fetch token list. Please try again.",
        customClass: {
          icon: "no-border",
        },
      });
    } finally {
      setTokenListLoader(false);
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ): Promise<void> {
    try {
      event.preventDefault();
      setLoader(true);
      if (!appContext?.virtualMachine) {
        throw new Error("Account not found.");
      }
      const transactionId = uuidv4();
      const transaction: Transaction = selectedToken?.isNative
        ? {
            id: transactionId,
            timestamp: Date.now(),
            type: "transfer-native-token",
            from: appContext?.publicKey || "",
            to: receiverAddress,
            amount:
              appContext.virtualMachine.convertToDecimals(
                transferAmount,
                selectedToken.decimals
              ) || "",
            source: "extension",
            symbol: selectedToken.symbol,
            networkType: appContext.virtualMachine.networkType,
            chainId: appContext.virtualMachine.activeNetwork.chainId.toString(),
            rpc: appContext.virtualMachine.activeNetwork.rpc
          }
        : {
            id: transactionId,
            timestamp: Date.now(),
            type: "transfer-token",
            from: appContext?.publicKey || "",
            to: receiverAddress,
            tokenAddress: selectedToken?.tokenAddress || "",
            amount:
              appContext.virtualMachine.convertToDecimals(
                transferAmount,
                selectedToken.decimals
              ) || "",
            source: "extension",
            symbol: selectedToken?.symbol || "",
            networkType: appContext.virtualMachine.networkType,
            chainId: appContext.virtualMachine.activeNetwork.chainId.toString(),
            rpc: appContext.virtualMachine.activeNetwork.rpc,
            feeLimit: 100000 as any
          };
      appContext?.virtualMachine.initiateTransaction(transaction);
    } catch (error: any) {
      // alert(error?.errorMessage || "Failed to initiate transaction.");
      Swal.fire({
        iconHtml: XCircleIconHtml,
        title: "Failed",
        text: error?.errorMessage || "Failed to initiate transaction.",
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
            Send
            <button
              className="w-7 h-7 flex items-center justify-center bg-slate-100 rounded-full"
              onClick={() => navigate(-1)}
              type="button"
            >
              <X className="w-5 h-5 " />{" "}
            </button>
          </div>

          {/* Account list */}
          <AccountListDropdown />
          {/* End of account list */}

          <div className="w-ful mb-1 grid grid-cols-2 items-center gap-3 justify-between bg-slate-100 p-4 rounded-lg">
            <div>
              <Listbox value={selectedToken} onChange={setSelectedToken}>
                {({ open }) => (
                  <div className="relative">
                    <ListboxButton className="w-full px-4 py-3 bg-white  border border-slate-300 rounded-md outline-none text-sm">
                      <span className="flex items-center">
                        {tokenListLoader ? (
                          <PriceLoader />
                        ) : (
                          <span className="ml-2 block truncate">
                            {selectedToken?.symbol || "Select Token"}
                          </span>
                        )}
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
                        {tokenList.map((token) => (
                          <ListboxOption
                            key={token.symbol}
                            className={({ focus }) =>
                              classNames(
                                focus ? "bg-slate-100" : "",
                                !focus ? "text-gray-900" : "",
                                "relative cursor-default select-none py-2 pl-3 pr-9 text-sm"
                              )
                            }
                            value={token}
                          >
                            {({ selected, focus }) => (
                              <>
                                <div className="flex items-center text-ellipsis overflow-hidden">
                                  <span
                                    className={classNames(
                                      selected
                                        ? "font-semibold"
                                        : "font-normal",
                                      "ml-2 block truncate"
                                    )}
                                  >
                                    {token.symbol}
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
                )}
              </Listbox>
            </div>
            <div className="text-right flex items-center gap-2">
              <div>
                <h3 className="text-lg font-semibold text-slate-500">
                  <input
                    type="text"
                    className="w-full text-md bg-transparent text-right leading-4 outline-none"
                    placeholder="0.00"
                    value={transferAmount}
                    onChange={(e) => {
                      if (!isNaN(e.target.value as any)) {
                        setTransferAmount(toFixedIfNeeded(e.target.value) as any);
                      }
                    }}
                  />
                </h3>
              </div>
            </div>
          </div>
          <div className="text-right mb-3">
            <span className="text-[10px] leading-2 bg-XLightBlue px-2 py-1 rounded-2xl">
              {tokenListLoader ? (
                <PriceLoader />
              ) : (
                <>
                  <b className="font-semibold">
                    {selectedToken?.balance?.toLocaleString() || 0}&nbsp;
                    {selectedToken.symbol}
                  </b>{" "}
                </>
              )}
              | Available
            </span>
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
            {ownTransfer && (
              <small className="text-xs text-red-500 font-medium">
                Can not transfer to own account.
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
            {loader ? <Spinner /> : "Send"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default SendToken;
