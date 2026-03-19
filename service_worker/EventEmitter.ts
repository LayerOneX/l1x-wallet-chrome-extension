import { getDifferentFields } from "@util/Helper";
import { WalletCrypto } from "@util/WalletCrypto.util";

export class ExtensionEventEmitter {
  async #emitEvent(
    changes: { [k in keyof IExtensionStorage]: chrome.storage.StorageChange },
    areaName: "sync" | "local" | "managed" | "session"
  ) {
    switch (true) {
      case changes.connectedSites && areaName == "local": {
        const rawNew = changes?.connectedSites?.newValue;
        const rawOld = changes?.connectedSites?.oldValue;
        const newValue: IExtensionStorage["connectedSites"] = rawNew
          ? JSON.parse(await WalletCrypto.decrypt(rawNew))
          : [];
        const oldValue: IExtensionStorage["connectedSites"] = rawOld
          ? JSON.parse(await WalletCrypto.decrypt(rawOld))
          : [];
        const difference = getDifferentFields<
          IExtensionStorage["connectedSites"][0]
        >(oldValue, newValue);
        const disconnectedAddress: { [site: string]: string[] } = {};
        await Promise.all(
          difference.map(async (diff) => {
            const site = newValue.find((conn) => conn.url == diff.url);
            const oldsite = oldValue.find((conn) => conn.url == diff.url);

            // if site not present in new value
            if (!site) {
              disconnectedAddress[diff.url] = disconnectedAddress[diff.url]
                ? disconnectedAddress[diff.url].concat(diff.accounts)
                : diff.accounts;
              return;
            }

            // if accounts from old value not in new value
            const accounts =
              (await oldsite?.accounts.filter(
                (el) => !site?.accounts.includes(el)
              )) || [];
            disconnectedAddress[diff.url] = disconnectedAddress[diff.url]
              ? disconnectedAddress[diff.url].concat(accounts)
              : accounts;
          })
        );

        if (Object.keys(disconnectedAddress)?.length) {
          chrome.tabs.query({}, (tabs) => {
            tabs.forEach((tab) => {
              if (tab.id && tab.url?.startsWith("http")) {
                chrome.tabs.sendMessage(tab.id, {
                  event: "DISCONNECT",
                  data: disconnectedAddress,
                }).catch(() => {});
              }
            });
          });
        }

        // Emit ACCOUNTS_CHANGED for sites whose accounts changed
        const changedAccounts: { [site: string]: string[] } = {};
        newValue.forEach((site) => {
          const oldSite = oldValue.find((s) => s.url === site.url);
          const oldAccts = oldSite?.accounts ?? [];
          const newAccts = site.accounts ?? [];
          if (JSON.stringify(oldAccts) !== JSON.stringify(newAccts)) {
            changedAccounts[site.url] = newAccts;
          }
        });

        if (Object.keys(changedAccounts).length) {
          chrome.tabs.query({}, (tabs) => {
            tabs.forEach((tab) => {
              if (tab.id && tab.url) {
                try {
                  const tabOrigin = new URL(tab.url).origin;
                  if (changedAccounts[tabOrigin]) {
                    chrome.tabs.sendMessage(tab.id, {
                      event: "ACCOUNTS_CHANGED",
                      data: changedAccounts[tabOrigin],
                    }).catch(() => {});
                  }
                } catch {}
              }
            });
          });
        }
        break;
      }

      case changes.activeNetwork && areaName == "local": {
        try {
          const rawNetwork = changes?.activeNetwork?.newValue;
          if (!rawNetwork) break;
          const newNetwork = JSON.parse(
            await WalletCrypto.decrypt(rawNetwork)
          );
          if (newNetwork?.chainId) {
            const hexChainId = "0x" + newNetwork.chainId.toString(16);
            chrome.tabs.query({}, (tabs) => {
              tabs.forEach((tab) => {
                if (tab.id && tab.url?.startsWith("http")) {
                  chrome.tabs.sendMessage(tab.id, {
                    event: "CHAIN_CHANGED",
                    data: hexChainId,
                  }).catch(() => {});
                }
              });
            });
          }
        } catch {}
        break;
      }

      default:
        break;
    }
  }

  init() {
    chrome.storage.onChanged.addListener(this.#emitEvent as any);
    chrome.runtime.onConnect.addListener(() => {});
  }
}
