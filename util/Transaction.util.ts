import { ExtensionStorage } from "./ExtensionStorage.util";
import { Logger } from "./Logger.util";

export async function removeTransactionRequest(
  requestId: string
): Promise<boolean> {
  return new Promise<boolean>(async (resolve, reject) => {
    try {
      const pendingTransactions =
        (await ExtensionStorage.get("pendingTransactions")) ?? [];
      const currentTransactionIndex = pendingTransactions?.findIndex(
        (el) => el.requestId && el.requestId == requestId
      );
      if (currentTransactionIndex >= 0) {
        pendingTransactions?.splice(currentTransactionIndex, 1);
        await ExtensionStorage.set("pendingTransactions", pendingTransactions);
      }
      resolve(true);
    } catch (error) {
      Logger.error(error);
      reject(error);
    }
  });
}
