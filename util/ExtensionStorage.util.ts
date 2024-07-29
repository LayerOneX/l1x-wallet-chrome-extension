import { WalletCrypto } from "./WalletCrypto.util";

export class ExtensionStorage {
  static isJson(data: any) {
    try {
      JSON.parse(data);
      return true;
    } catch (error) {
      return false;
    }
  }

  static async get<K extends keyof IExtensionStorage>(
    key: K
  ): Promise<IExtensionStorage[K] | null> {
    const encryptedData = await chrome.storage.local.get(key);
    if (!encryptedData[key]) {
      return null;
    }
    const decryptedData = await WalletCrypto.decrypt(encryptedData[key]);
    const data: IExtensionStorage[K] = this.isJson(decryptedData)
      ? JSON.parse(decryptedData)
      : decryptedData.toString();
    return data;
  }

  static async set<K extends keyof IExtensionStorage>(
    key: K,
    data: IExtensionStorage[K]
  ) {
    let rawData =
      typeof data == "object" ? JSON.stringify(data) : data.toString();
    const encryptedData = await WalletCrypto.encrypt(rawData);
    await chrome.storage.local.set({ [key]: encryptedData });
    return true;
  }

  static async remove<K extends keyof IExtensionStorage>(key: K) {
    chrome.storage.local.remove(key);
  }
}
