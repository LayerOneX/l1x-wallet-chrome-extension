import { ExtensionStorage } from "./ExtensionStorage.util";
import { ExtensionStorageOld } from "./ExtensionStorageOld.util";
import VirtualMachineFactory from "@factory/VirtualMachine.factory";

export async function migrateWallets() {
  try {
    const mnemonic = (await ExtensionStorageOld.get("mnemonic"));
    if (mnemonic) {
      await ExtensionStorage.set("mnemonic", mnemonic)
      await ExtensionStorage.set("isMigrationCompleted", "mnemonic")
      return await migrateAccounts();
    }
    else {
      await ExtensionStorage.set("isMigrationCompleted", "true");
      return true
    }
  } catch (error) {
    return error
  }
}

export async function migrateAccounts() {
  try {
    const wallets = (await ExtensionStorageOld.get("wallets"))
    if (wallets) {
      for (const wallet of wallets) {
        if (wallet?.type != "NON-EVM") {
          let l1xVm = VirtualMachineFactory.createVirtualMachine(
            wallet?.type,
            wallet?.publicKey
          )
          await l1xVm.importPrivateKey(wallet?.privateKey, wallet?.accountName, true);
        }
      }
      await ExtensionStorage.set("isMigrationCompleted", "wallets")
      return await migrateLogin()
    }
    else {
      await ExtensionStorage.set("isMigrationCompleted", "true");
      return true
    }
  } catch (error) {
    return error
  }
}

export async function migrateLogin() {
  try {
    const credentials = (await ExtensionStorageOld.get("credentials"));
    if (credentials) {
      await ExtensionStorage.set("login", credentials)
      await ExtensionStorage.set("isMigrationCompleted", "true")
      return true
    }
    else {
      await ExtensionStorage.set("isMigrationCompleted", "true")
      return true
    }
  } catch (error) {
    return error
  }
}