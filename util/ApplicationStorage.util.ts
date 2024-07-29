import localforage from "localforage";
import { WalletCrypto } from "./WalletCrypto.util";

export class ApplicationStorage {
  static isJson(data: any) {
    try {
      JSON.parse(data);
      return true;
    } catch (error) {
      return false;
    }
  }

  static async get<K extends keyof IApplicationStorage>(
    key: K
  ): Promise<IApplicationStorage[K] | null> {
    const encryptedData = await localforage.getItem(key);
    if (!encryptedData) {
      return null;
    }
    const decryptedData = await WalletCrypto.decrypt(encryptedData as any);
    const data: IApplicationStorage[K] = this.isJson(decryptedData)
      ? JSON.parse(decryptedData)
      : decryptedData.toString();
    return data;
  }

  static async set<K extends keyof IApplicationStorage>(
    key: K,
    data: IApplicationStorage[K]
  ) {
    let rawData = typeof data == "object" ? JSON.stringify(data) : data;
    const encryptedData = await WalletCrypto.encrypt(rawData);
    await localforage.setItem(key, encryptedData);
    return true;
  }

  static async remove<K extends keyof IApplicationStorage>(key: K) {
    localforage.removeItem(key);
  }
}
