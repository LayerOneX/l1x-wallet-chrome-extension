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
import { ensureEVMAccountsForL1X, migrateTransactionChainIds } from "@util/Migration";
import { loadCustomChains } from "@virtual_machines/EVM";

export const AppContext = createContext<IAuthContext | null>(null);

type SafeAccount = Omit<IXWalletAccount, 'privateKey'>;

function stripPrivateKey(account: IXWalletAccount): SafeAccount {
  const { privateKey: _, ...safe } = account;
  return safe;
}

function AuthGuard(props: IAuthRouteProps & RouteProps) {
  const didMountRef = useRef(false);
  const [splashscreenTime, setSplashscreenTime] = useState(1000);
  const [context, setContext] = useState<IAuthContext | null>(null);
  const [activeAccount, setActiveAccount] = useState<SafeAccount | null>(null);
  const [walletLocked, setWalletLocked] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loader, setLoader] = useState(true);
  const [pendingTransactions, setPendingTransactions] =
    useState<boolean>(false);

  // Activity-based auto-lock: update lastWalletUnlocked on user interaction
  useEffect(() => {
    let activityThrottle = 0;
    const THROTTLE_MS = 30000; // Update storage at most every 30 seconds

    const handleActivity = () => {
      const now = Date.now();
      if (now - activityThrottle < THROTTLE_MS) return;
      activityThrottle = now;
      if (!walletLocked) {
        ExtensionStorage.set("lastWalletUnlocked", now).catch(() => {});
      }
    };

    window.addEventListener("click", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("scroll", handleActivity, true);

    // Periodic check every 60 seconds to auto-lock if idle
    const lockCheckInterval = setInterval(async () => {
      if (walletLocked) return;
      try {
        const lastUnlocked = await ExtensionStorage.get("lastWalletUnlocked");
        if (lastUnlocked && isUnlocked(+lastUnlocked)) {
          setWalletLocked(true);
        }
      } catch {}
    }, 60000);

    return () => {
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("scroll", handleActivity, true);
      clearInterval(lockCheckInterval);
    };
  }, [walletLocked]);

  useEffect(() => {
    loadCustomChains().then(() => checkApplicationState());
    chrome.storage.onChanged.addListener(handleStorageChange as any);
    const handleForceLock = () => setWalletLocked(true);
    window.addEventListener("xwallet-lock", handleForceLock);
    const interval = setInterval(() => {
      if (splashscreenTime > 0) {
        setSplashscreenTime((prevstate) => prevstate - 100);
      }
    }, 100);
    return () => {
      clearInterval(interval);
      chrome.storage.onChanged.removeListener(handleStorageChange as any);
      window.removeEventListener("xwallet-lock", handleForceLock);
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

  async function initializeContext(activeAccount: SafeAccount) {
    if (activeAccount) {
      didMountRef.current = false;
      setContext({
        publicKey: activeAccount.publicKey,
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
          setActiveAccount(stripPrivateKey(wallets.ACTIVE));
        }
        break;

      case changes.login && changes?.login?.newValue && areaName == "local":
        const login = await ExtensionStorage.get("login");
        if (!login) {
          setIsSignUp(false);
        } else {
          setIsSignUp(!!login.password);
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
        // update pending transaction state — exclude EVM dapp transactions
        // (those are handled by the EVM notification popup, not ProcessTransaction)
        const pendingTransactions =
          (await ExtensionStorage.get("pendingTransactions")) || [];
        const nonEvmPending = pendingTransactions.filter(
          (tx: any) => tx.type !== "evm-dapp-transaction"
        );
        setPendingTransactions(nonEvmPending.length > 0);
        break;

      default:
        break;
    }
  }

  function isUnlocked(timestamp: number) {
    // Default 15 minutes inactivity timeout (industry standard: MetaMask = 15min)
    const LOCK_TIMEOUT_MS =
      import.meta.env.VITE_WALLET_UNLOCK_INTERVAL_MS || 900000; // 15 min
    const currentTime = Date.now();
    const givenTime = new Date(timestamp).getTime();

    return currentTime - givenTime >= LOCK_TIMEOUT_MS;
  }

  async function checkApplicationState() {
    try {

      await ensureEVMAccountsForL1X();
      await migrateTransactionChainIds();

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
        setActiveAccount(stripPrivateKey(wallets.ACTIVE));
      } else if (
        wallets.L1X.length > 0 ||
        wallets.EVM.length > 0 ||
        wallets["NON-EVM"].length > 0
      ) {
        const first = wallets.L1X[0] || wallets.EVM[0] || wallets["NON-EVM"][0];
        setActiveAccount(stripPrivateKey(first));
      }

      if (lastWalletUnlocked) {
        const iswalletunlocked = isUnlocked(+lastWalletUnlocked);
        setWalletLocked(iswalletunlocked);
      }

      if (signUpState?.password) {
        setIsSignUp(true);
      }

      if (pendingTransactions?.length) {
        // Exclude EVM dapp transactions — they use their own notification popup
        const nonEvmPending = pendingTransactions.filter(
          (tx: any) => tx.type !== "evm-dapp-transaction"
        );
        setPendingTransactions(nonEvmPending.length > 0);
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

  if (loader || splashscreenTime > 0) {
    return <Spalsh />;
  }

  return (
    <AppContext.Provider value={context}>
      {!activeAccount || !activeAccount?.publicKey ? (
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
  );
}

export default AuthGuard;
