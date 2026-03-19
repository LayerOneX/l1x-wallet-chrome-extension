const HASH_PREFIX = "$pbkdf2$";
const ITERATIONS = 100000;

export class PasswordHash {
  static async hash(password: string): Promise<string> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const saltHex = Array.from(salt)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const derivedHash = await this.#deriveKey(password, salt);
    return `${HASH_PREFIX}${saltHex}$${derivedHash}`;
  }

  static async verify(password: string, stored: string): Promise<boolean> {
    if (!stored.startsWith(HASH_PREFIX)) {
      return password === stored;
    }
    const parts = stored.slice(HASH_PREFIX.length).split("$");
    if (parts.length !== 2) return false;
    const salt = new Uint8Array(
      (parts[0].match(/.{2}/g) || []).map((byte) => parseInt(byte, 16))
    );
    const derivedHash = await this.#deriveKey(password, salt);
    return derivedHash === parts[1];
  }

  static isHashed(stored: string): boolean {
    return stored.startsWith(HASH_PREFIX);
  }

  static async #deriveKey(password: string, salt: Uint8Array): Promise<string> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveBits"]
    );
    const derivedBits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
      keyMaterial,
      256
    );
    return Array.from(new Uint8Array(derivedBits))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
}
