interface IAuthContext {
  publicKey: string;
  privateKey: string;
  accountName: string;
  accountIcon: string;
  type: VirtualMachineType;
  virtualMachine: IVirtualMachine;
  changeActiveNetwork: (chain: IVMChain) => Promise<void>;
  changeActiveAccount: (account: IXWalletAccount) => void;
}
