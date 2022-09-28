/* eslint-disable @typescript-eslint/no-explicit-any */
import { LigoClient } from "../src";
import { LigoAgreement } from "@js-ligo/vocab";
import { AgreementStorageProvider } from "@js-ligo/agreements";
import { Wallet as EthereumWallet } from "@ethersproject/wallet";
import { AccountId } from "caip";
import { EventEmitter } from "events";
import { fromString, toString } from "uint8arrays";
import { Crypto } from "@peculiar/webcrypto";
import { Blob, FileReader } from "vblob";
import { JWE } from "did-jwt";
import { CID } from "multiformats/cid";

class StubAgreementStorageProvider implements AgreementStorageProvider {
  async storeAgreement(encryptedAgreement: JWE): Promise<CID> {
    console.log(encryptedAgreement);
    return CID.parse("bafyqacnbmrqxgzdgdeaui");
  }
  async fetchAgreement(_: CID): Promise<JWE> {
    throw new Error("Not implemented");
  }
}
class EthereumProvider extends EventEmitter {
  wallet: EthereumWallet;

  constructor(wallet: EthereumWallet) {
    super();
    this.wallet = wallet;
  }

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
    } else if (request.method === "eth_accounts") {
      callback(null, { result: [this.wallet.address] });
    } else {
      callback(new Error(`Unsupported method: ${request.method}`));
    }
  }

  enable() {
    return [this.wallet.address];
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
    console.log(key, value);
    this.store[key] = value;
  }

  removeItem(key) {
    delete this.store[key];
  }

  length() {
    return Object.keys(this.store).length;
  }
}

global.crypto = new Crypto();
global.Blob = Blob as any;
global.FileReader = FileReader as any;
global.localStorage = new LocalStorageMock() as unknown as Storage;
globalThis.location = {
  host: "localhost",
  origin: "localhost",
} as unknown as Location;

describe("LigoClient", () => {
  const agreement: LigoAgreement = {
    order: {
      "@id": "ipfs://fake",
    },
  };

  async function buildAndConnectClient() {
    const wallet = EthereumWallet.createRandom();
    const provider = new EthereumProvider(wallet);
    const storageProvider = new StubAgreementStorageProvider();
    const client = new LigoClient(
      provider,
      new AccountId({
        address: wallet.address,
        chainId: `eip155:1`,
      }),
      storageProvider
    );
    await client.connect({ domain: "localhost" });

    return client;
  }

  describe("signAgreement", () => {
    test("sign agreement", async () => {
      const client = await buildAndConnectClient();

      const jws = await client.signAgreement(agreement);
      expect(jws).toBeDefined();

      localStorage.setItem("ceramic-session", "");
    }, 30000);
  });

  describe("sendAgreement", () => {
    test("send agreement", async () => {
      const client = await buildAndConnectClient();
      const recipientWallet = EthereumWallet.createRandom();
      const recipient = new AccountId({
        address: "0x4b0bfe4b52e18b4f9d4c702ba7167829b91fcc63",
        chainId: `eip155:1`,
      });

      const jws = await client.signAgreement(agreement);
      const cid = await client.sendAgreement(jws, recipient);

      expect(cid).toBeDefined();
    }, 30000);
  });
});
