import { ExtensionStorage } from "./ExtensionStorage.util";
import { Logger } from "./Logger.util";
import { Util } from "./Util";

export async function getAccount(publicKey: string) {
  const walletAccounts = await ExtensionStorage.get("wallets");
  if (walletAccounts) {
    const { ACTIVE, ...accounts } = walletAccounts;
    return Object.values(accounts)
      .flat()
      .find(
        (account) =>
          account.publicKey &&
          Util.removePrefixOx(account.publicKey).toLowerCase() ==
            Util.removePrefixOx(publicKey).toLowerCase()
      );
  }
  return undefined;
}

export async function listConnectedAccounts(site: string) {
  let sites = (await ExtensionStorage.get("connectedSites")) || [];
  const accounts = sites.find((el) => el.url && el.url == site)?.accounts;
  return accounts;
}

export async function accountConnected(publicKey: string, origin: string) {
  try {
    const connectedSites = (await ExtensionStorage.get("connectedSites")) || [];
    const connected = connectedSites.find(
      (site) => site.url && site.url == origin
    );
    if (!connected) {
      return false;
    }
    return (
      connected?.accounts.findIndex(
        (account) =>
          Util.removePrefixOx(account).toLowerCase() ==
          Util.removePrefixOx(publicKey).toLowerCase()
      ) >= 0
    );
  } catch (error: any) {
    Logger.error(error);
    return false;
  }
}

export async function connectAccountsToSite(
  site: Omit<IConnectedSite, "accounts">,
  accounts: string[]
) {
  try {
    let connectedSites = (await ExtensionStorage.get("connectedSites")) || [];
    // find if site already connected with another account
    const existingSite = connectedSites.find((el) => el.url == site?.url);
    // assign new account list
    const newAccounts = [
      ...new Set([...(existingSite?.accounts || []), ...accounts]),
    ];
    const connection: IConnectedSite = {
      url: existingSite?.url || site.url,
      favIcon: existingSite?.favIcon || site.favIcon,
      permissions: [],
      connectedAt: Date.now(),
      l1xProviderConfig:
        existingSite?.l1xProviderConfig || site.l1xProviderConfig,
      accounts: newAccounts,
    };
    // update accounts if site already connected or else add site
    existingSite
      ? (connectedSites = await Promise.all(
          connectedSites.map((el) => (el.url == site.url ? connection : el))
        ))
      : connectedSites.push(connection);
    // udpate storage
    await ExtensionStorage.set("connectedSites", connectedSites);
    return true;
  } catch (error) {
    throw error;
  }
}

export async function listAccountConnectedSites(publicKey: string) {
  try {
    const sites = (await ExtensionStorage.get("connectedSites")) || [];
    return sites.filter((site) =>
      site.accounts.find((el) => el && el == publicKey)
    );
  } catch (error) {
    throw error;
  }
}

export async function disconnectAccountToSite(site: string, account: string) {
  try {
    let connectedSites = (await ExtensionStorage.get("connectedSites")) || [];
    // find site
    const siteindex = connectedSites.findIndex((el) => el.url == site);
    // throw error if site not exists
    if (siteindex < 0) {
      throw new Error("Invalid site url.");
    }
    // assign new account list
    const newAccounts = connectedSites[siteindex]?.accounts.filter(
      (el) => el != account
    );
    // update site accounts
    connectedSites[siteindex].accounts = newAccounts;
    // udpate storage
    await ExtensionStorage.set("connectedSites", connectedSites);
    return true;
  } catch (error) {
    throw error;
  }
}
