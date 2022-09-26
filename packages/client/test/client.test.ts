import { LigoClient } from "../src";
import { LigoAgreement } from "@js-ligo/vocab";
import { EventEmitter } from "events";
import { Wallet as EthereumWallet } from "@ethersproject/wallet";
import { fromString, toString } from "uint8arrays";

class EthereumProvider extends EventEmitter {
  wallet: EthereumWallet;

  constructor(wallet: EthereumWallet) {
    super();
    this.wallet = wallet;
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  send(
    request: { method: string; params: Array<any> },
    callback: (err: Error | null | undefined, res?: any) => void
  ): void {
    if (request.method === "eth_chainId") {
      callback(null, { result: "1" });
    } else if (request.method === "personal_sign") {
      let message = request.params[0] as string;
      if (message.startsWith("0x")) {
        message = toString(fromString(message.slice(2), "base16"), "utf8");
      }
      callback(null, { result: this.wallet.signMessage(message) });
    } else {
      callback(new Error(`Unsupported method: ${request.method}`));
    }
  }
}
class LocalStorageMock {
  store: Record<any, any>;

  constructor() {
    this.store = {};
  }

  clear() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = JSON.stringify(value);
  }

  removeItem(key) {
    delete this.store[key];
  }

  length() {
    return Object.keys(this.store).length;
  }
}

global.localStorage = new LocalStorageMock() as unknown as Storage;

describe("LigoClient", () => {
  const agreement: LigoAgreement = {
    order: {
      "@id": "ipfs://fake",
    },
  };

  async function buildAndConnectClient() {
    const wallet = EthereumWallet.createRandom();
    const provider = new EthereumProvider(wallet);
    const client = new LigoClient(provider);
    await client.connect();

    return client;
  }

  describe("signAgreement", () => {
    test("sign agreement", async () => {
      const client = await buildAndConnectClient();

      const jws = await client.signAgreement(agreement);
      expect(jws).toBeDefined();
    }, 30000);
  });
});
