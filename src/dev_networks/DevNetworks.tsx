import { ArrowLeftIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AppContext } from "../Auth.guard";
import { Logger } from "@util/Logger.util";
import { ExtensionStorage } from "@util/ExtensionStorage.util";
const DevNetworks = () => {
  const appContext = useContext(AppContext);
  const rpc = appContext?.virtualMachine.activeNetwork.rpc;
  const environments = appContext?.virtualMachine.activeNetwork.environment;
  const navigate = useNavigate();

  async function changeEnvironment(rpc: string) {
    try {
      if (!appContext) {
        throw "Appcontext not set.";
      }
      await ExtensionStorage.set("activeEnvironment", rpc);
      appContext.changeActiveNetwork({
        ...appContext.virtualMachine.activeNetwork,
      });
      navigate(-1);
    } catch (error) {
      Logger.error(error);
    }
  }

  return (
    <div className="w-[375px] h-[600px] mx-auto overflow-y-auto px-4 py-5 relative flex flex-col">
      <div className="text-lg font-semibold text-XBlue rounded-3xl flex items-center mb-5 text-center">
        <button className="me-4" type="button" onClick={() => navigate(-1)}>
          <ArrowLeftIcon className="w-5 h-5 " />
        </button>
        Select Networks
      </div>
      <div className="flex-grow-[1] overflow-y-auto">
        {Object.entries(environments || {}).map((environment) => (
          <div
            className="flex items-center justify-between gap-5 px-5 py-3 rounded-full cursor-pointer hover:bg-XLightBlue bg-XLightBlue mb-3"
            title={environment[1].rpc}
            onClick={() => changeEnvironment(environment[1].rpc)}
          >
            <h4 className="text-sm font-semibold text-slate-700 flex items-center">
              <span className="w-8 h-8 me-3 overflow-hidden inline-block">
                <img src={appContext?.virtualMachine.activeNetwork.icon} className="max-w-full" alt="L1X Icon" />
              </span>
              <div className="flex-col">
                <p className="text-ellipsis overflow-hidden whitespace-nowrap w-[200px]">
                  {appContext?.virtualMachine.activeNetwork.symbol}&nbsp;
                  {environment[0]}
                </p>
                <p className="text-xs text-ellipsis overflow-hidden whitespace-nowrap w-[200px]">
                  {environment[1].rpc}
                </p>
              </div>
            </h4>
            {rpc == environment[1].rpc && (
              <CheckCircleIcon className="w-5 h-5 text-green-500" />
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400">
        Switching to a test network is meant for testing purposes only. Please
        be aware that tokens on the Testnet networks do not hold any monetary
        value.
      </p>
    </div>
  );
};

export default DevNetworks;
