import { ProviderRpcError } from "./ethereum-types";

let _nextId = 1;
let _rpcCallbackId = 1;

/**
 * Proxy a JSON-RPC call to the chain's RPC endpoint.
 *
 * Tries direct fetch() first. If it fails for any reason (CSP, network, etc.)
 * falls back to relaying through the content script which bypasses page CSP.
 */
export async function proxyRpcCall(
  rpcUrl: string,
  method: string,
  params?: any[]
): Promise<any> {
  const id = _nextId++;
  const body = {
    jsonrpc: "2.0" as const,
    id,
    method,
    params: params ?? [],
  };

  try {
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new ProviderRpcError(
        -32603,
        `RPC request failed: ${response.status} ${response.statusText}`
      );
    }

    const json = await response.json();

    if (json.error) {
      throw new ProviderRpcError(
        json.error.code ?? -32603,
        json.error.message ?? "Unknown RPC error",
        json.error.data
      );
    }

    return json.result;
  } catch (err: any) {
    // If the error is a ProviderRpcError from the RPC itself (not a fetch failure),
    // re-throw it — the RPC endpoint responded correctly, just with an error.
    if (err instanceof ProviderRpcError) throw err;
    // Any other error (CSP, network, TypeError, etc.) — fall back to content script relay
    return proxyViaContentScript(rpcUrl, body);
  }
}

/**
 * Relay an RPC call through the content script via window.postMessage.
 * Content scripts are not subject to page CSP restrictions.
 */
function proxyViaContentScript(
  rpcUrl: string,
  body: { jsonrpc: "2.0"; id: number; method: string; params: any[] }
): Promise<any> {
  return new Promise((resolve, reject) => {
    const callbackId = `xwallet-rpc-${_rpcCallbackId++}`;

    const onMessage = (event: MessageEvent) => {
      if (event.source !== window) return;
      if (event.data?.source !== "xwallet-content-rpc") return;
      if (event.data?.callbackId !== callbackId) return;

      window.removeEventListener("message", onMessage);

      if (event.data.error) {
        reject(
          new ProviderRpcError(
            event.data.error.code ?? -32603,
            event.data.error.message ?? "RPC error via content script"
          )
        );
      } else {
        resolve(event.data.result);
      }
    };

    window.addEventListener("message", onMessage);

    // Send request to content script
    window.postMessage(
      {
        source: "xwallet-sdk-rpc",
        callbackId,
        rpcUrl,
        body,
      },
      window.location.origin
    );

    // Timeout after 30s
    setTimeout(() => {
      window.removeEventListener("message", onMessage);
      reject(new ProviderRpcError(-32603, "RPC call timed out via content script"));
    }, 30_000);
  });
}
