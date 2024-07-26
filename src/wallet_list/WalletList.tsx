import { Copy, Edit, X } from "react-feather";
import { CheckCircleIcon } from "@heroicons/react/20/solid";
import { useNavigate } from "react-router-dom";
import { FormEvent, useContext, useEffect, useState } from "react";
import { ExtensionStorage } from "@util/ExtensionStorage.util";
import { Util } from "@util/Util";
import classNames from "classnames";
import { AppContext } from "../Auth.guard";
import { Tooltip } from "react-tooltip";
import { XCircleIconHtml } from "../components/XCircleIconHtml";
import Swal from "sweetalert2";
import { XCheckCircleIconHtml } from "../components/XCheckCircleIconHtml";

const WalletList = () => {
  const navigate = useNavigate();
  const appContext = useContext(AppContext);
  const [wallets, setWallets] = useState<IXWalletAccount[]>([]);
  const [changeNameForAccount, setChangeNameForAccount] = useState("");
  const [newAccountName, setNewAccountName] = useState("");
  const [loader, setLoader] = useState(false);
  const [copied, setCopied] = useState("");
  const disableForm = loader || !newAccountName.trim();

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

  function handleNameChange(
    event: FormEvent<HTMLButtonElement>,
    publicKey: string,
    accountname: string
  ): void {
    event.preventDefault();
    event.stopPropagation();
    setChangeNameForAccount(publicKey);
    setNewAccountName(accountname);
  }

  async function updateAccountName(
    event: MouseEvent,
    account: IXWalletAccount
  ) {
    try {
      event.preventDefault();
      event.stopPropagation();
      setLoader(true);
      if (!newAccountName) {
        throw {
          errorMessage: "Invalid account name.",
        };
      }
      if (
        wallets.findIndex(
          (account) =>
            account.accountName?.toLowerCase() == newAccountName.toLowerCase()
        ) >= 0
      ) {
        throw {
          errorMessage:
            "Account name already exists. Please use different account name.",
        };
      }
      account.accountName = newAccountName;
      await appContext?.virtualMachine.updateAccountName(account);
      Swal.fire({
        iconHtml: XCheckCircleIconHtml,
        title: "Success",
        text: "Account name updated successfully.",
        customClass: {
          icon: "no-border",
        },
      });

      setChangeNameForAccount("");
    } catch (error: any) {
      Swal.fire({
        iconHtml: XCircleIconHtml,
        title: "Failed",
        text:
          error?.errorMessage ||
          "Failed to update account name. Please try again.",
        customClass: {
          icon: "no-border",
        },
      });
    } finally {
      setLoader(false);
    }
  }

  function copyPublickey(event: MouseEvent, data: string) {
    event.preventDefault();
    event.stopPropagation();
    navigator.clipboard.writeText(data);
    setCopied(data);
  }

  return (
    <div
      className="w-[375px] h-[600px] mx-auto overflow-y-auto px-4 py-5 relative flex flex-col"
      onClick={() => setChangeNameForAccount("")}
    >
      <div className="flex-grow-[1]">
        <div className="text-lg font-semibold text-XBlue rounded-3xl flex items-center justify-between mb-5 text-center">
          My Wallets
          <button
            className="w-7 h-7 flex items-center justify-center bg-slate-100 rounded-full"
            onClick={() => navigate(-1)}
          >
            <X className="w-5 h-5 " />{" "}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-5">
          <button
            className="flex items-center justify-center text-sm text-white hover:bg-XBlue bg-XOrange px-3 py-2 rounded-md w-full min-h-[40px]"
            onClick={() => navigate("/import-private-key")}
          >
            {" "}
            Import Private Key
          </button>
          <button
            className="flex items-center justify-center text-sm text-white bg-XBlue hover:bg-XOrange px-3 py-2 rounded-md w-full min-h-[40px]"
            onClick={() => navigate("/create-account")}
          >
            Create Wallet
          </button>
        </div>
        <div className="w-[calc(100%+32px)] h-[380px] overflow-y-auto -mx-4">
          <div className="mx-4 ">
            {wallets.map((wallet) =>
              wallet.publicKey == changeNameForAccount ? (
                <div
                  className={classNames(
                    appContext?.publicKey == wallet.publicKey
                      ? "bg-XLightBlue"
                      : "bg-slate-100",
                    "flex items-center justify-between p-2 rounded-full w-full mb-3 min-h-[56px]"
                  )}
                  onClick={() => {
                    appContext?.changeActiveAccount(wallet);
                    navigate(-1);
                  }}
                >
                  <input
                    type="text"
                    placeholder="Rename"
                    className="w-full px-5 py-2 pe-9 rounded-full outline-none text-sm"
                    value={newAccountName}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onChange={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      if (event.target.value.length <= 30) {
                        setNewAccountName(event.target.value);
                      }
                    }}
                  />
                  <button
                    className={classNames(
                      disableForm || newAccountName == wallet.accountName
                        ? "bg-XOrange/70 pointer-events-none"
                        : "bg-XOrange",
                      "text-xs ms-2 px-4 py-2 text-white rounded-full font-semibold"
                    )}
                    disabled={disableForm || newAccountName == wallet.accountName}
                    onClick={(event: any) => updateAccountName(event, wallet)}
                  >
                    Save
                  </button>
                </div>
              ) : (
                <>
                  <div
                    className={classNames(
                      appContext?.publicKey == wallet.publicKey
                        ? "bg-XLightBlue"
                        : "bg-slate-100",
                      "flex items-center justify-between p-2 rounded-full w-full mb-3 hover:bg-XLightBlue"
                    )}
                    onClick={() => {
                      appContext?.changeActiveAccount(wallet);
                      navigate(-1);
                    }}
                  >
                    <div className="flex items-center">
                      <div className="me-2 w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-slate-100">
                        <img src={wallet.icon} className="w-full h-full" />
                      </div>
                      <div>
                        {changeNameForAccount &&
                        changeNameForAccount == wallet.publicKey ? (
                          <input
                            type="text"
                            value={wallet.accountName}
                            className="outline-none"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                          />
                        ) : (
                          <h4 className="flex items-center w-full font-semibold text-md leading-[18px] mb-1">
                            {wallet.accountName}
                            <button
                              className="cursor-pointer"
                              onClick={(event) =>
                                handleNameChange(
                                  event,
                                  wallet.publicKey,
                                  wallet.accountName
                                )
                              }
                            >
                              <Edit className="w-3 h-3 ms-2 text-XOrange" />
                            </button>
                          </h4>
                        )}
                        <h6 className="font-medium text-[10px] text-slate-400 cursor-pointer">
                          {Util.wrapPublicKey(wallet.publicKey)}
                          <button
                            className="cursor-pointer"
                            data-tooltip-id={wallet.publicKey}
                            onClick={(event: any) =>
                              copyPublickey(event, wallet.publicKey)
                            }
                          >
                            <Copy className="w-3 h-3 ms-2 text-XOrange" />
                          </button>
                          {copied == wallet.publicKey && (
                            <Tooltip
                              className="font-normal !bg-white !text-black shadow-lg !opacity-100 border border-slate-100 !text-[12px]"
                              id={wallet.publicKey}
                              content="Copied!"
                              defaultIsOpen={true}
                              afterShow={() =>
                                setTimeout(() => {
                                  setCopied("");
                                }, 1000)
                              }
                              events={["click"]}
                            />
                          )}
                        </h6>
                      </div>
                    </div>
                    {wallet.publicKey == appContext?.publicKey && (
                      <div className=" me-2">
                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                      </div>
                    )}
                  </div>
                </>
              )
            )}
          </div>
        </div>
      </div>

      <div className="mt-3">
        <p className="text-xs text-slate-400 leading-5">
          EVM Wallets are compatible with the Ethereum Virtual Machine, which
          includes: Ethereum, Binance, Avalanche, Polygon, etc.
        </p>
      </div>
    </div>
  );
};

export default WalletList;
