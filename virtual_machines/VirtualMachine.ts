import {
  GetTransactionReceiptResponse,
  L1XProvider,
} from "@l1x/l1x-wallet-sdk";
import { Connection } from "@solana/web3.js";
import { ApplicationStorage } from "@util/ApplicationStorage.util";
import { ExtensionStorage } from "@util/ExtensionStorage.util";
import { Logger } from "@util/Logger.util";
import { JsonRpcProvider, TransactionReceipt } from "ethers";

export default abstract class VirtualMachine implements IVirtualMachine {
  networkType: VirtualMachineType;
  abstract getProvider(
    providerAttrib?: any
  ): JsonRpcProvider | L1XProvider | Connection;
  protected abstract publicKey: string;
  abstract icon: string;
  get tokenTableName(): `token-${string}-${string}-${string}` {
    return `token-${this.publicKey}-${this.activeNetwork.symbol}-${this.activeNetwork.rpc}`;
  }
  get nftTableName(): `nft-${string}-${string}-${string}` {
    return `nft-${this.publicKey}-${this.activeNetwork.symbol}-${this.activeNetwork.rpc}`;
  }
  chains: IVMChain[];
  activeNetwork: IVMChain;
  constructor(
    networkType: VirtualMachineType,
    chains: IVMChain[],
    activeNetwork: IVMChain
  ) {
    this.networkType = networkType;
    this.chains = chains;
    this.activeNetwork = activeNetwork;
  }

  async changeActiveNetwork(network: IVMChain) {
    const activeEnvironment =
      (await ExtensionStorage.get("activeEnvironment")) ?? "";
    let activeNetwork = this.chains.find(
      (chain) => chain.symbol == network.symbol
    );
    if (activeNetwork) {
      // update active environment
      const environment =
        activeEnvironment &&
        Object.values(activeNetwork.environment ?? {}).find(el => el.rpc == activeEnvironment);
      // update storage and change network
      ExtensionStorage.set("activeNetwork", activeNetwork);
      this.activeNetwork = {
        ...activeNetwork,
        ...(environment ? { rpc: environment.rpc } : {}),
        ...(environment ? { exploreruri: environment.exploreruri } : {}),
      };
    }
  }

  protected async getTokenRate(symbol: string) {
    try {
      symbol = symbol.toUpperCase() == "USDT" ? "USDC" : symbol;
      const usdValue =
        (
          await (
            await fetch(
              `https://api-cloud.bitmart.com/spot/v1/ticker_detail?symbol=${symbol}_USDT`
            )
          ).json()
        )?.data?.last_price ?? 0;
      return !isNaN(usdValue) ? +usdValue : 0;
    } catch (error) {
      return 0;
    }
  }

  protected async saveNativeToken(publicKey: string) {
    try {
      await Promise.all(
        // iterate over chains
        this.chains.map(async (chain) => {
          // iterate over environments
          Object.entries(chain.environment).map(
            async (env) => {
              if (chain.nativeToken && chain.nativeToken.isNative) {
                const tableName: `token-${string}-${string}-${string}` = `token-${publicKey}-${chain.nativeToken.symbol}-${env[1].rpc}`;
                let tokens = (await ApplicationStorage.get(tableName)) ?? [];
                if (
                  tokens.findIndex(
                    (el) =>
                      chain.nativeToken?.symbol &&
                      el.symbol == chain.nativeToken?.symbol
                  ) < 0
                ) {
                  tokens = [chain.nativeToken, ...tokens];
                  await ApplicationStorage.set(tableName, tokens);
                }
              }
              return chain;
            }
          );
        })
      );
      return true;
    } catch (error) {
      Logger.error(error);
      throw {
        errorMessage: "Failed to save native token. Please try again.",
      };
    }
  }

  protected async removeNFT(collectionAddress: string, tokenId: string) {
    let collectionList =
      (await ApplicationStorage.get(this.nftTableName)) ?? {};
    const nftlist = await Promise.all(
      collectionList[collectionAddress].nftList.filter(
        (nft) => nft.tokenId != tokenId
      )
    );
    collectionList[collectionAddress].nftList = nftlist;
    return ApplicationStorage.set(this.nftTableName, collectionList);
  }

  async initiateTransaction(transaction: Transaction): Promise<void> {
    let pendingTransactions =
      (await ExtensionStorage.get("pendingTransactions")) ?? [];
    pendingTransactions = [transaction, ...pendingTransactions];
    ExtensionStorage.set("pendingTransactions", pendingTransactions);
  }

  async addTransaction(
    transaction: Transaction,
    rpc?: string
  ): Promise<boolean> {
    return new Promise<boolean>(async (resolve, reject) => {
      try {
        if (!transaction.hash) {
          throw {
            errorMessage: "Invalid transaction hash.",
          };
        }
        transaction.rpc = rpc ?? this.activeNetwork.rpc;
        let transactions = (await ExtensionStorage.get("transactions")) ?? [];
        transactions = [transaction, ...transactions];
        await ExtensionStorage.set("transactions", transactions);
        await this.removePendingTransaction(transaction.id);
        resolve(true);
      } catch (error) {
        reject(error);
      }
    });
  }

  async removePendingTransaction(id: string): Promise<boolean> {
    return new Promise<boolean>(async (resolve, reject) => {
      try {
        const pendingTransactions =
          (await ExtensionStorage.get("pendingTransactions")) ?? [];
        const currentTransactionIndex = pendingTransactions?.findIndex(
          (el) => el.id == id
        );
        if (currentTransactionIndex >= 0) {
          pendingTransactions?.splice(currentTransactionIndex, 1);
          await ExtensionStorage.set(
            "pendingTransactions",
            pendingTransactions
          );
        }
        resolve(true);
      } catch (error) {
        Logger.error(error);
        reject(error);
      }
    });
  }

  async listTransactions() {
    try {
      let transactions = (await ExtensionStorage.get("transactions")) ?? [];
      transactions = transactions.filter(
        (el) => el.from == this.publicKey && el.rpc == this.activeNetwork.rpc
      );
      return transactions;
    } catch (error: any) {
      throw {
        errorMessage:
          error?.errorMessage ??
          "Failed to list transactions. Please try again.",
      };
    }
  }

  async updateAccountName(account: IXWalletAccount): Promise<void> {
    try {
      const wallets = await ExtensionStorage.get("wallets");
      if (!wallets) {
        throw {
          errorMessage: "Invalid account. Try with valid account.",
        };
      }
      // update wallet account name
      const newWallets = wallets[account.type].map((wallet) =>
        wallet.publicKey == account.publicKey
          ? { ...wallet, accountName: account.accountName }
          : wallet
      );
      wallets[account.type] = newWallets;
      // update active wallet account name
      if (wallets.ACTIVE?.publicKey == account.publicKey) {
        wallets.ACTIVE.accountName = account.accountName;
      }
      // save updated wallets
      ExtensionStorage.set("wallets", wallets);
    } catch (error: any) {
      throw {
        errorMessage:
          error?.errorMessage ??
          "Failed to update account name. Please try again.",
      };
    }
  }

  abstract importToken(_tokenAddress: string): Promise<boolean>;

  abstract importNFT(
    collectionAddress: string,
    tokenId: string,
    walletAddress: string
  ): Promise<boolean>;

  abstract listToken(): Promise<IToken[]>;

  abstract listNFT(): Promise<INFT[]>;

  abstract getNativeTokenDetails(providerAttrib?: any): Promise<IToken>;

  abstract getTokenDetails(
    tokenAddress: string,
    providerAttrib?: any
  ): Promise<IToken>;

  abstract getNFTDetails(
    collectionAddress: string,
    tokenId: string,
    providerAttrib?: any
  ): Promise<INFT>;

  abstract isOwnedNFT(
    collectionAddress: string,
    tokenId: string,
    walletAddress: string,
    providerAttrib?: any
  ): Promise<boolean>;

  abstract transferNativeToken(
    receiverAddress: string,
    amount: number,
    privateKey: string,
    providerAttrib?: any,
    feeLimit?: string,
    nonce?: string
  ): Promise<{ hash: string }>;

  abstract transferToken(
    tokenAddress: string,
    receiverAddress: string,
    amount: number,
    privateKey: string,
    providerAttrib?: any,
    feeLimit?: string,
    nonce?: string
  ): Promise<{ hash: string }>;

  abstract approveNFTTransfer(
    collectionAddress: string,
    tokenId: string,
    privateKey: string,
    providerAttrib?: any
  ): Promise<boolean>;

  abstract transferNFT(
    collectionAddress: string,
    tokenId: string,
    receiverAddress: string,
    privateKey: string,
    providerAttrib?: any,
    feeLimit?: string,
    nonce?: string
  ): Promise<{ hash: string }>;

  abstract createAccount(accountName: string): Promise<boolean>;

  abstract importPrivateKey(
    privateKey: string,
    accountName: string
  ): Promise<boolean>;

  abstract getTransactionReceipt(
    hash: string
  ): Promise<TransactionReceipt | GetTransactionReceiptResponse>;

  abstract convertToDecimals(value: number, decimals: number): any;

  abstract formatDecimals(value: number, decimals: number): any;

  abstract getCurrentNonce(providerAttrib?: any): Promise<string>;

  abstract getEstimateFee(
    providerAttrib?: any,
    transaction?: IFeeEstimateTransaction
  ): Promise<string>;

  abstract signMessage(
    message: string,
    privateKey: string,
    providerAttrib?: any
  ): Promise<string>;

  abstract clone(): VirtualMachine;
}
