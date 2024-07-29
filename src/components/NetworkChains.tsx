import { memo, useContext } from "react";
import { AppContext } from "../Auth.guard";
import classNames from "classnames";

const NetworkChains = memo(() => {
  const appContext = useContext(AppContext);
  return (
    appContext?.virtualMachine &&
    appContext.virtualMachine.chains.map((chain) => (
      <button
        className={classNames(
          appContext.virtualMachine.activeNetwork &&
            chain.symbol != appContext.virtualMachine.activeNetwork.symbol
            ? "opacity-30"
            : "",
          "w-6 h-6 flex items-center justify-center"
        )}
        type="button"
        onClick={() => appContext.changeActiveNetwork(chain)}
        title={chain.name}
      >
        <img src={chain.icon} className="w-full" />{" "}
      </button>
    ))
  );
});

export default NetworkChains;
