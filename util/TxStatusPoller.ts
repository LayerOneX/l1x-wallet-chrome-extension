import { ExtensionStorage } from "@util/ExtensionStorage.util";
import { ethers } from "ethers";

export async function pollPendingTransactions(): Promise<boolean> {
  let changed = false;
  try {
    const transactions: Transaction[] =
      (await ExtensionStorage.get("transactions")) ?? [];

    const pending = transactions.filter(
      (tx) => tx.txStatus === "pending" && tx.hash
    );

    if (!pending.length) return false;

    // Group by rpc to reuse providers
    const byRpc: Record<string, Transaction[]> = {};
    for (const tx of pending) {
      const rpc = (tx as any).rpcUrl || tx.rpc;
      if (!rpc) continue;
      if (!byRpc[rpc]) byRpc[rpc] = [];
      byRpc[rpc].push(tx);
    }

    for (const [rpc, txs] of Object.entries(byRpc)) {
      const provider = new ethers.JsonRpcProvider(rpc);
      for (const tx of txs) {
        try {
          const receipt = await provider.getTransactionReceipt(tx.hash!);
          if (receipt) {
            tx.txStatus = receipt.status === 1 ? "confirmed" : "failed";
            changed = true;
          }
        } catch {
          // RPC error — leave as pending
        }
      }
    }

    if (changed) {
      await ExtensionStorage.set("transactions", transactions);
    }
  } catch {
    // Storage error — silently fail
  }
  return changed;
}
