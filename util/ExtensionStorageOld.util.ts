import { WalletCryptoOld } from "./WalletCryptoOld.util";
import localForage from "localforage";

export class ExtensionStorageOld {
  static isJson(data: any) {
    try {
      JSON.parse(data);
      return true;
    } catch (error) {
      return false;
    }
  }

  static async get(
    key: any
  ): Promise<any | null> {

    let encryptedData = await localForage.getItem(key);
    if (encryptedData == null) {
      return null;
    }

    const decryptedData = await WalletCryptoOld.decrypt(encryptedData);
    const data = this.isJson(decryptedData)
      ? JSON.parse(decryptedData)
      : decryptedData.toString();
    return data;

  }

  static async set(
    key: any,
    data: any
  ) {
    let rawData =
      typeof data == "object" ? JSON.stringify(data) : data.toString();
    const encryptedData = await WalletCryptoOld.encrypt(rawData);
    await localForage.setItem(key, encryptedData);
    return true;
  }

  static async remove<K extends keyof IExtensionStorage>(key: K) {
    await localForage.removeItem(key);
  }
}
