import { XWalletEvent } from "../sdk/interface";
import { ServiceWorkerMessageAction } from "../service_worker/Actions.type";
import {
  IInternalMessage,
  IServiceWorkerResponse,
} from "../service_worker/index.interface";
import { Config } from "./Config.util";

export class Util {
  static removePrefixOx(inputString: string) {
    if (inputString?.startsWith("0x")) {
      return inputString?.substring(2);
    }
    return inputString;
  }

  static add0xToString(str: string) {
    if (str.startsWith("0x")) {
      return str; // String already starts with '0x', no change needed
    } else {
      return "0x" + str; // Add '0x' to the beginning of the string
    }
  }

  static filterIPFS(ipfs: string) {
    if (typeof ipfs == undefined || ipfs == null || ipfs == "") {
      return "";
    }
    if (ipfs?.includes("https://") || ipfs?.includes("http://")) {
      return ipfs;
    }
    const uri = ipfs?.replace("://", "/");
    return `${Config?.ipfs_gateway}${uri}`;
  }

  static wrapPublicKey(publicKey: string) {
    return `${publicKey.substring(0, 8)}...${publicKey.slice(-8)}`;
  }

  static closeNotificationWindow(
    requestId: string,
    message: IServiceWorkerResponse,
    event?: keyof typeof XWalletEvent
  ) {
    chrome.runtime.sendMessage<IInternalMessage>({
      action: ServiceWorkerMessageAction.CLOSE_WINDOW,
      requestId: requestId,
      ...message,
      event,
    });
  }

  static hexToPlainByteArray(_strData: string): Array<any> {
    return Array.from(Util.strToUint8Array(_strData));
  }

  static strToUint8Array(_strData: string): Uint8Array {
    return new Uint8Array(Buffer.from(_strData, "hex"));
  }

  static strToHex(_strData: string): string {
    return Buffer.from(_strData, "utf-8").toString("hex");
  }

  static uint8ArrayToPlainByteArray(_arrData: Uint8Array): Array<any> {
    return Array.from(_arrData);
  }

  static bigIntToUuid(bigInt: BigInt) {
    let hexString = bigInt.toString(16).padStart(32, "0");
    return [
      hexString.slice(0, 8),
      hexString.slice(8, 12),
      hexString.slice(12, 16),
      hexString.slice(16, 20),
      hexString.slice(20),
    ].join("-");
  }
}
