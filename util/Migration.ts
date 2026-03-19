import { ExtensionStorage } from "./ExtensionStorage.util";
import VirtualMachineFactory from "@factory/VirtualMachine.factory";
import { getAllEVMChains } from "@virtual_machines/EVM";

/**
 * Backfills chainId on old transactions that were stored with only an rpc field.
 * Master branch filtered transactions by rpc; current branch filters by chainId.
 * Runs once, guarded by `txChainIdMigrationDone` flag.
 */
export async function migrateTransactionChainIds(): Promise<void> {
  try {
    const done = await ExtensionStorage.get("txChainIdMigrationDone" as any);
    if (done === "true") return;

    // Build RPC → chainId map from all known chains
    const rpcToChainId: Record<string, string> = {};
    for (const chain of getAllEVMChains()) {
      if (chain.rpc) rpcToChainId[chain.rpc.replace(/\/+$/, "")] = chain.chainId.toString();
      // Also include environment RPCs
      for (const env of Object.values(chain.environment ?? {})) {
        if (env?.rpc) rpcToChainId[env.rpc.replace(/\/+$/, "")] = chain.chainId.toString();
      }
    }

    const fixTx = (txList: Transaction[]): { updated: Transaction[]; changed: boolean } => {
      let changed = false;
      const updated = txList.map((tx) => {
        if (tx.chainId && tx.chainId !== "0" && tx.chainId !== "") return tx;
        const rpcKey = (tx.rpc ?? "").replace(/\/+$/, "");
        const resolved = rpcToChainId[rpcKey];
        if (!resolved) return tx;
        changed = true;
        return { ...tx, chainId: resolved };
      });
      return { updated, changed };
    };

    const [transactions, pendingTransactions] = await Promise.all([
      ExtensionStorage.get("transactions"),
      ExtensionStorage.get("pendingTransactions"),
    ]);

    const txResult = fixTx((transactions as Transaction[]) ?? []);
    const ptxResult = fixTx((pendingTransactions as Transaction[]) ?? []);

    await Promise.all([
      txResult.changed ? ExtensionStorage.set("transactions", txResult.updated) : Promise.resolve(),
      ptxResult.changed ? ExtensionStorage.set("pendingTransactions", ptxResult.updated) : Promise.resolve(),
      ExtensionStorage.set("txChainIdMigrationDone" as any, "true"),
    ]);
  } catch {
    // Non-blocking — if migration fails, app still works; history just won't filter correctly
  }
}

export async function ensureEVMAccountsForL1X(): Promise<boolean> {
  try {
    const alreadyDone = await ExtensionStorage.get("l1xToEvmMigrationDone");
    if (alreadyDone === "true") {
      return true;
    }

    let wallets = (await ExtensionStorage.get("wallets")) as L1XAccounts | null | undefined;
    if (!wallets?.L1X?.length) {
      await ExtensionStorage.set("l1xToEvmMigrationDone", "true");
      return true;
    }

    const evmVm = VirtualMachineFactory.createVirtualMachine("EVM", "");

    for (const l1xAcc of wallets.L1X) {
      if (!l1xAcc.privateKey || !l1xAcc.accountName) continue;

      const hasEvm = (wallets.EVM ?? []).some(
        (evmAcc) =>
          evmAcc.type === "EVM" &&
            evmAcc.privateKey?.trim() === l1xAcc.privateKey?.trim()
      );
      if (hasEvm) {
        continue;
      }

      if (l1xAcc.createdFromSeed) {
        await evmVm.createAccount(l1xAcc.accountName);
      } else {
        await evmVm.importPrivateKey(
          l1xAcc.privateKey,
          l1xAcc.accountName,
          false
        );
      }
    }

    await ExtensionStorage.set("l1xToEvmMigrationDone", "true");
    return true;
  } catch (e) {
    return false;
  }
}