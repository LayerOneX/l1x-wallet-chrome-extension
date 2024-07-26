import { XWalletEvent } from "../sdk/interface";
import {
  ExternalMessageAction,
  ServiceWorkerMessageAction,
} from "./Actions.type";

export interface IExternalMessage {
  action: ExternalMessageAction;
  data: any;
}

export interface IServiceWorkerMessage {
  action: ServiceWorkerMessageAction;
  data: any;
}

export interface IServiceWorkerResponse<T = any> {
  status: "success" | "failure";
  errorMessage: string;
  data: T;
}

export interface IInternalMessage extends IServiceWorkerResponse {
  action: ServiceWorkerMessageAction;
  requestId?: string;
  data: {
    [k: string]: any;
  };
  event?: keyof typeof XWalletEvent
}

export interface ICallback {
  [k: string]: {
    sendRequest: (data: IServiceWorkerResponse) => void;
    windowId: number;
  };
}