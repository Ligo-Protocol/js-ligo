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

  async function buildAndConnectClient(_wallet?: EthereumWallet) {
    const wallet = _wallet ?? EthereumWallet.createRandom();
    const provider = new EthereumProvider(wallet);
    const storageProvider = new StubAgreementStorageProvider();
    const account = new AccountId({
      address: wallet.address,
      chainId: `eip155:1`,
    });
    const client = new LigoClient(provider, account, storageProvider);
    await client.connect({ domain: "localhost" });

    return { client, account };
  }

  beforeEach(() => {
    global.localStorage.clear();
  });

  describe("signAgreement", () => {
    test("sign agreement", async () => {
      const { client } = await buildAndConnectClient();

      const jws = await client.signAgreement(agreement);
      expect(jws).toBeDefined();

      localStorage.setItem("ceramic-session", "");
    }, 30000);
  });

  describe("sendAgreement", () => {
    test("send agreement", async () => {
      const { client } = await buildAndConnectClient();
      const recipient = new AccountId({
        address: "0x4b0bfe4b52e18b4f9d4c702ba7167829b91fcc63",
        chainId: `eip155:420`,
      });

      const jws = await client.signAgreement(agreement);
      const cid = await client.sendAgreement(jws, recipient);

      expect(cid).toBeDefined();
    }, 30000);
  });

  describe("getOfferResponses", () => {
    test("get offer response", async () => {
      const { client: client1 } = await buildAndConnectClient();

      const wallet2 = EthereumWallet.createRandom();
      const account2 = new AccountId({
        address: wallet2.address,
        chainId: `eip155:1`,
      });

      const jws = await client1.signAgreement(agreement);
      const cid1 = await client1.sendAgreement(jws, account2);

      global.localStorage.clear();
      const { client: client2 } = await buildAndConnectClient(wallet2);
      await client2.getOfferResponses();
    }, 30000);
  });
});
