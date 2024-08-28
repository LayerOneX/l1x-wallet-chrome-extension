import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  ParsedAccountData,
  PublicKey,
} from "@solana/web3.js";
import VirtualMachine from "./VirtualMachine";
import solanaIcon from "@assets/images/solana.png";
import { Config } from "@util/Config.util";
import { ExtensionStorage } from "@util/ExtensionStorage.util";
import { Util } from "@util/Util";
import bs58 from "bs58";
import { deriveEd25519Path } from "@ton/crypto";
import { mnemonicToSeedSync } from "bip39";
import { GetTransactionReceiptResponse } from "@l1x/l1x-wallet-sdk";
import { TransactionReceipt, ethers } from "ethers";
import { Logger } from "@util/Logger.util";
import { Buffer } from "buffer";
import { ApplicationStorage } from "@util/ApplicationStorage.util";
import {
  getAssociatedTokenAddress,
  getTokenMetadata,
  getMint,
  getAccount,
} from "@solana/spl-token";

const chains: IVMChain[] = [
  {
    name: "Solana Chain",
    symbol: "SOL",
    icon: solanaIcon,
    rpc: Config.rpc.solana,
    chainId: Config.chainId.solana,
    exploreruri: "https://solana.fm/tx/",
    nativeToken: {
      name: "Solana",
      symbol: "SOL",
      decimals: 9,
      total_supply: 0,
      balance: 0,
      tokenAddress: "",
      icon: solanaIcon,
      isNative: true,
      usdRate: 0,
    },
    environment: {
      Mainnet: {
        rpc: Config.rpc.solana,
        exploreruri: "https://solana.fm/tx/",
      },
    },
  },
];

export default class SolanaVM extends VirtualMachine {
  publicKey: string;
  icon: string = solanaIcon;
  getProvider() {
    return new Connection(this.activeNetwork.rpc);
  }
  constructor(
    networkType: VirtualMachineType,
    publicKey: string,
    chainId: string
  ) {
    const activeChain =
      chains.find((el) => el.chainId.toString() == chainId.toString()) ||
      chains[0];
    super(networkType, chains, activeChain);
    this.publicKey = publicKey;
  }

  async #validateNewAccount(
    wallets: L1XAccounts,
    accountName: string,
    publicKey: string,
    source: 'create' | 'import'
  ) {
    // do not import if name exists
    if (
      wallets["NON-EVM"].findIndex(
        (account) =>
          accountName.trim() && account.accountName == accountName.trim()
      ) >= 0
    ) {
      throw {
        errorMessage:
          "Account name already exist. Please try with different account name.",
      };
    }

    // do not import if wallet present
    const accountIndex = wallets["NON-EVM"].findIndex(
      (account) =>
        Util.removePrefixOx(account.publicKey) ==
        Util.removePrefixOx(publicKey)
    )
    if (accountIndex >= 0) {
      if (source == 'create') {
        wallets["NON-EVM"][accountIndex].createdFromSeed = true;
        await this.updateAccount(wallets["NON-EVM"][accountIndex]);
      }
      throw {
        errorMessage:
          "Account already exist. Please try with different private key.",
      };
    }

    return true;
  }

  async importPrivateKey(
    privateKey: string,
    accountName: string,
    createdFromSeed?: boolean
  ): Promise<boolean> {
    try {
      if (!accountName) {
        throw {
          errormessage:
            "Invalid account name. Please try with valid account name.",
        };
      }
      const wallets: L1XAccounts = (await ExtensionStorage.get("wallets")) || {
        L1X: [],
        EVM: [],
        "NON-EVM": [],
        ACTIVE: null,
      };
      const solWallet = Keypair.fromSecretKey(bs58.decode(privateKey));

      await this.#validateNewAccount(
        wallets,
        accountName,
        solWallet.publicKey.toBase58(),
        'import'
      );

      const newWallet: IXWalletAccount = {
        privateKey: privateKey,
        publicKey: solWallet.publicKey.toBase58(),
        accountName,
        type: "NON-EVM",
        createdAt: Date.now(),
        icon: solanaIcon,
        createdFromSeed: createdFromSeed ?? false
      };
      wallets["NON-EVM"].push(newWallet);
      // set imported wallet as active wallet
      wallets.ACTIVE = newWallet;
      // save native token
      await this.saveNativeToken(solWallet.publicKey.toBase58());
      // update wallet list
      await ExtensionStorage.set("wallets", wallets);
      // update last wallet unlocked
      await ExtensionStorage.set("lastWalletUnlocked", Date.now());
      return true;
    } catch (error: any) {
      throw {
        errorMessage:
          error?.errorMessage ||
          "Invalid private key. Please try with valid private key.",
      };
    }
  }

  async createAccount(accountName: string): Promise<boolean> {
    try {
      window.Buffer = Buffer;
      const wallets: L1XAccounts = (await ExtensionStorage.get("wallets")) || {
        L1X: [],
        EVM: [],
        "NON-EVM": [],
        ACTIVE: null,
      };
      const pharse = await ExtensionStorage.get("mnemonic");
      if (pharse === null) {
        throw {
          body: { errorMessage: "Unable to create wallet. Invalid mnemonic." },
        };
      }
      const seed = mnemonicToSeedSync(pharse, "");
      var path = [44, 501, wallets["NON-EVM"].length, 0];
      const derivedSeed: Buffer = await deriveEd25519Path(seed, path);
      const solWallet = Keypair.fromSeed(derivedSeed);

      await this.#validateNewAccount(
        wallets,
        accountName,
        solWallet.publicKey.toBase58(),
        'create'
      );

      const newWallet: IXWalletAccount = {
        privateKey: bs58.encode(solWallet.secretKey),
        publicKey: solWallet.publicKey.toBase58(),
        accountName,
        type: "NON-EVM",
        createdAt: Date.now(),
        icon: solanaIcon,
        createdFromSeed: true
      };
      // add account
      wallets["NON-EVM"].push(newWallet);
      // set active account
      wallets.ACTIVE = newWallet;
      // save native token
      await this.saveNativeToken(solWallet.publicKey.toBase58());
      // update wallets
      await ExtensionStorage.set("wallets", wallets);
      // update last wallet unlocked
      await ExtensionStorage.set("lastWalletUnlocked", Date.now());
      return true;
    } catch (error: any) {
      Logger.log(error);
      throw {
        errorMessage:
          error?.errorMessage || "Failed to create account. Please try again.",
      };
    }
  }

  importToken(_tokenAddress: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  importNFT(_collectionAddress: string, _tokenId: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  async #getNativeTokenBalance() {
    try {
      const publicKey = new PublicKey(this.publicKey);
      const balance = await this.getProvider().getBalance(publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      return 0;
    }
  }

  async #fetchTokenBalance(tokenAddress: string) {
    try {
      const publicKey = new PublicKey(this.publicKey);
      const tokenPublicKey = new PublicKey(tokenAddress);
      const associatedTokenAccount = await getAssociatedTokenAddress(
        tokenPublicKey,
        publicKey
      );
      const accountInfo = await this.getProvider().getParsedAccountInfo(
        associatedTokenAccount
      );
      if (!accountInfo.value) {
        return 0;
      }
      return (accountInfo.value.data as ParsedAccountData).parsed.info
        .tokenAmount.uiAmount;
    } catch (error) {
      return 0;
    }
  }

  async listToken() {
    let tokens = (await ApplicationStorage.get(this.tokenTableName)) || [];
    tokens = await Promise.all(
      tokens.map(async (token) => {
        const balance = token.isNative
          ? await this.#getNativeTokenBalance()
          : await this.#fetchTokenBalance(token.tokenAddress);
        const usdRate = await this.getTokenRate(token.symbol);
        return {
          ...token,
          balance: balance,
          usdRate: usdRate,
        };
      })
    );
    return tokens;
  }
  async listNFT(): Promise<INFT[]> {
    throw new Error("Method not implemented.");
  }
  async getTokenDetails(tokenAddress: string): Promise<IToken> {
    try {
      const publicKey = new PublicKey(this.publicKey);
      const tokenAccount = await getAccount(this.getProvider(), publicKey);
      const tokenDetails = await getTokenMetadata(
        this.getProvider(),
        tokenAccount.address
      );
      const mintinfo = await getMint(this.getProvider(), tokenAccount.address);
      return {
        name: tokenDetails?.name || "",
        symbol: tokenDetails?.symbol || "",
        decimals: !isNaN(mintinfo.decimals) ? mintinfo.decimals : 0,
        total_supply: parseFloat(mintinfo.supply.toString()),
        balance: await this.#fetchTokenBalance(tokenAddress),
        tokenAddress: tokenAddress,
        icon: tokenDetails?.uri || solanaIcon,
        isNative: false,
        usdRate: 0,
      };
    } catch (error) {
      Logger.error(error);
      return {
        name: "",
        symbol: "",
        decimals: 0,
        total_supply: 0,
        balance: 0,
        tokenAddress: "",
        icon: "",
        isNative: false,
        usdRate: 0,
      };
    }
  }
  getNativeTokenDetails(): Promise<IToken> {
    throw new Error("Method not implemented.");
  }
  getNFTDetails(_collectionAddress: string, _tokenId: string): Promise<INFT> {
    throw new Error("Method not implemented.");
  }
  transferNativeToken(
    _receiverAddress: string,
    _amount: number,
    _privateKey: string
  ): Promise<{ hash: string }> {
    throw new Error("Method not implemented.");
  }
  transferToken(
    _tokenAddress: string,
    _receiverAddress: string,
    _amount: number,
    _privateKey: string
  ): Promise<{ hash: string }> {
    throw new Error("Method not implemented.");
  }
  transferNFT(
    _collectionAddress: string,
    _tokenId: string,
    _receiverAddress: string,
    _privateKey: string
  ): Promise<{ hash: string }> {
    throw new Error("Method not implemented.");
  }
  approveNFTTransfer(
    _collectionAddress: string,
    _tokenId: string,
    _privateKey: string
  ): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  isOwnedNFT(
    _collectionAddress: string,
    _tokenId: string,
    _walletAddress: string
  ): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  clone(): VirtualMachine {
    throw new Error("Method not implemented.");
  }
  getTransactionReceipt(
    _hash: string
  ): Promise<TransactionReceipt | GetTransactionReceiptResponse> {
    throw new Error("Method not implemented.");
  }
  convertToDecimals(value: number, decimals = 9): any {
    return ethers.parseUnits(value.toString(), decimals);
  }
  getCurrentNonce(_providerAttrib?: any): Promise<string> {
    throw new Error("Method not implemented.");
  }
  getEstimateFee(
    _providerAttrib?: any,
    _transaction?: IFeeEstimateTransaction
  ): Promise<string> {
    throw new Error("Method not implemented.");
  }
  formatDecimals(value: number, decimals = 9) {
    return ethers.formatUnits(BigInt(value), +decimals);
  }
  signMessage(
    _message: string,
    _privateKey: string,
    _providerAttrib?: any
  ): Promise<string> {
    throw new Error("Method not implemented.");
  }
}
