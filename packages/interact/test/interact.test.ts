/* eslint-disable @typescript-eslint/no-explicit-any */
import { LigoInteractions } from "../src";
import { LigoAgreement } from "@js-ligo/vocab";
import { AgreementSigner } from "@js-ligo/agreements";
import { DID } from "dids";
import { Ed25519Provider } from "key-did-provider-ed25519";
import { getResolver } from "key-did-resolver";
import { createFullNode } from "@waku/create";
import { waitForRemotePeer } from "@waku/core/lib/wait_for_remote_peer";
import { Protocols } from "@waku/interfaces";
import {
  Fleet,
  getPredefinedBootstrapNodes,
} from "@waku/core/lib/predefined_bootstrap_nodes";
import { getResolver as keyDidResolver } from "key-did-resolver";
import { DIDResolverPlugin } from "@veramo/did-resolver";
import { DIDComm, IDIDComm } from "@veramo/did-comm";
import { Resolver } from "did-resolver";
import { createAgent, IResolver, IKeyManager, IDIDManager } from "@veramo/core";
import { DIDManager, MemoryDIDStore } from "@veramo/did-manager";
import { KeyDIDProvider } from "@veramo/did-provider-key";
import {
  KeyManager,
  MemoryKeyStore,
  MemoryPrivateKeyStore,
} from "@veramo/key-manager";
import { KeyManagementSystem } from "@veramo/kms-local";
import { base64 } from "multiformats/bases/base64";

const SEED_A = "mGqEJyPzOv065BYm7fppSAkMZncdrfw84q+vb880kCS4";
const DID_B = "did:key:z6MkonTpPJpn82FfGu4gebWHkMEn9fn5uCjhSE74d11QxK3Q";
const SEED_B_HEX =
  "a81641714f491d480a5eb9a5afd30d62d1bf47a817287a3e5ebfc32e15d5ecb88aa4875950792249aac668589d07b90455726a9c920e463cc0cc9f032630ad1b";

async function createDID(seed: Uint8Array) {
  const provider = new Ed25519Provider(seed);
  const did = new DID({ provider, resolver: getResolver() });
  await did.authenticate();

  return did;
}

export const NOISE_KEY_1 = new Uint8Array(
  ((): number[] => {
    const b = [];
    for (let i = 0; i < 32; i++) {
      b.push(1);
    }
    return b;
  })()
);

export const NOISE_KEY_2 = new Uint8Array(
  ((): number[] => {
    const b = [];
    for (let i = 0; i < 32; i++) {
      b.push(2);
    }
    return b;
  })()
);

describe("LigoInteractions", () => {
  const agreement: LigoAgreement = {
    order: {
      "@id": "ipfs://fake",
    },
  };

  async function buildInteractions() {
    const waku1 = await createFullNode({
      staticNoiseKey: NOISE_KEY_1,
    }).then((waku) => waku.start().then(() => waku));

    const testNodes = getPredefinedBootstrapNodes(Fleet.Test);
    waku1.addPeerToAddressBook(testNodes[0].getPeerId(), testNodes);
    await waku1.dial(testNodes[0], [Protocols.Relay, Protocols.Store]);
    await Promise.all([
      waitForRemotePeer(waku1, [Protocols.Relay, Protocols.Store]),
    ]);

    const keyStore = new MemoryPrivateKeyStore();
    const veramoAgent = createAgent<
      IResolver & IDIDComm & IDIDManager & IKeyManager
    >({
      plugins: [
        new KeyManager({
          store: new MemoryKeyStore(),
          kms: {
            local: new KeyManagementSystem(keyStore),
          },
        }),
        new DIDResolverPlugin({
          resolver: new Resolver({
            ...keyDidResolver(),
          }),
        }),
        new DIDComm([]),
        new DIDManager({
          store: new MemoryDIDStore(),
          defaultProvider: "did:key",
          providers: {
            "did:key": new KeyDIDProvider({
              defaultKms: "local",
            }),
          },
        }),
      ],
    });

    await veramoAgent.didManagerImport({
      did: DID_B,
      provider: "did:key",
      keys: [
        {
          privateKeyHex: SEED_B_HEX,
          type: "Ed25519",
          kms: "local",
        },
      ],
    });

    const interactions = new LigoInteractions(waku1, veramoAgent);

    return { interactions };
  }

  describe("respondToOffer", () => {
    test("should send message", async () => {
      const { interactions } = await buildInteractions();
      const didA = await createDID(base64.decode(SEED_A));
      const signer = new AgreementSigner(didA);

      const signedAgreement = await signer.signRawAgreement(agreement);
      await interactions.respondToOffer("ceramic://id", DID_B, signedAgreement);
    }, 30000);
  });

  describe("getOfferResponses", () => {
    test("should get messages", async () => {
      const { interactions } = await buildInteractions();
      await interactions.getSignedOfferResponses();
    }, 30000);
  });
});
