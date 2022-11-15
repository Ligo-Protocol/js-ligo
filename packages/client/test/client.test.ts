/* eslint-disable @typescript-eslint/no-explicit-any */
import { LigoClient } from "../src";
import { LigoAgreement } from "@js-ligo/vocab";
import { AccountId } from "caip";
import { EventEmitter } from "events";
import { fromString, toString } from "uint8arrays";
import { Crypto } from "@peculiar/webcrypto";
import { Blob, FileReader } from "vblob";
import { JWE } from "did-jwt";
import { CID } from "multiformats/cid";
import LitJsSdk from "@lit-protocol/sdk-nodejs";
import { ExternalProvider, Web3Provider } from "@ethersproject/providers";
import ethProvider from "eth-provider";
import { createFullNode } from "@waku/create";
import { waitForRemotePeer } from "@waku/core/lib/wait_for_remote_peer";
import { Protocols } from "@waku/interfaces";
import {
  Fleet,
  getPredefinedBootstrapNodes,
} from "@waku/core/lib/predefined_bootstrap_nodes";

const DID_B = "did:ethr:goerli:0xE9976B324098dC194399f445cDbd989Bc42B4da7";
const KMS_SECRET_KEY =
  "8842bddaf538d0beb69f516d1f66a08084b8e87a9d1f44b6ab0fe23cd8f44b67";

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

  async function buildAndConnectClient() {
    const provider = ethProvider() as ExternalProvider;
    const web3Provider = new Web3Provider(provider);
    const account = new AccountId({
      address: (await web3Provider.listAccounts())[0],
      chainId: `eip155:1`,
    });

    const waku1 = await createFullNode().then((waku) =>
      waku.start().then(() => waku)
    );

    const testNodes = getPredefinedBootstrapNodes(Fleet.Test);
    waku1.addPeerToAddressBook(testNodes[0].getPeerId(), testNodes);
    await waku1.dial(testNodes[0], [Protocols.Relay, Protocols.Store]);
    await Promise.all([
      waitForRemotePeer(waku1, [Protocols.Relay, Protocols.Store]),
    ]);

    const client = new LigoClient(provider, account, LitJsSdk);
    await client.connect({ domain: "localhost" }, KMS_SECRET_KEY, waku1);

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

  describe("respondToOffer", () => {
    test("send agreement", async () => {
      const { client } = await buildAndConnectClient();

      const jws = await client.signAgreement(agreement);
      await client.respondToOffer("ceramic://id", DID_B, jws);
    }, 30000);
  });

  describe("getOfferResponses", () => {
    test("get offer response", async () => {
      const { client } = await buildAndConnectClient();

      const offerResponses = await client.getOfferResponses();
      console.log(offerResponses);
      expect(offerResponses).toHaveLength(1);
    }, 30000);
  });
});
