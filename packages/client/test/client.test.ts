/* eslint-disable @typescript-eslint/no-explicit-any */
import { LigoClient } from "../src";
import { LigoAgreement } from "@js-ligo/vocab";
import { AccountId } from "caip";
import { Crypto } from "@peculiar/webcrypto";
import { Blob, FileReader } from "vblob";
import { ExternalProvider, Web3Provider } from "@ethersproject/providers";
import ethProvider from "eth-provider";
import { createFullNode } from "@waku/create";
import { waitForRemotePeer } from "@waku/core/lib/wait_for_remote_peer";
import { Protocols } from "@waku/interfaces";
import {
  Fleet,
  getPredefinedBootstrapNodes,
} from "@waku/core/lib/predefined_bootstrap_nodes";
import { readFile, writeFile } from "fs/promises";
import { VeramoJsonStore, VeramoJsonCache } from "@veramo/data-store-json";

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
  let dataStore: VeramoJsonStore;

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

    try {
      dataStore = {
        notifyUpdate: async (
          _oldState: VeramoJsonCache,
          _newState: VeramoJsonCache
        ) => {
          return;
        },
        ...(JSON.parse(
          (await readFile("./test/test-datastore.json")).toString("utf8")
        ) as VeramoJsonStore),
      };
    } catch (e) {
      dataStore = {
        notifyUpdate: async (
          _oldState: VeramoJsonCache,
          _newState: VeramoJsonCache
        ) => {
          return;
        },
      };
    }

    const client = new LigoClient(provider, account);
    await client.connect(
      { domain: "localhost" },
      KMS_SECRET_KEY,
      dataStore,
      waku1
    );

    return { client, account };
  }

  beforeEach(() => {
    global.localStorage.clear();
  });

  afterEach(async () => {
    await writeFile("./test/test-datastore.json", JSON.stringify(dataStore));
  });

  describe("signAgreement", () => {
    test("sign agreement", async () => {
      const { client } = await buildAndConnectClient();

      const jws = await client.signAgreement(agreement);
      expect(jws).toBeDefined();

      localStorage.setItem("ceramic-session", "");
    }, 30000);
  });

  describe("proposeAgreement", () => {
    test("send agreement", async () => {
      const { client } = await buildAndConnectClient();
      await client.proposeAgreement("ceramic://id", DID_B, agreement);
    }, 30000);
  });

  describe("getProposedAgreements", () => {
    test("get proposed agreements", async () => {
      const { client } = await buildAndConnectClient();

      const offerResponses = await client.getProposedAgreements([
        "ceramic://id",
      ]);
      console.log(offerResponses);
      expect(offerResponses).toHaveLength(1);
    }, 30000);
  });
});
