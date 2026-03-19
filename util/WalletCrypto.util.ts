import { Sha256 } from '@aws-crypto/sha256-js';
import aesjs from 'aes-js';
import { generateRandomString } from './Helper';

const V2_PREFIX = 'v2:';
const NONCE_BYTE_LEN = 16;
const NONCE_HEX_LEN = NONCE_BYTE_LEN * 2;

export class WalletCrypto {
  static async #getPassword() {
    const storageKey = 'storage-secret';
    let secret = (await chrome.storage.local.get(storageKey))[storageKey];
    if (!secret) {
      secret = await generateRandomString(50);
      await chrome.storage.local.set({ [storageKey]: secret });
    }
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

  static #generateNonce(): Uint8Array {
    const nonce = new Uint8Array(NONCE_BYTE_LEN);
    crypto.getRandomValues(nonce);
    return nonce;
  }

  static async encrypt(data: string) {
    const password = await this.#getPassword();
    const textBytes = this.#textToBytes(data);
    const nonce = this.#generateNonce();
    const aesCtr = new aesjs.ModeOfOperation.ctr(
      password,
      new aesjs.Counter(nonce)
    );
    const encryptedBytes = aesCtr.encrypt(textBytes);
    const nonceHex = aesjs.utils.hex.fromBytes(nonce);
    const cipherHex = aesjs.utils.hex.fromBytes(encryptedBytes);
    return V2_PREFIX + nonceHex + cipherHex;
  }

  static async decrypt(data: string) {
    const password = await this.#getPassword();

    if (!data.startsWith(V2_PREFIX)) {
      // v1 fallback: master branch used fixed Counter(5) with no prefix
      const encryptedBytes = aesjs.utils.hex.toBytes(data);
      const aesCtr = new aesjs.ModeOfOperation.ctr(password, new aesjs.Counter(5));
      return this.#bytesToText(aesCtr.decrypt(encryptedBytes));
    }

    const payload = data.slice(V2_PREFIX.length);
    const nonceHex = payload.slice(0, NONCE_HEX_LEN);
    const cipherHex = payload.slice(NONCE_HEX_LEN);
    const nonce = aesjs.utils.hex.toBytes(nonceHex);
    const encryptedBytes = aesjs.utils.hex.toBytes(cipherHex);
    const aesCtr = new aesjs.ModeOfOperation.ctr(
      password,
      new aesjs.Counter(nonce)
    );
    const decryptedBytes = aesCtr.decrypt(encryptedBytes);
    return this.#bytesToText(decryptedBytes);
  }
}
