import { getDifferentFields } from "@util/Helper";
import { WalletCrypto } from "@util/WalletCrypto.util";

export class ExtensionEventEmitter {
  async #emitEvent(
    changes: { [k in keyof IExtensionStorage]: chrome.storage.StorageChange },
    areaName: "sync" | "local" | "managed" | "session"
  ) {
    switch (true) {
      case changes.connectedSites && areaName == "local": {
        const newValue: IExtensionStorage["connectedSites"] = JSON.parse(
          await WalletCrypto.decrypt(changes?.connectedSites?.newValue)
        );
        const oldValue: IExtensionStorage["connectedSites"] = JSON.parse(
          await WalletCrypto.decrypt(changes?.connectedSites?.oldValue)
        );
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
              if (tab.id) {
                chrome.tabs.sendMessage(tab.id, {
                  event: "DISCONNECT",
                  data: disconnectedAddress,
                });
              }
            });
          });
        }
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
