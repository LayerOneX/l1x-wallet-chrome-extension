/**
 * XWallet EIP-1193 Provider
 * Injected as window.ethereum for MetaMask-compatible dApp integration.
 */

import {
  EIP1193ErrorCode,
  EIP6963ProviderDetail,
  EIP6963ProviderInfo,
  EVM_CHAINS,
  ProviderRpcError,
  SENSITIVE_METHODS,
} from "./ethereum-types";
import { proxyRpcCall } from "./ethereum-rpc-proxy";

// ── Resolve extension ID from injected script tag ──
// Must capture eagerly — the content script removes the <script> tag after load
const _cachedExtensionId = (() => {
  const script = document.querySelector("script[data-x-wallet-extension-id]");
  return script?.getAttribute("data-x-wallet-extension-id") ?? "";
})();

function getExtensionId(): string {
  return _cachedExtensionId;
}

// ── Pending deferred responses for popup-based methods ──
const _pendingDeferreds: Map<
  string,
  { resolve: (v: any) => void; reject: (e: any) => void }
> = new Map();

// Listen for deferred responses relayed from content script via storage
window.addEventListener("message", (event) => {
  if (event.origin !== location.origin) return;
  if (event.data?.source !== "xwallet-evm-response") return;
  const { requestId, response } = event.data;
  if (!requestId) return;
  const deferred = _pendingDeferreds.get(requestId);
  if (!deferred) return;
  _pendingDeferreds.delete(requestId);
  if (response?.status === "success") {
    deferred.resolve(response.data);
  } else {
    deferred.reject(
      new ProviderRpcError(
        response?.code ?? -32603,
        response?.errorMessage ?? "Request failed",
        response?.data
      )
    );
  }
});

// ── Send message to service worker ──
function sendToServiceWorker(data: any): Promise<any> {
  const extensionId = getExtensionId();
  if (!extensionId || extensionId === "") {
    return Promise.reject(
      new ProviderRpcError(-32603, "XWallet extension ID not found")
    );
  }

  return new Promise((resolve, reject) => {
    try {
      // Generate requestId for deferred (popup) responses
      const requestId = "evm_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      const dataWithId = { ...data, requestId };

      // Always register deferred BEFORE sending — the message channel may close
      // before the service worker can respond with "pending", but the storage
      // relay will still deliver the response.
      _pendingDeferreds.set(requestId, { resolve, reject });

      chrome.runtime.sendMessage(extensionId, dataWithId, (response: any) => {
        if (chrome.runtime.lastError) {
          // Channel error. For popup methods (eth_sendTransaction, personal_sign, etc.)
          // the deferred stays registered — response comes via storage relay.
          // For non-popup methods like eth_accounts, we must reject immediately
          // or the promise hangs forever.
          const isPending = _pendingDeferreds.has(requestId);
          if (isPending) {
            // Give storage relay a short window, then reject if still pending
            setTimeout(() => {
              const deferred = _pendingDeferreds.get(requestId);
              if (deferred) {
                _pendingDeferreds.delete(requestId);
                reject(new ProviderRpcError(-32603, chrome.runtime.lastError?.message ?? "Connection failed"));
              }
            }, 3000);
          }
          return;
        }
        if (!response) {
          // No response — reject to avoid hanging
          _pendingDeferreds.delete(requestId);
          reject(new ProviderRpcError(-32603, "No response from service worker"));
          return;
        }
        // If service worker says "pending", keep waiting for storage relay
        if (response.status === "pending") {
          return;
        }
        // Got an immediate response — remove deferred and resolve/reject directly
        _pendingDeferreds.delete(requestId);
        if (response.status === "success") {
          resolve(response.data);
        } else {
          reject(
            new ProviderRpcError(
              response.code ?? -32603,
              response.errorMessage ?? "Request failed",
              response.data
            )
          );
        }
      });
    } catch (err: any) {
      reject(new ProviderRpcError(-32603, err?.message ?? "Internal error"));
    }
  });
}

// ── XWallet Ethereum Provider ──
class XWalletEthereumProvider {
  // MetaMask compatibility flags
  isMetaMask = true;
  isXWallet = true;

  // Internal state
  private _chainId: string = "0x38"; // Default BSC
  private _rpcUrl: string = EVM_CHAINS["0x38"].rpcUrl;
  private _accounts: string[] = [];
  private _connected = false;
  private _restoredConnection = false; // Prevents repeated service worker checks

  // Event listeners
  private _listeners: Map<string, Set<(...args: any[]) => void>> = new Map();

  // MetaMask _metamask namespace
  _metamask = {
    isUnlocked: () => Promise.resolve(true),
  };

  // Promise that resolves when connection state is restored from service worker.
  // Callers can await this to ensure accounts are available.
  _restorePromise: Promise<void>;

  constructor() {
    this._setupEventRelay();
    // Proactively restore connection state (fire-and-forget).
    // This populates _accounts/_connected before dApp frameworks
    // check synchronous properties like .connected or .selectedAddress.
    this._restorePromise = this._restoreConnection();
  }

  private async _restoreConnection() {
    try {
      const restored = await sendToServiceWorker({
        action: "EVM_RPC",
        data: { method: "eth_accounts", params: [], chainId: this._chainId },
      });
      if (restored?.accounts?.length > 0) {
        this._accounts = restored.accounts.map((a: string) => a.toLowerCase());
        this._connected = true;
        this._restoredConnection = true;
        this._emit("accountsChanged", [...this._accounts]);
      }
    } catch {}
    this._restoredConnection = true;
  }

  // ── EIP-1193: request() ──
  async request(args: { method: string; params?: any[] | Record<string, any> }): Promise<any> {
    const { method, params } = args;
    const paramArray = Array.isArray(params) ? params : params ? [params] : [];

    // ── Local methods (no RPC or service worker needed) ──
    switch (method) {
      case "eth_chainId":
        return this._chainId;

      case "eth_accounts": {
        // Wait for proactive restore to complete (fast if already done)
        if (!this._restoredConnection) {
          await this._restorePromise;
        }
        return [...this._accounts];
      }

      case "eth_coinbase":
        return this._accounts[0] ?? null;

      case "net_version":
        return String(parseInt(this._chainId, 16));

      case "net_listening":
        return true;

      case "net_peerCount":
        return "0x0";

      case "web3_clientVersion":
        return "XWallet/2.0.28";

      case "eth_syncing":
        return false;

      case "eth_mining":
        return false;

      case "wallet_getPermissions":
        return this._accounts.length > 0
          ? [{ parentCapability: "eth_accounts" }]
          : [];

      case "wallet_getSnaps":
        return {};

      case "eth_sendRawTransaction":
        // Already signed, proxy directly to RPC
        return proxyRpcCall(this._rpcUrl, method, paramArray);

      case "eth_subscribe":
      case "eth_unsubscribe":
        // Proxy to RPC — will work if the RPC supports WebSocket, otherwise RPC returns error
        return proxyRpcCall(this._rpcUrl, method, paramArray);

      case "web3_sha3":
        // Keccak256 hash — can compute locally
        if (paramArray[0]) {
          // Dynamic import not available, proxy to RPC
          return proxyRpcCall(this._rpcUrl, method, paramArray);
        }
        throw new ProviderRpcError(-32602, "Missing data parameter for web3_sha3");

      case "wallet_watchAsset": {
        // EIP-747: suggest token to the wallet
        // For now, acknowledge the request — token management is in the wallet UI
        const asset = paramArray[0];
        if (!asset || asset.type !== "ERC20" || !asset.options?.address) {
          throw new ProviderRpcError(-32602, "Invalid asset params. Expected { type: 'ERC20', options: { address, symbol, decimals, image } }");
        }
        // Return true to indicate the request was received (matching MetaMask behavior)
        return true;
      }
    }

    // ── Sensitive methods → service worker ──
    if (SENSITIVE_METHODS.has(method)) {
      console.log("[XWallet SDK] Sensitive method:", method);
      return this._handleSensitiveMethod(method, paramArray);
    }

    // ── Everything else → proxy to RPC ──
    console.log("[XWallet SDK] Proxy to RPC:", method);
    return proxyRpcCall(this._rpcUrl, method, paramArray);
  }

  // ── Sensitive method handler ──
  private async _handleSensitiveMethod(
    method: string,
    params: any[]
  ): Promise<any> {
    switch (method) {
      case "eth_requestAccounts": {
        // Always ask the service worker for accounts so we get the
        // currently active wallet address (not a stale cached list)
        const data = await sendToServiceWorker({
          action: "EVM_RPC",
          data: { method, params, chainId: this._chainId },
        });
        if (data?.accounts && Array.isArray(data.accounts)) {
          const newAccounts = data.accounts.map((a: string) => a.toLowerCase());
          const wasConnected = this._connected;
          const accountsChanged =
            JSON.stringify(newAccounts) !== JSON.stringify(this._accounts);
          this._accounts = newAccounts;
          this._connected = true;
          if (!wasConnected) {
            this._emit("connect", { chainId: this._chainId });
          }
          if (accountsChanged) {
            this._emit("accountsChanged", [...this._accounts]);
          }
        }
        return [...this._accounts];
      }

      case "eth_sendTransaction": {
        console.log("[XWallet SDK] eth_sendTransaction called, accounts:", this._accounts, "chainId:", this._chainId);
        if (this._accounts.length === 0) {
          console.error("[XWallet SDK] eth_sendTransaction REJECTED — no accounts connected");
          throw new ProviderRpcError(
            EIP1193ErrorCode.UNAUTHORIZED,
            "No accounts connected. Call eth_requestAccounts first."
          );
        }
        console.log("[XWallet SDK] Sending eth_sendTransaction to service worker, params:", JSON.stringify(params));
        const result = await sendToServiceWorker({
          action: "EVM_RPC",
          data: { method, params, chainId: this._chainId, rpcUrl: this._rpcUrl },
        });
        console.log("[XWallet SDK] eth_sendTransaction result:", result);
        return result?.hash ?? result;
      }

      case "eth_sign":
        // SECURITY: eth_sign disabled — blind signing risk
        throw new ProviderRpcError(
          EIP1193ErrorCode.UNSUPPORTED_METHOD,
          "eth_sign is disabled for security. Use personal_sign or eth_signTypedData_v4 instead."
        );

      case "personal_sign":
      case "eth_signTypedData":
      case "eth_signTypedData_v3":
      case "eth_signTypedData_v4": {
        console.log("[XWallet SDK] Sign request:", method, "accounts:", this._accounts.length);
        if (this._accounts.length === 0) {
          console.error("[XWallet SDK] Sign REJECTED — no accounts connected");
          throw new ProviderRpcError(
            EIP1193ErrorCode.UNAUTHORIZED,
            "No accounts connected. Call eth_requestAccounts first."
          );
        }
        console.log("[XWallet SDK] Sending sign request to service worker");
        const signResult = await sendToServiceWorker({
          action: "EVM_RPC",
          data: { method, params, chainId: this._chainId },
        });
        console.log("[XWallet SDK] Sign result:", signResult);
        return signResult?.signature ?? signResult;
      }

      case "wallet_switchEthereumChain": {
        const requestedChainId = params?.[0]?.chainId?.toLowerCase();
        if (!requestedChainId) {
          throw new ProviderRpcError(-32602, "Missing chainId parameter");
        }
        const chain = EVM_CHAINS[requestedChainId];
        if (!chain) {
          throw new ProviderRpcError(
            EIP1193ErrorCode.UNRECOGNIZED_CHAIN,
            `Unrecognized chain ID: ${requestedChainId}. XWallet supports: ${Object.keys(EVM_CHAINS).join(", ")}`
          );
        }
        this._chainId = requestedChainId;
        this._rpcUrl = chain.rpcUrl;
        // Notify service worker of chain switch
        sendToServiceWorker({
          action: "EVM_RPC",
          data: { method, params, chainId: requestedChainId },
        }).catch(() => {}); // fire and forget
        this._emit("chainChanged", requestedChainId);
        return null;
      }

      case "wallet_addEthereumChain": {
        // EIP-3085: If chain is already known, treat as switch. Otherwise reject.
        const addChainId = params?.[0]?.chainId?.toLowerCase();
        const knownChain = addChainId ? EVM_CHAINS[addChainId] : null;
        if (knownChain) {
          // Chain already supported — switch to it
          this._chainId = addChainId;
          this._rpcUrl = knownChain.rpcUrl;
          this._emit("chainChanged", addChainId);
          return null;
        }
        throw new ProviderRpcError(
          EIP1193ErrorCode.UNRECOGNIZED_CHAIN,
          "XWallet does not support adding custom chains. Supported: " + Object.keys(EVM_CHAINS).join(", ")
        );
      }

      case "wallet_requestPermissions": {
        // Trigger connect flow
        const permData = await sendToServiceWorker({
          action: "EVM_RPC",
          data: { method: "eth_requestAccounts", params: [], chainId: this._chainId },
        });
        if (permData?.accounts && Array.isArray(permData.accounts)) {
          this._accounts = permData.accounts.map((a: string) => a.toLowerCase());
          this._connected = true;
          this._emit("accountsChanged", [...this._accounts]);
        }
        return [{ parentCapability: "eth_accounts" }];
      }

      case "wallet_revokePermissions": {
        this._accounts = [];
        this._connected = false;
        sendToServiceWorker({
          action: "EVM_DISCONNECT",
          data: null,
        }).catch(() => {});
        this._emit("accountsChanged", []);
        this._emit("disconnect", {
          code: EIP1193ErrorCode.DISCONNECTED,
          message: "Disconnected",
        });
        return null;
      }

      default:
        throw new ProviderRpcError(
          EIP1193ErrorCode.UNSUPPORTED_METHOD,
          `Method ${method} is not supported`
        );
    }
  }

  // ── EIP-1193: Events ──
  on(event: string, listener: (...args: any[]) => void): this {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event)!.add(listener);
    return this;
  }

  removeListener(event: string, listener: (...args: any[]) => void): this {
    this._listeners.get(event)?.delete(listener);
    return this;
  }

  removeAllListeners(event?: string): this {
    if (event) {
      this._listeners.delete(event);
    } else {
      this._listeners.clear();
    }
    return this;
  }

  // Alias
  off = this.removeListener;
  addListener = this.on;

  listenerCount(event: string): number {
    return this._listeners.get(event)?.size ?? 0;
  }

  listeners(event: string): ((...args: any[]) => void)[] {
    return Array.from(this._listeners.get(event) ?? []);
  }

  private _emit(event: string, ...args: any[]) {
    const listeners = this._listeners.get(event);
    if (listeners) {
      listeners.forEach((fn) => {
        try {
          fn(...args);
        } catch (e) {
          console.error(`[XWallet] Error in ${event} listener:`, e);
        }
      });
    }
  }

  // ── Legacy MetaMask methods ──

  /** @deprecated Use request({ method: 'eth_requestAccounts' }) */
  enable(): Promise<string[]> {
    return this.request({ method: "eth_requestAccounts" });
  }

  /** @deprecated Use request() */
  send(methodOrPayload: any, paramsOrCallback?: any): any {
    // Handle legacy send(method, params) style
    if (typeof methodOrPayload === "string") {
      return this.request({
        method: methodOrPayload,
        params: paramsOrCallback,
      });
    }
    // Handle legacy send({ method, params }, callback) style
    if (typeof paramsOrCallback === "function") {
      this.request(methodOrPayload).then(
        (result) => paramsOrCallback(null, { result }),
        (error) => paramsOrCallback(error)
      );
      return;
    }
    // Handle legacy send({ method, params }) → promise style
    return this.request(methodOrPayload);
  }

  /** @deprecated Use request() */
  sendAsync(
    payload: any,
    callback: (error: any, result?: any) => void
  ): void {
    this.request({ method: payload.method, params: payload.params }).then(
      (result) =>
        callback(null, {
          id: payload.id,
          jsonrpc: "2.0",
          result,
        }),
      (error) => callback(error)
    );
  }

  // ── Internal: connect state getter ──
  get connected(): boolean {
    return this._connected;
  }

  get chainId(): string {
    return this._chainId;
  }

  get selectedAddress(): string | null {
    return this._accounts[0] ?? null;
  }

  get networkVersion(): string {
    return String(parseInt(this._chainId, 16));
  }

  // ── Internal: update state from service worker events ──
  _updateAccounts(accounts: string[]) {
    this._accounts = accounts.map((a) => a.toLowerCase());
    this._emit("accountsChanged", [...this._accounts]);
  }

  _updateChainId(chainId: string) {
    // Normalize to lowercase hex for consistent lookup
    const normalizedChainId = chainId?.toLowerCase();
    // Only accept chain IDs that correspond to known EVM chains.
    // The wallet's L1X native VM uses chainId=1 internally, which would
    // incorrectly override the EVM provider's chain to Ethereum mainnet (0x1).
    const chain = EVM_CHAINS[normalizedChainId];
    if (!chain) return; // Ignore non-EVM chain changes
    if (normalizedChainId === this._chainId) return; // No-op if already on this chain
    this._chainId = normalizedChainId;
    this._rpcUrl = chain.rpcUrl;
    this._emit("chainChanged", normalizedChainId);
  }

  // ── Event relay from content script ──
  private _setupEventRelay() {
    window.addEventListener("message", (event) => {
      if (event.origin !== location.origin) return;
      if (event.data?.source !== "xwallet-ethereum-provider") return;

      switch (event.data?.type) {
        case "accountsChanged":
          this._updateAccounts(event.data.payload);
          break;
        case "chainChanged":
          // Intentionally ignored. The wallet's internal network switch broadcasts
          // L1X native chainId=1 as "0x1", which conflicts with Ethereum mainnet.
          // Chain changes are managed exclusively via wallet_switchEthereumChain
          // calls from dApps, which already emit the correct chainChanged event.
          break;
        case "disconnect":
          this._accounts = [];
          this._connected = false;
          this._emit("accountsChanged", []);
          this._emit("disconnect", {
            code: EIP1193ErrorCode.DISCONNECTED,
            message: "Disconnected",
          });
          break;
      }
    });
  }
}

// ── Create and inject provider ──
const provider = new XWalletEthereumProvider();

// Register as the real provider — the content script's early proxy will pick this up
(window as any)._xwalletEthProvider = provider;

// ── Conditional window.ethereum hijack ──
// 1. Force hijack on l1xapp.com (always)
// 2. On other sites, only hijack if MetaMask/Rabby are NOT already present
const _isL1XDomain = (() => {
  const host = window.location.hostname;
  return host === "l1xapp.com" || host.endsWith(".l1xapp.com") || host === "localhost";
})();

const _hasOtherWallet = !!(
  (window as any).ethereum?.isMetaMask ||
  (window as any).ethereum?.isRabby
);

if (_isL1XDomain) {
  // Force hijack on l1xapp.com — lock so other wallets can't override
  try {
    Object.defineProperty(window, "ethereum", {
      get: () => provider,
      set: () => true,
      configurable: false,
    });
  } catch {
    (window as any).ethereum = provider;
  }
} else if (!_hasOtherWallet) {
  // No MetaMask/Rabby present — set window.ethereum and protect from overwrites.
  // Use configurable: true so it's not a permanent lock, but the no-op setter
  // prevents other wallets that load later from silently clobbering our provider.
  try {
    Object.defineProperty(window, "ethereum", {
      get: () => provider,
      set: () => true,
      configurable: true,
    });
  } catch {
    (window as any).ethereum = provider;
  }
}
// If MetaMask/Rabby are present on non-l1xapp.com sites, don't hijack.
// XWallet is still discoverable via EIP-6963.

// ── EIP-6963: Announce provider ──
const providerInfo: EIP6963ProviderInfo = {
  uuid: "d4f0a7e3-c8b2-4f1d-9e5a-6b3c8d2e1f0a", // Stable UUID for XWallet
  name: "XWallet",
  icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAA7EAAAOxAGVKw4bAAADa0lEQVR4nO2ZTVLbQBCFuxWXWcaL2CzDDcINYp8guQFiEeNd4AbkBMkSyMLiBMAJLE6Q5AbeAlnADlREk+4xMp5Imh9pJFIUr4qSmNFI79PPTHe7Aw1IjNdjQHivNOKfER78jn1fqxGANvUC8NR6/gBi0g95iwdXEbQkEfZ6sNb9CnfJHkbX17pjtQDiU38TRDCV+5N+KxDSfLc7o1u2SdtN+n+kgygFkOYRZ48NwbQVCL7zbJ6FEmKmgygEEJPeBqRkHrGndjDEm3kT87k8/c6AnjaGSiNDrK3t095u0ZhCADy4novx4Ix2t3KdaXBCT2eE369+gkcVmpcd4ob+orJxpa8QHl2GBMF3QIVYPJWZTwiD+aHuOtqPuA2IOuZZxmm0SYi65llWC5krBB5dDE3n9GGeZb0S+3wSpeYXCl2eqFMoISF2BmQYP6gd9hBa85hu4+HVqYsn91joLglpsYnpau/Ui5shjOYrLJLOALwi0so4dIVowjyrUjRqhED8Icb9b4AB9cMGfZThMjzInay6eVblcFoLIQ8IeOlfLP+IJSepZ55VKx8wQmgH1zfP6sh4XwRb4KI03cve8SVEtzunO/3aarwQX2i2iZSmCj7w8GLUoahzAxCGLgPhlVCiVAkx6e+CwKlxLC1UNB3v59qr+ACvKaWY2x2HXqPYJ8iJhd1rZil/AGnwGdB8GCconO35CsU7ECQRbWKnUbf36iIlP0D8aD0ecZpLE6v4IHU4+6LtHCrqYfYwf7yrKsh1q/qo9QqZzYtfIGglLppeLRJ2G1UG0JsXZxz0ZcYoDOfXK8qBeICoBKA1L8Qxh92rTfT/KX24Q9qNfUM4A6wWu/KdefOZeNZpAsIJIFfsUjrLzWdqAsIaYGn+32KX7DSbX/o0QcjKHGzb+rICcDUvv5EU3yrHBcnxw1Sph6Ckh5IfCtQurSDM1ekqdz4NwtxPTNA5h5V53heEuTrt4bUpkw8Ic3W6IfOZ6kK4VadlJ5z7Mp/JDLF+Q8mLj+o0hQZJYh+0OUgLIURcNs6hOk3m75JhnbjFJAkxHoS0e/LYqC926WehJNmleXlRDmnYfCYZdkz623K1t0j89eX1LGF/2IeWxKbpO4yzdUMnc3m9RePKdS3Ms57/78T/u14AChWkES2EsdKG9/MmLvUX9ZVHyuX0Y1EAAAAASUVORK5CYII=",
  rdns: "com.xwallet",
};

const providerDetail: EIP6963ProviderDetail = {
  info: providerInfo,
  provider: provider as any,
};

// Helper to dispatch announcement
function announceEIP6963() {
  window.dispatchEvent(
    new CustomEvent("eip6963:announceProvider", {
      detail: Object.freeze(providerDetail),
    })
  );
}

// Announce immediately (for early listeners)
announceEIP6963();

// Re-announce when DOM is interactive (for frameworks that initialize on DOMContentLoaded)
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", announceEIP6963);
}

// Re-announce when page is fully loaded (for late-initializing dApps like PancakeSwap/Privy)
window.addEventListener("load", announceEIP6963);

// Listen for explicit discovery requests (EIP-6963 spec)
window.addEventListener("eip6963:requestProvider", announceEIP6963);
