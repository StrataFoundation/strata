import { PublicKey, Transaction } from "@solana/web3.js";
import { v4 as uuid } from "uuid";

export {
  subscribeTransactions,
  hydrateTransactions,
} from "./subscribeTransactions";
export type { TransactionResponseWithSig } from "./subscribeTransactions";
import AsyncLock from "async-lock";

const lock = new AsyncLock();

export enum Cluster {
  Devnet = "devnet",
  Mainnet = "mainnet-beta",
  Testnet = "testnet",
  Localnet = "localnet",
}

enum ResponseType {
  Error = "error",
  Transaction = "transaction",
  Unsubscribe = "unsubscribe",
  Subscribe = "subscribe",
}

enum RequestType {
  Transaction = "transaction",
  Subscribe = "subscribe",
  Unsubscribe = "unsubscribe",
}

interface Response {
  type: ResponseType;
}

interface TransactionResponse extends Response {
  cluster: Cluster;
  transactionBytes: number[];
}

export class Accelerator {
  ws: WebSocket;
  listeners: Record<string, (resp: Response) => void>;
  subs: Record<string, any> = {}; // List of current subscriptions

  // Map of our id to subId
  transactionListeners: Record<string, string>;

  static async waitForConnect(socket: WebSocket): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      let resolved = false;
      socket.onopen = function (e) {
        resolved = true;
        resolve(socket);
      };
      setTimeout(() => {
        if (!resolved) {
          reject(new Error("Failed to connect to socket within 60 seconds"));
        }
      }, 60 * 1000);
    });
  }

  static async init(url: string) {
    const socket = new WebSocket(url);
    await Accelerator.waitForConnect(socket);
    return new Accelerator({ ws: socket });
  }

  constructor({ ws }: { ws: WebSocket }) {
    this.ws = ws;
    this.initSocket(ws);
    this.listeners = {};
    this.transactionListeners = {};
  }

  private async send(payload: any) {
    this.ws.send(JSON.stringify(payload));
  }

  sendTransaction(cluster: Cluster, tx: Transaction): void {
    this.send({
      type: RequestType.Transaction,
      transactionBytes: tx.serialize().toJSON().data,
      cluster,
    });
  }

  async unsubscribeTransaction(listenerId: string): Promise<void> {
    delete this.subs[listenerId];
    const subId = this.transactionListeners[listenerId];
    if (subId) {
      this.send({
        type: RequestType.Unsubscribe,
        id: subId,
      });
      await this.listenOnce((resp) => resp.type === ResponseType.Unsubscribe);
    }
    delete this.listeners[listenerId];
  }

  async onTransaction(
    cluster: Cluster,
    account: PublicKey,
    callback: (resp: {
      txid: string;
      logs: string[] | null;
      transaction: Transaction;
      blockTime: number;
    }) => void
  ): Promise<string> {
    return lock.acquire("onTransaction", async () => {
      return this._onTransaction(cluster, account, callback);
    });
  }

  async _onTransaction(
    cluster: Cluster,
    account: PublicKey,
    callback: (resp: {
      txid: string;
      transaction: Transaction;
      blockTime: number;
      logs: string[] | null;
    }) => void
  ): Promise<string> {
    const sub = {
      type: RequestType.Subscribe,
      cluster,
      account: account.toBase58(),
    };
    await this.send(sub);

    const response: any = await this.listenOnce(
      (resp) => resp.type === ResponseType.Subscribe
    );
    const subId = response.id;
    this.subs[subId] = sub;

    const listenerId = await this.listen((resp) => {
      if (resp.type === ResponseType.Transaction) {
        const tx = Transaction.from(
          new Uint8Array((resp as any).transactionBytes)
        );
        if (
          tx.compileMessage().accountKeys.some((key) => key.equals(account))
        ) {
          callback({
            transaction: tx,
            txid: (resp as any).txid,
            blockTime: (resp as any).blockTime,
            logs: (resp as any).logs,
          });
        }
      }
    });
    this.transactionListeners[listenerId] = subId;

    return listenerId;
  }

  listen(listener: (resp: Response) => void): string {
    const id = uuid();
    this.listeners[id] = listener;
    return id;
  }

  unlisten(id: string): void {
    delete this.listeners[id];
  }

  async listenOnce(matcher: (resp: Response) => boolean): Promise<Response> {
    return new Promise((resolve, reject) => {
      let resolved = false;
      let id: string;
      const listener = (resp: Response) => {
        if (matcher(resp)) {
          resolved = true;
          this.unlisten(id);
          resolve(resp);
        }
      };
      id = this.listen(listener);

      setTimeout(() => {
        if (!resolved) {
          this.unlisten(id);
          reject(new Error("Failed to match matcher in 60 seconds"));
        }
      }, 60 * 1000);
    });
  }

  initSocket(ws: WebSocket) {
    this.ws = ws;
    const that = this;
    Object.values(this.subs).forEach((sub) => this.send(sub));
    ws.onclose = async function () {
      // Try to reconnect
      const newWs = new WebSocket(ws.url);
      await Accelerator.waitForConnect(newWs);
      that.initSocket(newWs);
    };

    ws.onmessage = this.onMessage.bind(this);
  }

  onMessage(message: MessageEvent<any>) {
    const parsed: Response = JSON.parse(message.data) as Response;
    Object.values(this.listeners).map(
      (listener) => listener && listener(parsed)
    );
  }
}
