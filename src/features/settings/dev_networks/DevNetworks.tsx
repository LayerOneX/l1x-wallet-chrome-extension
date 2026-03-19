import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AppContext } from "../../../Auth.guard";
import { Logger } from "@util/Logger.util";
import { ExtensionStorage } from "@util/ExtensionStorage.util";
import PageHeader from "@ui/PageHeader";
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
    <div className="app-frame mx-auto bg-dark-bg flex flex-col">
      <PageHeader title="Select Networks" />
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {Object.entries(environments || {}).map((environment) => (
          <button
            key={environment[0]}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl cursor-pointer bg-dark-card border border-dark-border hover:bg-dark-surface mb-3 text-left"
            title={environment[1].rpc}
            onClick={() => changeEnvironment(environment[1].rpc)}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-9 h-9 overflow-hidden rounded-full bg-dark-surface flex items-center justify-center">
                <img src={appContext?.virtualMachine.activeNetwork.icon} className="max-w-full" alt="L1X Icon" />
              </span>
              <div className="min-w-0">
                <p className="text-white text-sm font-medium text-ellipsis overflow-hidden whitespace-nowrap max-w-[220px]">
                  {appContext?.virtualMachine.activeNetwork.symbol}&nbsp;
                  {environment[0]}
                </p>
                <p className="text-[11px] text-txt-muted text-ellipsis overflow-hidden whitespace-nowrap max-w-[220px]">
                  {environment[1].rpc}
                </p>
              </div>
            </div>
            {rpc == environment[1].rpc && (
              <CheckCircleIcon className="w-5 h-5 text-accent-green" />
            )}
          </button>
        ))}
      </div>
      <p className="text-[11px] text-txt-muted px-5 pb-5">
        Switching to a test network is meant for testing purposes only. Please
        be aware that tokens on the Testnet networks do not hold any monetary
        value.
      </p>
    </div>
  );
};

export default DevNetworks;
