import l1xIcon from "@assets/images/L1X_icon.png";
import evmIcon from "@assets/images/evm.svg";
// import nonEvmIcon from "@assets/images/non-evm.svg";

export const Config = {
  virtualMachinesLists: [
    {
      id: 1,
      name: "L1X",
      icon: l1xIcon,
    },
    {
      id: 2,
      name: "EVM",
      icon: evmIcon,
    },
    // {
    //   id: 3,
    //   name: "NON-EVM",
    //   icon: nonEvmIcon,
    // },
  ] as IVirtualMachineItem[],
  rpc: {
    l1x: "https://v2-mainnet-rpc.l1x.foundation",
    ethereum: "https://eth.drpc.org",
    polygon: "https://polygon.drpc.org",
    binance: "https://binance.llamarpc.com",
    avalanche: "https://api.avax.network/ext/bc/C/rpc",
    solana:
      "https://divine-virulent-ensemble.solana-mainnet.quiknode.pro/157842d8d153ca4281b313fff22300044b4ef532/",
    arbitrum: "https://arb1.arbitrum.io/rpc",
    base: "https://mainnet.base.org",
    optimisim: "https://mainnet.optimism.io/",
    optimisim_goerli: "https://endpoints.omniatech.io/v1/op/goerli/public",
    eth_goerli: "https://ethereum-goerli.publicnode.com",
    matic_mumbai:
      "https://rpc-mumbai.maticvigil.com/v1/0d6e3f53a4861009421ce9ba526df64c1e2146cb",
    bsc_testnet: "https://data-seed-prebsc-1-s1.binance.org:8545/",
    sol_devnet: "https://api.devnet.solana.com",
  },
  chainId: {
    ethereum: 1,
    polygon: 137,
    binance: 56,
    avalanche: 43114,
    solana: 3,
    arbitrum: 42161,
    base: 8453,
    optimisim: 10,
    optimisim_goerli: 420,
    eth_goerli: 5,
    matic_mumbai: 80001,
    bsc_testnet: 97,
    sol_devnet: 103,
    l1x: 1066,
  },
  explorer: {
    ethereum: "https://etherscan.io/",
    polygon: "https://explorer.matic.network/",
    binance: "https://bscscan.com/",
    avalanche: "https://snowtrace.io/",
    solana: "https://explorer.solana.com/",
    arbitrum: "https://arbiscan.io/",
    base: "https://basescan.org/",
    optimisim: "https://optimistic.etherscan.io/",
    optimisim_goerli: "https://goerli-optimism.etherscan.io/",
    eth_goerli: "https://goerli.etherscan.io/",
    matic_mumbai: "https://mumbai.polygonscan.com/",
    bsc_testnet: "https://testnet.bscscan.com/",
    sol_devnet: "https://explorer.solana.com/?cluster=devnet",
    l1x: "https://explorer.l1xapp.com/tx/",
  },
  ipfs_gateway: "https://ipfs.io/",
  l1xFeeLimit: 1799999999999999998,
};
