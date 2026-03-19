import { ExtensionStorage } from "@util/ExtensionStorage.util";
import { Logger } from "@util/Logger.util";
import { TransactionHandler } from "./TransactionHandler";
import { IServiceWorkerResponse } from "./index.interface";

// ── M-05: Nonce/replay protection for sign requests ──
const SIGN_NONCE_MAX = 100;
const SIGN_NONCE_TTL = 30_000; // 30s window — reject duplicates only within this period
const _usedSignNonces = new Map<string, number>(); // dedupeKey → timestamp

export class EVMMessageHandler {
  constructor(private transactionHandler: TransactionHandler) {}

  /**
   * Write a deferred response to chrome.storage.local so the content script
   * can relay it to the page via postMessage (bypasses dead message channel).
   */
  private async writeDeferredResponse(
    sdkRequestId: string,
    response: IServiceWorkerResponse
  ) {
    try {
      await chrome.storage.local.set({
        [`evm_response_${sdkRequestId}`]: response,
      });
    } catch (err) {
      Logger.error("Failed to write deferred response", err);
    }
  }

  async handleRpc(
    rpcData: { method: string; params: any[]; chainId?: string; rpcUrl?: string },
    _sender: chrome.runtime.MessageSender,
    _sendResponse: (response: IServiceWorkerResponse) => void,
    sdkRequestId?: string
  ) {
    const { method } = rpcData;
    console.log("[EVMHandler] handleRpc called, method:", method, "sdkRequestId:", sdkRequestId);

    // For methods that open popups, respond immediately with "pending"
    // and use storage-based deferred response instead of the message channel callback.
    const isPopupMethod =
      method === "eth_sendTransaction" ||
      method === "personal_sign" ||
      method === "eth_signTypedData" ||
      method === "eth_signTypedData_v3" ||
      method === "eth_signTypedData_v4";

    // eth_requestAccounts may or may not open popup (if already connected, no popup).
    // We handle its deferral inside handleRequestAccounts.

    let deferredSend = _sendResponse;
    if (isPopupMethod && sdkRequestId) {
      // Immediately tell SDK the request is pending — the real response comes via storage
      _sendResponse({ status: "pending", errorMessage: "", data: null } as any);
      // Replace _sendResponse with deferred storage writer
      deferredSend = (response: IServiceWorkerResponse) => {
        this.writeDeferredResponse(sdkRequestId, response);
      };
    }

    try {
      switch (method) {
        case "eth_accounts":
          return this.handleGetAccounts(_sender, _sendResponse);

        case "eth_requestAccounts":
          return this.handleRequestAccounts(rpcData, _sender, _sendResponse, sdkRequestId);

        case "eth_sendTransaction":
          return this.handleSendTransaction(rpcData, _sender, deferredSend, sdkRequestId);

        case "eth_sign":
          // SECURITY: eth_sign is disabled by default (blind signing risk).
          // See: https://support.metamask.io/privacy-and-security/what-is-eth_sign-and-why-is-it-a-risk/
          return _sendResponse({
            status: "failure",
            errorMessage: "eth_sign is disabled for security. Use personal_sign or eth_signTypedData_v4 instead.",
            data: { code: 4200 },
          });

        case "personal_sign":
        case "eth_signTypedData":
        case "eth_signTypedData_v3":
        case "eth_signTypedData_v4":
          return this.handleSignRequest(rpcData, _sender, deferredSend, sdkRequestId);

        case "wallet_switchEthereumChain":
          return this.handleSwitchChain(rpcData, _sender, _sendResponse);

        default:
          return _sendResponse({
            status: "failure",
            errorMessage: `Unsupported EVM method: ${method}`,
            data: null,
          });
      }
    } catch (error: any) {
      Logger.error(error);
      if (isPopupMethod && sdkRequestId) {
        return this.writeDeferredResponse(sdkRequestId, {
          status: "failure",
          errorMessage: error?.message ?? "Internal error",
          data: null,
        });
      }
      return _sendResponse({
        status: "failure",
        errorMessage: error?.message ?? "Internal error",
        data: null,
      });
    }
  }

  private async handleRequestAccounts(
    _rpcData: any,
    _sender: chrome.runtime.MessageSender,
    _sendResponse: (response: IServiceWorkerResponse) => void,
    sdkRequestId?: string
  ) {
    try {
      // Check if already connected with EVM accounts
      const connectedSites =
        (await ExtensionStorage.get("connectedSites")) ?? [];
      const existingSite = connectedSites.find(
        (site) =>
          site.url && site.url === _sender.origin &&
          site?.accounts?.some((a: string) => /^0x[0-9a-f]{40}$/i.test(a))
      );

      if (existingSite) {
        // Site is already connected — return only valid EVM accounts with the
        // currently active wallet address first so dApps use the selected account
        const activeAddress = await this.getActiveEVMAddress();
        let accounts = existingSite.accounts.filter((a: string) => /^0x[0-9a-f]{40}$/i.test(a));
        if (activeAddress) {
          const lowerActive = activeAddress.toLowerCase();
          accounts = accounts.filter((a) => a.toLowerCase() !== lowerActive);
          accounts.unshift(activeAddress);
          existingSite.accounts = [...new Set(accounts)];
          await ExtensionStorage.set("connectedSites", connectedSites);
        }
        return _sendResponse({
          status: "success",
          errorMessage: "",
          data: { accounts },
        });
      }

      // Will open popup — use deferred response if we have sdkRequestId
      if (sdkRequestId) {
        _sendResponse({ status: "pending", errorMessage: "", data: null } as any);
      }
      const deferredSend = sdkRequestId
        ? (response: IServiceWorkerResponse) => this.writeDeferredResponse(sdkRequestId, response)
        : _sendResponse;

      // Open connect popup
      const requestId = crypto.randomUUID();
      const url = `notification.html#connect?data=${encodeURIComponent(
        JSON.stringify({
          url: _sender.origin,
          favIcon: _sender.tab?.favIconUrl,
          appName: _sender.tab?.title,
          requestId,
          source: "ethereum",
        })
      )}`;

      this.transactionHandler.openNotification(url, requestId, (response) => {
        if (response.status === "success") {
          this.getConnectedEVMAccounts(_sender.origin ?? "").then(
            (accounts) => {
              deferredSend({
                status: "success",
                errorMessage: "",
                data: { accounts },
              });
            }
          );
        } else {
          deferredSend({
            status: "failure",
            errorMessage: response.errorMessage || "User rejected connection",
            data: null,
            code: 4001,
          } as any);
        }
      });
    } catch (error: any) {
      Logger.error(error);
      return _sendResponse({
        status: "failure",
        errorMessage: error?.message,
        data: null,
      });
    }
  }

  private async handleSendTransaction(
    rpcData: any,
    _sender: chrome.runtime.MessageSender,
    _sendResponse: (response: IServiceWorkerResponse) => void,
    sdkRequestId?: string
  ) {
    try {
      console.log("[EVMHandler] handleSendTransaction called, rpcData:", JSON.stringify(rpcData));
      const txParams = rpcData.params?.[0];
      if (!txParams) {
        return _sendResponse({
          status: "failure",
          errorMessage: "Missing transaction parameters",
          data: null,
        });
      }

      const requestId = crypto.randomUUID();

      // Store EVM transaction in pending
      const transaction: IEVMDappTransaction = {
        type: "evm-dapp-transaction",
        id: crypto.randomUUID(),
        from: txParams.from || "",
        to: txParams.to || "",
        value: txParams.value || "0x0",
        data: txParams.data || "0x",
        gas: txParams.gas || txParams.gasLimit,
        gasPrice: txParams.gasPrice,
        maxFeePerGas: txParams.maxFeePerGas,
        maxPriorityFeePerGas: txParams.maxPriorityFeePerGas,
        chainId: rpcData.chainId || "0x38",
        rpcUrl: rpcData.rpcUrl || "",
        rpc: rpcData.rpcUrl || "",
        timestamp: Date.now(),
        requestId,
        source: "dapp",
        site: _sender.origin,
        siteFavIcon: _sender.tab?.favIconUrl,
        networkType: "EVM",
        nonce: txParams.nonce,
        sdkRequestId: sdkRequestId || "",
      };

      const pendingTransactions =
        (await ExtensionStorage.get("pendingTransactions")) || [];
      await ExtensionStorage.set("pendingTransactions", [
        transaction,
        ...pendingTransactions,
      ]);

      console.log("[EVMHandler] Opening notification popup, requestId:", requestId, "sdkRequestId:", sdkRequestId);
      this.transactionHandler.openNotification(
        `notification.html#evm-transaction`,
        requestId,
        _sendResponse
      );
    } catch (error: any) {
      console.error("[EVMHandler] handleSendTransaction ERROR:", error);
      Logger.error(error);
      return _sendResponse({
        status: "failure",
        errorMessage: error?.message,
        data: null,
      });
    }
  }

  private async handleSignRequest(
    rpcData: any,
    _sender: chrome.runtime.MessageSender,
    _sendResponse: (response: IServiceWorkerResponse) => void,
    sdkRequestId?: string
  ) {
    const origin = _sender.origin || "";
    const dedupeKey = `${origin}:${rpcData.method}:${JSON.stringify(rpcData.params)}`;
    try {
      const requestId = crypto.randomUUID();
      const { method, params } = rpcData;

      // M-05: Reject duplicate sign requests within TTL window
      const signNonce = crypto.randomUUID();
      const lastUsed = _usedSignNonces.get(dedupeKey);
      if (lastUsed && Date.now() - lastUsed < SIGN_NONCE_TTL) {
        return _sendResponse({
          status: "failure",
          errorMessage: "Duplicate sign request rejected (replay protection)",
          data: { code: 4001 },
        });
      }
      _usedSignNonces.set(dedupeKey, Date.now());
      // Evict expired nonces to prevent memory leak
      if (_usedSignNonces.size > SIGN_NONCE_MAX) {
        const now = Date.now();
        for (const [key, ts] of _usedSignNonces) {
          if (now - ts > SIGN_NONCE_TTL) _usedSignNonces.delete(key);
        }
      }

      await ExtensionStorage.set("evmSignRequest", {
        method,
        params,
        url: origin,
        favIcon: _sender.tab?.favIconUrl || "",
        appName: _sender.tab?.title || "",
        requestId,
        chainId: rpcData.chainId,
        sdkRequestId,
        timestamp: Date.now(),
        signNonce,
      });

      this.transactionHandler.openNotification(
        `notification.html#evm-sign`,
        requestId,
        (response) => {
          // Clear nonce after sign completes (approve or reject)
          _usedSignNonces.delete(dedupeKey);
          _sendResponse(response);
        }
      );
    } catch (error: any) {
      Logger.error(error);
      _usedSignNonces.delete(dedupeKey);
      return _sendResponse({
        status: "failure",
        errorMessage: error?.message,
        data: null,
      });
    }
  }

  private async handleSwitchChain(
    _rpcData: any,
    _sender: chrome.runtime.MessageSender,
    _sendResponse: (response: IServiceWorkerResponse) => void
  ) {
    // Chain switching is handled client-side in the provider for now
    // This just acknowledges the switch on the service worker side
    return _sendResponse({
      status: "success",
      errorMessage: "",
      data: null,
    });
  }

  /**
   * Silent account check — returns connected accounts without opening any popup.
   * Used by the SDK to restore connection state after page refresh.
   */
  private async handleGetAccounts(
    _sender: chrome.runtime.MessageSender,
    _sendResponse: (response: IServiceWorkerResponse) => void
  ) {
    const accounts = await this.getConnectedEVMAccounts(_sender.origin ?? "");
    return _sendResponse({
      status: "success",
      errorMessage: "",
      data: { accounts },
    });
  }

  private async getConnectedEVMAccounts(origin: string): Promise<string[]> {
    try {
      const connectedSites =
        (await ExtensionStorage.get("connectedSites")) ?? [];
      const site = connectedSites.find((el) => el.url === origin);
      // Filter to only valid EVM addresses (0x + 40 hex chars).
      // connectedSites may contain L1X addresses from L1X SDK connections.
      return (site?.accounts ?? []).filter((a) => /^0x[0-9a-f]{40}$/i.test(a));
    } catch {
      return [];
    }
  }

  /**
   * Get the currently active EVM wallet address from storage.
   * Returns null if no active wallet or the active wallet is not EVM type.
   */
  private async getActiveEVMAddress(): Promise<string | null> {
    try {
      const wallets = await ExtensionStorage.get("wallets");
      const active = wallets?.ACTIVE;
      if (active && active.type === "EVM" && active.publicKey) {
        return active.publicKey;
      }
      return null;
    } catch {
      return null;
    }
  }
}
