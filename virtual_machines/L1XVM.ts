import VirtualMachine from "./VirtualMachine";
import l1xIcon from "@assets/images/L1X_icon.png";
import { ApplicationStorage } from "@util/ApplicationStorage.util";
import { ethers, formatEther } from "ethers";
import { Util } from "@util/Util";
import { Logger } from "@util/Logger.util";
import { ExtensionStorage } from "@util/ExtensionStorage.util";
import { Buffer } from "buffer";
import { Config } from "@util/Config.util";
import { L1XProvider, ProviderAttrib } from "@l1x/l1x-wallet-sdk";

const chains: IVMChain[] = [
  {
    name: "Layer One X",
    symbol: "L1X",
    icon: l1xIcon,
    rpc: Config.rpc.l1x,
    chainId: 1,
    exploreruri: "https://l1xapp.com/explorer/tx/",
    nativeToken: {
      name: "Layer One X",
      symbol: "L1X",
      decimals: 18,
      total_supply: 0,
      balance: 0,
      tokenAddress: "",
      icon: l1xIcon,
      isNative: true,
      usdRate: 0,
    },
    environment: {
      Mainnet: {
        rpc: Config.rpc.l1x,
        exploreruri: "https://l1xapp.com/explorer/tx/",
      },
      Testnet: {
        rpc: "https://v2-testnet-rpc.l1x.foundation",
        exploreruri: "https://l1xapp.com/testnet-explorer/tx/",
      },
      Devnet: {
        rpc: "https://v2-devnet-rpc.l1x.foundation",
        exploreruri: "https://l1xapp.com/devnet-explorer/tx/",
      },
    },
  },
];

export class L1XVM extends VirtualMachine {
  publicKey: string;
  icon: string = l1xIcon;
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

  getProvider(providerAttrib?: ProviderAttrib) {
    return new L1XProvider(
      providerAttrib || {
        clusterType: "mainnet",
        endpoint: this.activeNetwork.rpc,
      }
    );
  }

  #validateNewAccount(
    wallets: L1XAccounts,
    accountName: string,
    publicKey: string
  ) {
    // do not import if name exists
    if (
      wallets.L1X.findIndex(
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
    if (
      wallets.L1X.findIndex(
        (account) =>
          Util.removePrefixOx(account.publicKey.trim()) ==
          Util.removePrefixOx(publicKey.trim())
      ) >= 0
    ) {
      throw {
        errorMessage:
          "Account already exist. Please try with different private key.",
      };
    }

    return true;
  }

  async importPrivateKey(
    privateKey: string,
    accountName: string
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
      const l1xWallet = await this.getProvider().wallet.importByPrivateKey(
        Util.removePrefixOx(privateKey.trim())
      );

      await this.#validateNewAccount(
        wallets,
        accountName,
        l1xWallet.address_with_prefix
      );

      const newWallet: IXWalletAccount = {
        privateKey: privateKey,
        publicKey: l1xWallet.address_with_prefix,
        accountName,
        type: "L1X",
        createdAt: Date.now(),
        icon: this.icon,
      };
      wallets.L1X.push(newWallet);
      // set imported wallet as active wallet
      wallets.ACTIVE = newWallet;
      // save native token
      await this.saveNativeToken(l1xWallet.address_with_prefix);
      // update wallets
      await ExtensionStorage.set("wallets", wallets);
      // update last login
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
      const standardPath = "m/44'/60'/0'/0";
      const path = `${standardPath}/${wallets.L1X.length}`;
      const hdNode = ethers.HDNodeWallet.fromPhrase(pharse);
      if (!hdNode || !hdNode.mnemonic) {
        throw { errorMessage: "Failed to create HD node wallet." };
      }
      const etherWallet = ethers.HDNodeWallet.fromMnemonic(
        hdNode.mnemonic,
        path
      );
      const l1xWallet = await this.getProvider().wallet.importByPrivateKey(
        Util.removePrefixOx(etherWallet.privateKey.trim())
      );
      await this.#validateNewAccount(
        wallets,
        accountName,
        l1xWallet.address_with_prefix
      );
      const newWallet: IXWalletAccount = {
        privateKey: etherWallet.privateKey,
        publicKey: l1xWallet.address_with_prefix,
        accountName,
        type: "L1X",
        createdAt: Date.now(),
        icon: this.icon,
      };
      // update class instance public key
      this.publicKey = l1xWallet.address_with_prefix;
      // add wallet
      wallets.L1X.push(newWallet);
      // set active wallet as newly created value
      wallets.ACTIVE = newWallet;
      // save native token
      await this.saveNativeToken(l1xWallet.address_with_prefix);
      // update wallet accounts
      await ExtensionStorage.set("wallets", wallets);
      // update last wallet unlocked
      await ExtensionStorage.set("lastWalletUnlocked", Date.now());
      return true;
    } catch (error: any) {
      Logger.error(error);
      throw {
        errorMessage:
          error?.errorMessage || "Failed to create account. Please try again.",
      };
    }
  }

  async importToken(tokenAddress: string) {
    try {
      let tokens = (await ApplicationStorage.get(this.tokenTableName)) || [];
      if (tokens.findIndex((el) => el.tokenAddress == tokenAddress) >= 0) {
        return true;
      }
      const tokenDetails = await this.getProvider().tokens.FT.getAttribute({
        contract_address: Util.removePrefixOx(tokenAddress.trim()),
      });
      const image = (
        await (
          await fetch(
            `https://v2-api.l1xapp.com/api/v2/l1x_token/coins/contract/${Util.add0xToString(
              tokenAddress
            )}`
          )
        ).json()
      )?.data?.image;
      const token: IToken = {
        name: tokenDetails.name,
        symbol: tokenDetails.symbol,
        decimals: tokenDetails.decimals,
        total_supply: parseFloat(formatEther(tokenDetails.total_supply)),
        balance: 0,
        tokenAddress,
        icon: image ?? this.activeNetwork.icon,
        isNative: false,
        usdRate: 0,
      };
      tokens.splice(1, 0, token);
      const tokenSaved = await ApplicationStorage.set(
        this.tokenTableName,
        tokens
      );
      return tokenSaved;
    } catch (error: any) {
      Logger.error(error);
      throw new Error(
        error?.errorMessage ||
          "Failed to import token. Please enter valid token address."
      );
    }
  }

  async isOwnedNFT(
    collectionAddress: string,
    tokenId: string,
    walletAddress: string,
    providerAttrib?: ProviderAttrib
  ) {
    try {
      const nftOwner = await this.getProvider(
        providerAttrib
      ).tokens.NFT.getOwnerOfTokenId({
        contract_address: Util.removePrefixOx(collectionAddress.trim()),
        token_id: tokenId as any,
      });
      if (!nftOwner?.owner_address) {
        throw {
          errorMessage:
            "Failed to retrieve token details. Please enter valid NFT details.",
        };
      }
      if (
        Util.removePrefixOx(
          nftOwner?.owner_address.trim()
        ).toLocaleLowerCase() !=
        Util.removePrefixOx(walletAddress.trim()).toLocaleLowerCase()
      ) {
        return false;
      }
      return true;
    } catch (error: any) {
      throw {
        errorMessage:
          error?.errorMessage ||
          "Failed to retrieve token details. Please enter valid NFT details.",
      };
    }
  }

  async #fetchNFTMetadata(uri: string, tokenid: string) {
    try {
      return (await fetch(uri)).json();
    } catch (error) {
      if (uri.includes("https://fvn-artifact.l1x.foundation")) {
        return {
          description: "L1X FVN",
          name: Util.bigIntToUuid(BigInt(tokenid)),
          icon: "https://l1x.foundation/static/media/logohover.6e135f9a.svg",
        };
      }
      throw error;
    }
  }

  async getNFTDetails(
    collectionAddress: string,
    tokenId: string,
    providerAttrib?: ProviderAttrib
  ): Promise<INFT> {
    try {
      const nftMetadataURI = await this.getProvider(
        providerAttrib
      ).tokens.NFT.getTokenUri({
        token_id: tokenId as any,
        contract_address: Util.removePrefixOx(collectionAddress.trim()),
      });
      const nftMetadata = await this.#fetchNFTMetadata(
        nftMetadataURI.token_uri,
        tokenId
      );
      const nft: INFT = {
        name: nftMetadata?.name || "",
        icon: nftMetadata?.icon || "",
        collectionAddress,
        tokenId,
      };
      return nft;
    } catch (error: any) {
      throw {
        errorMessage:
          error?.errormessage || "Failed to get NFT details. Please try again.",
      };
    }
  }

  async importNFT(
    collectionAddress: string,
    tokenId: string,
    walletAddress: string
  ): Promise<boolean> {
    try {
      walletAddress = Util.removePrefixOx(walletAddress.trim());
      // check nft already imported
      const collectionList =
        (await ApplicationStorage.get(this.nftTableName)) || {};
      let collection = collectionList[collectionAddress];
      if (
        collection &&
        (collection.nftList || []).findIndex((nft) => nft.tokenId == tokenId) >=
          0
      ) {
        return true;
      }
      // validate nft owner
      const ownedNFT = await this.isOwnedNFT(
        collectionAddress,
        tokenId,
        walletAddress
      );
      if (!ownedNFT) {
        throw {
          errorMessage: "Invalid nft owner. Please try with valid nft details.",
        };
      }
      if (!collection) {
        const collectionDetails =
          await this.getProvider().tokens.NFT.getAttribute({
            contract_address: Util.removePrefixOx(collectionAddress.trim()),
          });
        collection = {
          contractAddress: collectionAddress,
          name: collectionDetails.name,
          symbol: collectionDetails.symbol,
          icon: collectionDetails.icon,
          nftList: [],
        };
      }
      const nft = await this.getNFTDetails(collectionAddress, tokenId);
      collection.nftList = [nft, ...collection.nftList];
      collectionList[collectionAddress] = collection;
      return ApplicationStorage.set(this.nftTableName, collectionList);
    } catch (error: any) {
      Logger.error(error);
      throw {
        errorMessage:
          error?.errorMessage ||
          "Failed to import token. Please enter valid token address.",
      };
    }
  }

  async #fetchTokenBalance(
    tokenAddress: string,
    providerAttrib?: ProviderAttrib
  ) {
    try {
      const tokenDetails = await this.getProvider(
        providerAttrib
      ).tokens.FT.getBalance({
        contract_address: Util.removePrefixOx(tokenAddress.trim()),
        address: Util.removePrefixOx(this.publicKey.trim()),
      });
      return +parseFloat(tokenDetails.normalized_value).toFixed(2);
    } catch (error) {
      return 0;
    }
  }

  async #getNativeTokenBalance(providerAttrib?: ProviderAttrib) {
    try {
      const tokenDetails = await this.getProvider(
        providerAttrib
      ).core.getAccountState({
        address: Util.removePrefixOx(this.publicKey.trim()),
      });
      return +parseFloat(tokenDetails.account_state.balance_formatted).toFixed(
        2
      );
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
          usdRate: token.isNative ? usdRate : 0,
        };
      })
    );
    return tokens;
  }

  async listNFT() {
    const collectionList =
      (await ApplicationStorage.get(this.nftTableName)) || {};
    return Object.values(collectionList)
      .map((collection) => collection.nftList)
      .flat();
  }

  async getNativeTokenDetails(
    providerAttrib?: ProviderAttrib
  ): Promise<IToken> {
    const usdRate = await this.getTokenRate(
      this.activeNetwork.nativeToken.symbol
    );
    const balance = await this.#getNativeTokenBalance(providerAttrib);
    return {
      ...this.activeNetwork.nativeToken,
      balance: balance,
      usdRate: usdRate,
    };
  }

  async getTokenDetails(
    tokenAddress: string,
    providerAttrib?: ProviderAttrib
  ): Promise<IToken> {
    try {
      const tokenDetails = await this.getProvider(
        providerAttrib
      ).tokens.FT.getAttribute({
        contract_address: Util.removePrefixOx(tokenAddress.trim()),
      });
      const image = (
        await (
          await fetch(
            `https://v2-api.l1xapp.com/api/v2/l1x_token/coins/contract/${Util.add0xToString(
              tokenAddress
            )}`
          )
        ).json()
      )?.data?.image;
      return {
        name: tokenDetails.name,
        symbol: tokenDetails.symbol,
        decimals: !isNaN(tokenDetails.decimals) ? tokenDetails.decimals : 0,
        total_supply: parseFloat(tokenDetails.total_supply),
        balance: await this.#fetchTokenBalance(tokenAddress),
        tokenAddress: tokenAddress,
        icon: image || l1xIcon,
        isNative: false,
        usdRate: 0,
      };
    } catch (error) {
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

  clone() {
    return new L1XVM(
      this.networkType,
      this.publicKey,
      this.activeNetwork.chainId.toString()
    );
  }

  async #validateTransaction(hash: string, providerAttrib?: ProviderAttrib) {
    await new Promise((resolve) => {
      setTimeout(resolve, 3000);
    });
    const receipt = await this.getProvider(
      providerAttrib
    ).core.getTransactionReceipt({
      hash,
    });
    return (
      typeof receipt.status != "undefined" &&
      !isNaN(receipt.status as any) &&
      +receipt.status == 0
    );
  }

  async transferNativeToken(
    receiverAddress: string,
    value: number, // value must me in decimal places
    privateKey: string,
    providerAttrib?: ProviderAttrib,
    _feeLimit?: string,
    _nonce?: string
  ) {
    try {
      const response = await this.getProvider(providerAttrib).core.transfer({
        receipient_address: Util.removePrefixOx(receiverAddress.trim()),
        private_key: Util.removePrefixOx(privateKey.trim()),
        value: value,
        // fee_limit: feeLimit ? +Config.l1xFeeLimit : undefined,
        // nonce: nonce ? +nonce : undefined,
      });
      const txStatus = await this.#validateTransaction(
        response.hash,
        providerAttrib
      );
      if (!txStatus) {
        throw new Error("Account not found.");
      }
      return response;
    } catch (error: any) {
      throw {
        errorMessage:
          error?.errorMessage || "Failed to transfer token. Please try again.",
      };
    }
  }

  async transferToken(
    tokenAddress: string,
    receiverAddress: string,
    value: number, // value must me in decimal places
    privateKey: string,
    providerAttrib?: ProviderAttrib,
    feeLimit?: string,
    _nonce?: string
  ) {
    try {
      const tokenDetails = await this.getTokenDetails(
        tokenAddress,
        providerAttrib
      );
      if (!tokenDetails || !tokenDetails.symbol) {
        throw {
          errorMessage:
            "Invalid token address. Please try with valid token address.",
        };
      }
      const amount = value / 10 ** tokenDetails.decimals;
      if (tokenDetails.balance < amount) {
        throw {
          errorMessage: "Insufficient balance.",
        };
      }
      const response = await this.getProvider(
        providerAttrib
      ).tokens.FT.transfer({
        attrib: {
          contract_address: Util.removePrefixOx(tokenAddress.trim()),
          recipient_address: Util.removePrefixOx(receiverAddress.trim()),
          value: value,
        },
        private_key: Util.removePrefixOx(privateKey.trim()),
        fee_limit: feeLimit ?? (Config.l1xFeeLimit as any),
      });
      const txStatus = await this.#validateTransaction(
        response.hash,
        providerAttrib
      );
      if (!txStatus) {
        throw new Error("Failed to validate transaction.");
      }
      return response;
    } catch (error: any) {
      Logger.error(error);
      throw {
        errorMessage:
          error?.errorMessage || "Failed to transfer token. Please try again.",
      };
    }
  }

  async transferNFT(
    collectionAddress: string,
    tokenId: string,
    receiverAddress: string,
    privateKey: string,
    providerAttrib?: ProviderAttrib,
    feeLimit?: string,
    _nonce?: string
  ): Promise<{ hash: string }> {
    try {
      // validate nft
      const ownedNFT = await this.isOwnedNFT(
        collectionAddress,
        tokenId,
        this.publicKey,
        providerAttrib
      );
      if (!ownedNFT) {
        throw {
          errorMessage: "Invalid nft owner. Please try with valid nft details.",
        };
      }
      // transfer nft
      const transaction = await this.getProvider(
        providerAttrib
      ).tokens.NFT.transferFrom({
        attrib: {
          contract_address: Util.removePrefixOx(collectionAddress.trim()),
          recipient_address: Util.removePrefixOx(receiverAddress.trim()),
          token_id: +tokenId,
        },
        private_key: Util.removePrefixOx(privateKey.trim()),
        fee_limit: feeLimit ?? (Config.l1xFeeLimit as any),
      });
      await new Promise((resolve) => setTimeout(() => resolve(true), 3000));
      // validate nft owner
      const ownedAfterTransfer = await this.isOwnedNFT(
        collectionAddress,
        tokenId,
        this.publicKey,
        providerAttrib
      );
      if (ownedAfterTransfer) {
        throw {
          errorMessage: "Failed to transfer nft. Please try again.",
        };
      }
      // remove nft from collection
      await this.removeNFT(collectionAddress, tokenId);
      return transaction;
    } catch (error: any) {
      Logger.error(error);
      throw {
        errorMessage:
          error?.errorMessage || "Failed to transfer NFT. Please try again.",
      };
    }
  }

  async approveNFTTransfer(
    collectionAddress: string,
    tokenId: string,
    privateKey: string,
    providerAttrib?: ProviderAttrib,
    feeLimit?: number
  ): Promise<boolean> {
    try {
      // validate nft ownership
      const ownedNFT = await this.isOwnedNFT(
        collectionAddress,
        tokenId,
        this.publicKey,
        providerAttrib
      );
      if (!ownedNFT) {
        throw {
          errorMessage: "Invalid nft owner. Please try with valid nft details.",
        };
      }

      const transaction = await this.getProvider(
        providerAttrib
      ).tokens.NFT.approve({
        attrib: {
          contract_address: Util.removePrefixOx(collectionAddress.trim()),
          spender_address: Util.removePrefixOx(this.publicKey.trim()),
          token_id: +tokenId as any,
        },
        private_key: Util.removePrefixOx(privateKey.trim()),
        fee_limit: feeLimit
      });
      // validate transaction
      const txStatus = await this.#validateTransaction(
        transaction.hash,
        providerAttrib
      );
      if (!txStatus) {
        throw new Error("Failed to validate transaction.");
      }
      return true;
    } catch (error: any) {
      throw {
        errorMessage:
          error?.errorMessage ||
          "Failed to approve NFT transfer. Please try again.",
      };
    }
  }

  async getTransactionReceipt(hash: string, providerAttrib?: ProviderAttrib) {
    const receipt = await this.getProvider(
      providerAttrib
    )?.core.getTransactionReceipt({
      hash: hash || "",
    });
    return receipt;
  }

  convertToDecimals(value: number, decimals = 18): any {
    return ethers.parseUnits(value.toString(), decimals).toString();
  }

  formatDecimals(value: number, decimals = 18): any {
    return ethers.formatUnits(BigInt(value), +decimals).toString();
  }

  async getCurrentNonce(providerAttrib?: any): Promise<string> {
    const nonce = await this.getProvider(providerAttrib).core.getCurrentNonce({
      address: Util.removePrefixOx(this.publicKey.trim()),
    });
    return (+nonce + 1).toString();
  }

  async getEstimateFee(
    _providerAttrib?: any,
    _transaction?: IFeeEstimateTransaction
  ): Promise<string> {
    return Config.l1xFeeLimit.toFixed();
  }

  async signMessage(
    message: string,
    privateKey: string,
    _providerAttrib?: any
  ): Promise<string> {
    try {
      const wallet = new ethers.Wallet(privateKey);
      const signedMessage = await wallet.signMessage(message);
      return signedMessage;
    } catch (error) {
      throw error;
    }
  }
}
