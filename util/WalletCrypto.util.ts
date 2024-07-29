import { Sha256 } from '@aws-crypto/sha256-js';
import aesjs from 'aes-js';
import { generateRandomString } from './Helper';

export class WalletCrypto {
  static async #getPassword() {
    const storageKey = 'storage-secret';
    // get secret from storage
    let secret = (await chrome.storage.local.get(storageKey))[storageKey];
    // if secret not present generate secret
    if (!secret) {
      secret = await generateRandomString(50);
      await chrome.storage.local.set({ [storageKey]: secret });
    }
    // create hash of a secret
    const hash = new Sha256();
    hash.update(secret);
    return hash.digest();
  }

  static #bytesToText(bytes: Uint8Array): string {
    return aesjs.utils.utf8.fromBytes(bytes);
  }

  static #textToBytes(text: string): Uint8Array {
    return aesjs.utils.utf8.toBytes(text);
  }

  static async encrypt(data: string) {
    const password = await this.#getPassword();
    const textBytes = this.#textToBytes(data);
    const aesCtr = new aesjs.ModeOfOperation.ctr(
      password,
      new aesjs.Counter(5)
    );
    const encryptedBytes = aesCtr.encrypt(textBytes);
    return aesjs.utils.hex.fromBytes(encryptedBytes);
  }

  static async decrypt(data: string) {
    const password = await this.#getPassword();
    const encryptedBytes = aesjs.utils.hex.toBytes(data);
    const aesCtr = new aesjs.ModeOfOperation.ctr(
      password,
      new aesjs.Counter(5)
    );
    const decryptedBytes = aesCtr.decrypt(encryptedBytes);
    return this.#bytesToText(decryptedBytes);
  }
}
