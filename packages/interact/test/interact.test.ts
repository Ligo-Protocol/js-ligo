/* eslint-disable @typescript-eslint/no-explicit-any */
import { LigoInteractions } from "../src";
import { LigoAgreement } from "@js-ligo/vocab";
import { AgreementSigner } from "@js-ligo/agreements";
import { DID } from "dids";
import { Ed25519Provider } from "key-did-provider-ed25519";
import { getResolver } from "key-did-resolver";
import { randomBytes } from "@stablelib/random";
import { createFullNode } from "@waku/create";
import { waitForRemotePeer } from "@waku/core/lib/wait_for_remote_peer";
import { Protocols } from "@waku/interfaces";
import {
  Fleet,
  getPredefinedBootstrapNodes,
} from "@waku/core/lib/predefined_bootstrap_nodes";

async function createDID() {
  const seed = randomBytes(32);
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

    const interactions = new LigoInteractions(waku1);

    return { interactions };
  }

  describe("respondToOffer", () => {
    test.only("should send message", async () => {
      const { interactions } = await buildInteractions();
      const didA = await createDID();
      const didB = await createDID();
      const signer = new AgreementSigner(didA);

      const signedAgreement = await signer.signRawAgreement(agreement);
      await interactions.respondToOffer(
        "ceramic://id",
        didB.id,
        signedAgreement
      );
    }, 30000);
  });

  describe("getOfferResponses", () => {
    test("should get messages", async () => {
      const { interactions } = await buildInteractions();
      await interactions.getOfferResponses();
    }, 30000);
  });
});
