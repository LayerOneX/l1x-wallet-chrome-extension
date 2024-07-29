import {
  ArrowLeftIcon,
  ExclamationCircleIcon,
  EyeIcon,
  GlobeAsiaAustraliaIcon,
  WalletIcon,
} from "@heroicons/react/24/outline";
import { Globe, HelpCircle, Key, Lock, User } from "react-feather";
import { Link, useNavigate } from "react-router-dom";
import { ExtensionStorage } from "@util/ExtensionStorage.util";
import { useContext, useEffect, useState } from "react";
import { AppContext } from "../Auth.guard";

const Settings = () => {
  const appContext = useContext(AppContext);
  const navigate = useNavigate();
  const [activeEnvironment, setActiveEnvironment] = useState<
    [string, string] | undefined
  >(["", ""]);
  const rpc = appContext?.virtualMachine.activeNetwork.rpc;

  useEffect(() => {
    const env = Object.entries(
      appContext?.virtualMachine.activeNetwork.environment || {}
    ).find((el) => el[1].rpc == rpc);
    setActiveEnvironment(env ? [env[0], env[1].rpc] : undefined);
  }, [rpc]);

  return (
    <div className="w-[375px] h-[600px] mx-auto overflow-y-auto px-4 py-5 relative flex flex-col">
      <div className="text-lg font-semibold text-XBlue rounded-3xl flex items-center mb-5 text-center">
        <button className="me-4" onClick={() => navigate(-1)}>
          <ArrowLeftIcon className="w-5 h-5 " />
        </button>
        Setting
      </div>
      <div className="flex-grow-[1] ">
        <ul className="w-full">
          {activeEnvironment && (
            <li className="w-full ">
              <Link
                to="/select-networks"
                className="flex items-center justify-between gap-3 px-3 py-2 text-sm hover:bg-slate-100 rounded-full"
              >
                <span className="inline-flex items-center whitespace-nowrap">
                  <Globe className="w-5 h-5 min-w-5 me-2 text-XOrange" />{" "}
                  Networks
                </span>
                <span className="text-sm text-blue-500 text-ellipsis overflow-hidden whitespace-nowrap">
                  {" "}
                  ( {appContext?.virtualMachine.activeNetwork.symbol}&nbsp;
                  {activeEnvironment[0]} )
                </span>
              </Link>
            </li>
          )}
          <li className="w-full ">
            <Link
              to="/wallet-list"
              className="flex items-center px-3 py-2 text-sm hover:bg-slate-100 rounded-full"
            >
              <WalletIcon className="w-5 h-5 me-2 text-XOrange" /> Wallet
            </Link>
          </li>
          <li className="w-full ">
            <Link
              to="/recovery-phase"
              className="flex items-center px-3 py-2 text-sm hover:bg-slate-100 rounded-full"
            >
              <EyeIcon className="w-5 h-5 me-2 text-XOrange" /> Show Recovery
              Phrase
            </Link>
          </li>
          <li className="w-full ">
            <Link
              to="/show-private-key"
              className="flex items-center px-3 py-2 text-sm hover:bg-slate-100 rounded-full"
            >
              <Key className="w-5 h-5 me-2 text-XOrange" /> Show Private Key
            </Link>
          </li>
          <li className="w-full ">
            <Link
              to="/identity"
              className="flex items-center px-3 py-2 text-sm hover:bg-slate-100 rounded-full"
            >
              <User className="w-5 h-5 me-2 text-XOrange" /> Identity
            </Link>
          </li>
          {/* <li className="w-full ">
            <Link
              to="https://wallet.l1x.foundation/how-to/claim"
              className="flex items-center px-3 py-2 text-sm hover:bg-slate-100 rounded-full"
              target="_blank"
            >
              <EyeIcon className="w-5 h-5 me-2 text-XOrange" /> How to claim
            </Link>
          </li> */}
          <li
            className="w-full"
            onClick={() => { navigate('/'); ExtensionStorage.remove("lastWalletUnlocked"); }}
          >
            <Link
              to="#"
              className="flex items-center px-3 py-2 text-sm hover:bg-slate-100 rounded-full"
            >
              <Lock className="w-5 h-5 me-2 text-XOrange" /> Lock Account
            </Link>
          </li>
          <li className="w-full ">
            <Link
              to="/connected-sites"
              className="flex items-center px-3 py-2 text-sm hover:bg-slate-100 rounded-full"
            >
              <GlobeAsiaAustraliaIcon className="w-5 h-5 me-2 text-XOrange" />{" "}
              Connected Sites
            </Link>
          </li>
        </ul>
      </div>
      <div className=" ">
        <ul className="w-full">
          <li className="w-full ">
            <Link
              to={"/help-center"}
              className="flex items-center px-3 py-2 text-sm hover:bg-slate-100 rounded-full"
            >
              <HelpCircle className="w-5 h-5 me-2 text-XOrange" /> Help Center
            </Link>
          </li>
          <li className="w-full ">
            <Link
              target="_blank"
              to="https://wallet.l1x.foundation/feedback"
              className="flex items-center px-3 py-2 text-sm hover:bg-slate-100 rounded-full"
            >
              <ExclamationCircleIcon className="w-6 h-6 me-2 text-XOrange" />
              Feedback
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Settings;
