/* eslint-disable @typescript-eslint/no-explicit-any */
import { LigoInteractions } from "../src";
import { LigoAgreement } from "@js-ligo/vocab";
import { AgreementSigner } from "@js-ligo/agreements";
import { DID } from "dids";
import { Ed25519Provider } from "key-did-provider-ed25519";
import { getResolver } from "key-did-resolver";
import { randomBytes } from "@stablelib/random";
import { createPrivacyNode } from "@waku/create";

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

describe("LigoInteractions", () => {
  const agreement: LigoAgreement = {
    order: {
      "@id": "ipfs://fake",
    },
  };

  async function buildInteractions() {
    const waku = await createPrivacyNode({
      staticNoiseKey: NOISE_KEY_1,
      libp2p: { addresses: { listen: ["/ip4/0.0.0.0/tcp/0/ws"] } },
    });
    await waku.start();
    const interactions = new LigoInteractions(waku);

    return { interactions };
  }

  describe("respondToOffer", () => {
    test("should send message", async () => {
      const { interactions } = await buildInteractions();
      const did = await createDID();
      const signer = new AgreementSigner(did);

      const signedAgreement = await signer.signRawAgreement(agreement);
      await interactions.respondToOffer(signedAgreement);
    }, 30000);
  });
});
