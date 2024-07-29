import EVM from "@virtual_machines/EVM";
import { L1XVM } from "@virtual_machines/L1XVM";
import SolanaVM from "@virtual_machines/SolanaVM";
import VirtualMachine from "@virtual_machines/VirtualMachine";

export default class VirtualMachineFactory {
  static createVirtualMachine(
    vm: VirtualMachineType,
    publicKey: string,
    chainId?: string
  ): VirtualMachine {
    switch (vm) {
      case "L1X":
        return new L1XVM("L1X", publicKey, chainId || "");

      case "EVM":
        return new EVM("EVM", publicKey, chainId || "");

      case "NON-EVM":
        return new SolanaVM(
          "NON-EVM",
          publicKey,
          chainId || ""
        );

      default:
        throw new Error("Unknown vm type.");
    }
  }
}
