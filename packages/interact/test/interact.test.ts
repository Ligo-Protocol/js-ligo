/* eslint-disable @typescript-eslint/no-explicit-any */
import { LigoInteractions, CONTENT_TOPIC } from "../src";
import { LigoAgreement } from "@js-ligo/vocab";
import { AgreementSigner } from "@js-ligo/agreements";
import { DID } from "dids";
import { Ed25519Provider } from "key-did-provider-ed25519";
import { getResolver } from "key-did-resolver";
import { randomBytes } from "@stablelib/random";
import { createPrivacyNode } from "@waku/create";
import { waitForRemotePeer } from "@waku/core/lib/wait_for_remote_peer";
import { Protocols } from "@waku/interfaces";
import { DecoderV0 } from "@waku/core/lib/waku_message/version_0";

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
    const [waku1, waku2] = await Promise.all([
      createPrivacyNode({ staticNoiseKey: NOISE_KEY_1 }).then((waku) =>
        waku.start().then(() => waku)
      ),
      createPrivacyNode({
        staticNoiseKey: NOISE_KEY_2,
        libp2p: { addresses: { listen: ["/ip4/0.0.0.0/tcp/0/ws"] } },
      }).then((waku) => waku.start().then(() => waku)),
    ]);
    waku1.addPeerToAddressBook(
      waku2.libp2p.peerId,
      waku2.libp2p.getMultiaddrs()
    );
    await Promise.all([
      waitForRemotePeer(waku1, [Protocols.Relay]),
      waitForRemotePeer(waku2, [Protocols.Relay]),
    ]);

    const decoder = new DecoderV0(CONTENT_TOPIC);
    waku2.relay.addObserver(decoder, (v) => console.log(v));

    const interactions = new LigoInteractions(waku1);

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