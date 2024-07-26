import VirtualMachine from "./VirtualMachine";
import ethIcon from "@assets/images/ethereum.svg";
import maticIcon from "@assets/images/matic.svg";
import bscIcon from "@assets/images/binance.svg";
import avaxIcon from "@assets/images/avalanche.svg";
import opmIcon from "@assets/images/optimism.svg";
import { ApplicationStorage } from "@util/ApplicationStorage.util";
import { TransactionReceipt, ethers, JsonRpcProvider } from "ethers";
import ERC20ABI from "@abi/ERC20.json";
import ERC721ABI from "@abi/ERC721.json";
import { Config } from "@util/Config.util";
import evmIcon from "@assets/images/evm.svg";
import { Logger } from "@util/Logger.util";
import { Util } from "@util/Util";
import { ExtensionStorage } from "@util/ExtensionStorage.util";
import { Buffer } from "buffer";

const chains: IVMChain[] = [
  {
    name: "Ethereum Chain",
    symbol: "ETH",
    icon: ethIcon,
    rpc: Config.rpc.ethereum,
    chainId: Config.chainId.ethereum,
    exploreruri: "https://etherscan.io/tx/",
    nativeToken: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
      total_supply: 0,
      balance: 0,
      tokenAddress: "",
      icon: ethIcon,
      isNative: true,
      usdRate: 0,
    },
    environment: {
      Mainnet: {
        rpc: Config.rpc.ethereum,
        exploreruri: "https://etherscan.io/tx/"
      }
    }
  },
  {
    name: "Polygon Chain",
    symbol: "MATIC",
    icon: maticIcon,
    rpc: Config.rpc.polygon,
    chainId: Config.chainId.polygon,
    exploreruri: "https://polygonscan.com/tx/",
    nativeToken: {
      name: "Polygon",
      symbol: "MATIC",
      decimals: 18,
      total_supply: 0,
      balance: 0,
      tokenAddress: "",
      icon: maticIcon,
      isNative: true,
      usdRate: 0,
    },
    environment: {
      Mainnet: {
        rpc: Config.rpc.polygon,
        exploreruri: "https://polygonscan.com/tx/"
      }
    }
  },
  {
    name: "Binance Smart Chain",
    symbol: "BNB",
    icon: bscIcon,
    rpc: Config.rpc.binance,
    chainId: Config.chainId.binance,
    exploreruri: "https://bscscan.com/tx/",
    nativeToken: {
      name: "Binance",
      symbol: "BNB",
      decimals: 18,
      total_supply: 0,
      balance: 0,
      tokenAddress: "",
      icon: bscIcon,
      isNative: true,
      usdRate: 0,
    },
    environment: {
      Mainnet: {
        rpc: Config.rpc.binance,
        exploreruri: "https://bscscan.com/tx/"
      }
    }
  },
  {
    name: "Avalanche C Chain",
    symbol: "AVAX",
    icon: avaxIcon,
    rpc: Config.rpc.avalanche,
    chainId: Config.chainId.avalanche,
    exploreruri: "https://snowtrace.io/tx/",
    nativeToken: {
      name: "Avalanche",
      symbol: "AVAX",
      decimals: 18,
      total_supply: 0,
      balance: 0,
      tokenAddress: "",
      icon: avaxIcon,
      isNative: true,
      usdRate: 0,
    },
    environment: {
      Mainnet: {
        rpc: Config.rpc.avalanche,
        exploreruri: "https://snowtrace.io/tx/"
      }
    }
  },
  {
    name: "Optimism Chain",
    symbol: "OP",
    icon: opmIcon,
    rpc: Config.rpc.optimisim,
    chainId: Config.chainId.optimisim,
    exploreruri: "https://optimistic.etherscan.io/tx/",
    nativeToken: {
      name: "Optimism",
      symbol: "OP",
      decimals: 18,
      total_supply: 0,
      balance: 0,
      tokenAddress: "",
      icon: opmIcon,
      isNative: true,
      usdRate: 0,
    },
    environment: {
      Mainnet: {
        rpc: Config.rpc.optimisim,
        exploreruri: "https://optimistic.etherscan.io/tx/"
      }
    }
  },
];

export default class EVM extends VirtualMachine {
  publicKey: string;
  icon: string = evmIcon;
  getProvider(_providerAttrib?: any) {
    return new JsonRpcProvider(this.activeNetwork.rpc);
  }
  constructor(
    networkType: VirtualMachineType,
    publicKey: string,
    chainId: string,
  ) {
    const activeChain =
      chains.find((el) => el.chainId.toString() == chainId.toString()) ??
      chains[0];
    super(networkType, chains, activeChain);
    this.publicKey = publicKey;
  }

  #validateNewAccount(
    wallets: L1XAccounts,
    accountName: string,
    publicKey: string
  ) {
    // do not import if name exists
    if (
      wallets.EVM.findIndex(
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
      wallets.EVM.findIndex(
        (account) =>
          Util.removePrefixOx(account.publicKey) ==
          Util.removePrefixOx(publicKey)
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
      const wallets: L1XAccounts = (await ExtensionStorage.get("wallets")) ?? {
        L1X: [],
        EVM: [],
        "NON-EVM": [],
        ACTIVE: null,
      };
      const evmWallet = new ethers.Wallet(privateKey);

      await this.#validateNewAccount(wallets, accountName, evmWallet.address);

      const newWallet: IXWalletAccount = {
        privateKey: privateKey,
        publicKey: evmWallet.address,
        accountName,
        type: "EVM",
        createdAt: Date.now(),
        icon: this.icon,
      };
      wallets.EVM.push(newWallet);
      // set imported wallet as active wallet
      wallets.ACTIVE = newWallet;
      // save native token
      await this.saveNativeToken(evmWallet.address);
      // update wallets
      await ExtensionStorage.set("wallets", wallets);
      // update last login
      await ExtensionStorage.set("lastWalletUnlocked", Date.now());
      return true;
    } catch (error: any) {
      Logger.error(error);
      throw {
        errorMessage:
          error?.errorMessage ??
          "Invalid private key. Please try with valid private key.",
      };
    }
  }

  async createAccount(accountName: string): Promise<boolean> {
    try {
      window.Buffer = Buffer;
      const wallets: L1XAccounts = (await ExtensionStorage.get("wallets")) ?? {
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
      const path = `${standardPath}/${wallets.EVM.length}`;
      const hdNode = ethers.HDNodeWallet.fromPhrase(pharse);
      if (!hdNode || !hdNode.mnemonic) {
        throw { errorMessage: "Failed to create HD node wallet." };
      }
      const etherWallet = ethers.HDNodeWallet.fromMnemonic(
        hdNode.mnemonic,
        path
      );

      await this.#validateNewAccount(wallets, accountName, etherWallet.address);

      const newWallet: IXWalletAccount = {
        privateKey: etherWallet.privateKey,
        publicKey: etherWallet.address,
        accountName,
        type: "EVM",
        createdAt: Date.now(),
        icon: this.icon,
      };
      // update class instance public key
      this.publicKey = etherWallet.address;
      // add new wallet
      wallets.EVM.push(newWallet);
      // change active wallet
      wallets.ACTIVE = newWallet;
      // save native tokens
      await this.saveNativeToken(this.publicKey);
      // update wallet accounts
      await ExtensionStorage.set("wallets", wallets);
      // update last account unlocked
      await ExtensionStorage.set("lastWalletUnlocked", Date.now());
      return true;
    } catch (error: any) {
      throw {
        errorMessage:
          error?.errorMessage ??
          "Invalid private key. Please try with valid private key.",
      };
    }
  }

  async importToken(tokenAddress: string) {
    try {
      let tokens = (await ApplicationStorage.get(this.tokenTableName)) ?? [];
      if (tokens.findIndex((el) => el.tokenAddress == tokenAddress) >= 0) {
        return true;
      }
      const contract = new ethers.Contract(
        tokenAddress,
        ERC20ABI.abi,
        this.getProvider()
      );
      const imageResponse = await this.#fetch(`https://api.coingecko.com/api/v3/coins/${this.activeNetwork.nativeToken.name.toLowerCase()}/contract/${Util.add0xToString(tokenAddress)}`);
      const token: IToken = {
        name: await contract.name(),
        symbol: await contract.symbol(),
        decimals: Number(await contract.decimals()),
        total_supply: Number(await contract.totalSupply()),
        balance: 0,
        tokenAddress,
        icon: imageResponse?.image?.small ?? imageResponse?.image?.thumb ?? this.activeNetwork?.icon,
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
      Logger.log(error);
      throw new Error(
        error?.customMsg ??
          "Failed to import token. Please enter valid token address."
      );
    }
  }

  async isOwnedNFT(
    collectionAddress: string,
    tokenId: string,
    walletAddress: string
  ) {
    try {
      const collectionContract = new ethers.Contract(
        collectionAddress,
        ERC721ABI.abi,
        this.getProvider()
      );
      const nftOwner = await collectionContract.ownerOf(tokenId);
      if (
        Util.removePrefixOx(nftOwner).toLowerCase() !=
        Util.removePrefixOx(walletAddress).toLowerCase()
      ) {
        return false;
      }
      return true;
    } catch (error) {
      Logger.error(error);
      throw {
        errorMessage: "Invalid owner. Please enter valid NFT details.",
      };
    }
  }

  async #fetch(uri: string) {
    return (await fetch(uri)).json();
  }

  async getNFTDetails(
    collectionAddress: string,
    tokenId: string
  ): Promise<INFT> {
    try {
      const collectionContract = new ethers.Contract(
        collectionAddress,
        ERC721ABI.abi,
        this.getProvider()
      );
      const tokenURI = await collectionContract.tokenURI(tokenId);
      // fetch metadata
      const nftMetadata = await this.#fetch(
        Util.filterIPFS(tokenURI)
      );
      return {
        name: nftMetadata?.name ?? "",
        icon: Util.filterIPFS(nftMetadata?.image) ?? "",
        collectionAddress,
        tokenId,
      };
    } catch (error: any) {
      Logger.error(error);
      throw {
        errorMessage:
          error?.errormessage ?? "Failed to get NFT details. Please try again.",
      };
    }
  }

  async importNFT(
    collectionAddress: string,
    tokenId: string,
    walletAddress: string
  ): Promise<boolean> {
    try {
      walletAddress = Util.add0xToString(walletAddress);
      const collectionContract = new ethers.Contract(
        collectionAddress,
        ERC721ABI.abi,
        this.getProvider()
      );
      const collectionList =
        (await ApplicationStorage.get(this.nftTableName)) ?? {};
      let collection = collectionList[collectionAddress];

      // check if nft already imported
      if (
        collection &&
        (collection.nftList || []).findIndex((nft) => nft.tokenId == tokenId) >=
          0
      ) {
        return true;
      }

      // validate nft
      const isnftowner = await this.isOwnedNFT(
        collectionAddress,
        tokenId,
        this.publicKey
      );
      if (!isnftowner) {
        throw {
          errorMessage: "Invalid nft owner. Please try with valid nft owner.",
        };
      }

      // add collection details if collection not present
      if (!collection) {
        collection = {
          contractAddress: collectionAddress,
          name: await collectionContract.name(),
          symbol: await collectionContract.symbol(),
          icon: evmIcon,
          nftList: [],
        };
      }
      // fetch nft details
      const nft = await this.getNFTDetails(collectionAddress, tokenId);
      // update active collection's nft list
      collection.nftList = [nft, ...collection.nftList];
      // update active collection
      collectionList[collectionAddress] = collection;
      return ApplicationStorage.set(this.nftTableName, collectionList);
    } catch (error: any) {
      Logger.error(error);
      throw {
        errorMessage:
          error?.errorMessage ?? "Failed to retrieve collection details.",
      };
    }
  }

  async #getNativeTokenBalance() {
    try {
      const balance = await this.getProvider().getBalance(this.publicKey);
      return +ethers.formatEther(balance);
    } catch (error) {
      return 0;
    }
  }

  async #fetchTokenBalance(tokenAddress: string) {
    try {
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ERC20ABI.abi,
        this.getProvider()
      );
      let decimals = await tokenContract.decimals();
      const balance = await tokenContract.balanceOf(this.publicKey);
      return (
        parseFloat(balance.toString()) / 10 ** parseFloat(decimals.toString())
      );
    } catch (error) {
      return 0;
    }
  }

  async listToken(): Promise<IToken[]> {
    let tokens = (await ApplicationStorage.get(this.tokenTableName)) ?? [];
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
    const collectionList =
      (await ApplicationStorage.get(this.nftTableName)) ?? {};
    return Object.values(collectionList)
      .map((collection) => collection.nftList)
      .flat();
  }

  async getNativeTokenDetails(): Promise<IToken> {
    const usdRate = await this.getTokenRate(
      this.activeNetwork.nativeToken.symbol
    );
    const balance = await this.#getNativeTokenBalance();
    return {
      ...this.activeNetwork.nativeToken,
      balance: balance,
      usdRate: usdRate,
    };
  }

  async getTokenDetails(tokenAddress: string): Promise<IToken> {
    try {
      const contract = new ethers.Contract(
        tokenAddress,
        ERC20ABI.abi,
        this.getProvider()
      );
      const symbol = await contract.symbol();
      const usdRate = await this.getTokenRate(symbol)
      const imageResponse = await this.#fetch(`https://api.coingecko.com/api/v3/coins/${this.activeNetwork.nativeToken.name.toLowerCase()}/contract/${Util.add0xToString(tokenAddress)}`);
      const tokenDetails: IToken = {
        name: await contract.name(),
        symbol: symbol,
        decimals: Number(await contract.decimals()),
        total_supply: Number(await contract.totalSupply()),
        balance: await this.#fetchTokenBalance(tokenAddress),
        tokenAddress,
        icon: imageResponse?.image?.small ?? imageResponse?.image?.thumb ?? this.activeNetwork?.icon,
        isNative: false,
        usdRate: usdRate,
      };

      return tokenDetails;
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

  clone(): VirtualMachine {
    return new EVM(
      this.networkType,
      this.publicKey,
      this.activeNetwork.chainId.toString()
    );
  }

  async transferNativeToken(
    receiverAddress: string,
    amountInWei: number, // value must me in decimal places
    privateKey: string,
    providerAttrib: any
  ) {
    try {
      const wallet = new ethers.Wallet(
        privateKey,
        this.getProvider(providerAttrib)
      );
      const feeData = await this.getProvider(providerAttrib).getFeeData();
      const tx = {
        to: receiverAddress,
        value: amountInWei.toString(),
        gasLimit: 21000,
        maxFeePerGas: feeData.maxFeePerGas,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
        nonce: await this.getProvider(providerAttrib).getTransactionCount(
          this.publicKey,
          "latest"
        ),
      };
      const transaction = await wallet.sendTransaction(tx);
      await transaction.wait();
      return {
        hash: transaction.hash,
      };
    } catch (error: any) {
      Logger.error(error);
      throw {
        errorMessage:
          error?.errorMessage ?? "Failed to transfer token. Please try again.",
      };
    }
  }

  async transferToken(
    tokenAddress: string,
    receiverAddress: string,
    amountInWei: number, // value must me in decimal places
    privateKey: string,
    _providerAttrib: any,
    feeLimit?: string,
    nonce?: string
  ) {
    try {
      const tokenDetails = await this.getTokenDetails(tokenAddress);
      if (!tokenDetails || !tokenDetails.symbol) {
        throw {
          errorMessage:
            "Invalid token address. Please try with valid token address.",
        };
      }
      const amount = amountInWei / 10 ** tokenDetails.decimals;
      if (tokenDetails.balance < amount) {
        throw {
          errorMessage: "Insufficient balance.",
        };
      }
      const signer = new ethers.Wallet(
        privateKey,
        this.getProvider(_providerAttrib)
      );
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ERC20ABI.abi,
        signer
      );
      const data = tokenContract.interface.encodeFunctionData("transfer", [
        receiverAddress,
        amountInWei.toString(),
      ]);
      const tx = await signer.sendTransaction({
        to: tokenContract,
        data: data,
        from: signer.address,
        nonce: nonce ? +nonce : undefined,
        gasLimit: feeLimit ? +feeLimit : 0,
      });
      await tx.wait();
      return {
        hash: tx.hash,
      };
    } catch (error: any) {
      Logger.error(error);
      throw {
        errorMessage:
          error?.errorMessage ?? "Failed to transfer token. Please try again.",
      };
    }
  }

  async transferNFT(
    collectionAddress: string,
    tokenId: string,
    receiverAddress: string,
    privateKey: string
  ): Promise<{ hash: string }> {
    try {
      // create wallet instance
      const wallet = new ethers.Wallet(privateKey, this.getProvider());
      // validate nft
      const isnftowner = await this.isOwnedNFT(
        collectionAddress,
        tokenId,
        this.publicKey
      );
      if (!isnftowner) {
        throw {
          errorMessage: "Invalid nft owner. Please try with valid nft owner.",
        };
      }

      // transfer nft
      const contract = new ethers.Contract(
        collectionAddress,
        ERC721ABI.abi,
        wallet
      );
      const transferTx = await contract.safeTransferFrom(
        this.publicKey,
        receiverAddress,
        tokenId.toLowerCase()
      );
      await transferTx.wait();

      // validate nft owner
      const ownnft = await this.isOwnedNFT(
        collectionAddress,
        tokenId,
        this.publicKey
      );
      if (ownnft) {
        throw {
          errorMessage: "Failed to transfer nft. Please try again.",
        };
      }

      // remove nft from collection
      this.removeNFT(collectionAddress, tokenId);
      return {
        hash: transferTx.hash,
      };
    } catch (error: any) {
      throw {
        errorMessage:
          error?.errorMessage ?? "Failed to transfer NFT. Please try again.",
      };
    }
  }
  async approveNFTTransfer(
    _collectionAddress: string,
    _tokenId: string,
    _privateKey: string
  ): Promise<boolean> {
    return true;
  }

  async getTransactionReceipt(hash: string) {
    const receipt = await this.getProvider().getTransactionReceipt(hash);
    return receipt as TransactionReceipt;
  }

  convertToDecimals(value: number, decimals = 18): any {
    return ethers.parseUnits(value.toString(), decimals).toString();
  }

  formatDecimals(value: number, decimals = 18): any {
    return ethers.formatUnits(value.toString(), decimals).toString();
  }

  async getCurrentNonce(_providerAttrib?: any): Promise<string> {
    const nonce = await this.getProvider(_providerAttrib).getTransactionCount(
      this.publicKey
    );
    return nonce.toString();
  }

  async getEstimateFee(
    _providerAttrib?: any,
    transaction?: IFeeEstimateTransaction
  ): Promise<string> {
    switch (transaction?.type) {
      case "TOKEN":
        const tokenContract = new ethers.Contract(
          transaction.tokenAddress,
          ERC20ABI.abi,
          this.getProvider(_providerAttrib)
        );
        const transferData = await tokenContract.interface.encodeFunctionData(
          "transfer",
          [transaction.to, transaction?.amount]
        );
        const estimateGas = await this.getProvider(_providerAttrib).estimateGas(
          {
            from: this.publicKey,
            to: transaction.tokenAddress,
            data: transferData,
          }
        );
        return estimateGas.toString();

      default:
        return "0";
    }
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
