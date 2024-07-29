import { createContext, useEffect, useRef, useState } from "react";
import { RouteProps } from "react-router-dom";
import Login from "./login/Login";
import AccountCreation from "./welcome/AccountCreation";
import { ExtensionStorage } from "@util/ExtensionStorage.util";
import { Logger } from "@util/Logger.util";
import VirtualMachineFactory from "@factory/VirtualMachine.factory";
import SignUp from "./sign_up/SignUp";
import Spalsh from "./components/Spalsh";
import ProcessTransaction from "./process_transaction";
import Swal from "sweetalert2";
import { XCircleIconHtml } from "./components/XCircleIconHtml";

export const AppContext = createContext<IAuthContext | null>(null);

function AuthGuard(props: IAuthRouteProps & RouteProps) {
  const didMountRef = useRef(false);
  const [splashscreenTime, setSplashscreenTime] = useState(1000);
  const [context, setContext] = useState<IAuthContext | null>(null);
  const [activeAccount, setActiveAccount] = useState<L1XAccounts["ACTIVE"]>();
  const [walletLocked, setWalletLocked] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loader, setLoader] = useState(true);
  const [pendingTransactions, setPendingTransactions] =
    useState<boolean>(false);

  useEffect(() => {
    checkApplicationState();
    chrome.storage.onChanged.addListener(handleStorageChange as any);
    const interval = setInterval(() => {
      if (splashscreenTime > 0) {
        setSplashscreenTime((prevstate) => prevstate - 100);
      }
    }, 100);
    return () => {
      clearInterval(interval);
      chrome.storage.onChanged.removeListener(handleStorageChange as any);
    };
  }, []);

  useEffect(() => {
    if (activeAccount) {
      initializeContext(activeAccount);
    }
  }, [activeAccount]);

  useEffect(() => {
    // make sure this method is call only first time application load
    if (context?.virtualMachine && !didMountRef.current) {
      updateActiveNetwork();
      didMountRef.current = true;
    }
  }, [context?.virtualMachine]);

  async function initializeContext(activeAccount: IXWalletAccount) {
    if (activeAccount) {
      didMountRef.current = false;
      setContext({
        publicKey: activeAccount.publicKey,
        privateKey: activeAccount.privateKey,
        accountName: activeAccount.accountName,
        accountIcon: activeAccount.icon,
        type: activeAccount.type,
        virtualMachine: VirtualMachineFactory.createVirtualMachine(
          activeAccount.type,
          activeAccount.publicKey
        ),
        changeActiveNetwork,
        changeActiveAccount,
      });
    } else {
      setContext(null);
    }
  }

  // make sure this method is call only first time application load
  async function updateActiveNetwork() {
    const activeNetwork = await ExtensionStorage.get("activeNetwork");
    context?.changeActiveNetwork(activeNetwork || context.virtualMachine.activeNetwork);
  }

  async function changeActiveNetwork(this: typeof context, chain: IVMChain) {
    if (!this?.virtualMachine || !chain) {
      return;
    }
    const newInstance = this.virtualMachine.clone();
    await newInstance.changeActiveNetwork(chain);
    setContext((prevState) => {
      return !prevState
        ? prevState
        : {
            ...prevState,
            virtualMachine: newInstance,
          };
    });
    await ExtensionStorage.set("activeNetwork", chain);
  }

  async function changeActiveAccount(
    this: typeof context,
    account: IXWalletAccount
  ) {
    if (
      !this?.virtualMachine ||
      !account ||
      this?.publicKey == account.publicKey ||
      !account.privateKey
    ) {
      return;
    }
    const wallets = (await ExtensionStorage.get("wallets")) || {
      L1X: [],
      EVM: [],
      "NON-EVM": [],
      ACTIVE: null,
    };
    wallets.ACTIVE = account;
    await ExtensionStorage.set("wallets", wallets);
  }

  async function handleStorageChange(
    changes: { [k in keyof IExtensionStorage]: chrome.storage.StorageChange },
    areaName: "sync" | "local" | "managed" | "session"
  ) {
    switch (true) {
      case changes.wallets && changes?.wallets?.newValue && areaName == "local":
        const wallets = await ExtensionStorage.get("wallets");
        if (wallets?.ACTIVE) {
          setActiveAccount({ ...wallets.ACTIVE });
        }
        break;

      case changes.login && changes?.login?.newValue && areaName == "local":
        const login = await ExtensionStorage.get("login");
        if (!login) {
          setIsSignUp(false);
        } else {
          setIsSignUp(login.email.length > 0);
        }
        break;

      case changes.lastWalletUnlocked &&
        changes?.lastWalletUnlocked?.newValue &&
        areaName == "local":
        const lastWalletUnlocked = await ExtensionStorage.get(
          "lastWalletUnlocked"
        );
        if (lastWalletUnlocked) {
          const iswalletunlocked = isUnlocked(+lastWalletUnlocked);
          setWalletLocked(iswalletunlocked);
        } else {
          setWalletLocked(true);
        }
        break;

      case changes.lastWalletUnlocked &&
        changes?.lastWalletUnlocked?.oldValue &&
        areaName == "local":
        setWalletLocked(true);
        break;

      case changes.pendingTransactions &&
        changes.pendingTransactions.newValue &&
        areaName == "local":
        // update pending transaction state
        const pendingTransactions =
          (await ExtensionStorage.get("pendingTransactions")) || [];
        const transactionpending = pendingTransactions?.length > 0;
        setPendingTransactions(transactionpending);
        break;

      default:
        break;
    }
  }

  function isUnlocked(timestamp: number) {
    const FIVE_HOURS_IN_MS =
      import.meta.env.VITE_WALLET_UNLOCK_INTERVAL_MS || 18000000;
    const currentTime = Date.now();
    const givenTime = new Date(timestamp).getTime();

    return currentTime - givenTime >= FIVE_HOURS_IN_MS;
  }

  async function checkApplicationState() {
    try {
      const wallets: L1XAccounts = (await ExtensionStorage.get("wallets")) || {
        L1X: [],
        EVM: [],
        "NON-EVM": [],
        ACTIVE: null,
      };
      const lastWalletUnlocked = await ExtensionStorage.get(
        "lastWalletUnlocked"
      );
      const signUpState = await ExtensionStorage.get("login");
      const pendingTransactions = await ExtensionStorage.get(
        "pendingTransactions"
      );
      if (wallets && wallets?.ACTIVE) {
        setActiveAccount(wallets.ACTIVE);
      } else if (
        wallets.L1X.length > 0 ||
        wallets.EVM.length > 0 ||
        wallets["NON-EVM"].length > 0
      ) {
        setActiveAccount(
          wallets.L1X[0] || wallets.EVM[0] || wallets["NON-EVM"][0]
        );
      }

      if (lastWalletUnlocked) {
        const iswalletunlocked = isUnlocked(+lastWalletUnlocked);
        setWalletLocked(iswalletunlocked);
      }

      if (signUpState?.email) {
        setIsSignUp(true);
      }

      if (pendingTransactions?.length) {
        setPendingTransactions(true);
      }
    } catch (error) {
      Logger.error(error);
      Swal.fire({
        iconHtml: XCircleIconHtml,
        title: "Failed ",
        text: "Failed to access local storage.",
        customClass: {
          icon: "no-border",
        },
      });
    } finally {
      setLoader(false);
    }
  }

  return (
    <>
      {(loader || splashscreenTime > 0) && <Spalsh />}
      <AppContext.Provider value={context}>
        {!activeAccount || !activeAccount?.privateKey ? (
          <AccountCreation />
        ) : !isSignUp ? (
          <SignUp />
        ) : walletLocked ? (
          <Login />
        ) : pendingTransactions ? (
          <ProcessTransaction />
        ) : (
          props.children
        )}
      </AppContext.Provider>
    </>
  );
}

export default AuthGuard;
