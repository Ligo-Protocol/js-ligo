import { AgreementSigner } from "../src";
import { LigoAgreement } from "@js-ligo/vocab";
import { DID } from "dids";
import { Ed25519Provider } from "key-did-provider-ed25519";
import { getResolver } from "key-did-resolver";
import { randomBytes } from "@stablelib/random";

async function createDID() {
  const seed = randomBytes(32);
  const provider = new Ed25519Provider(seed);
  const did = new DID({ provider, resolver: getResolver() });
  await did.authenticate();

  return did;
}

describe("signer", () => {
  const agreement: LigoAgreement = {
    order: {
      "@id": "ipfs://fake",
    },
  };

  test("sign raw agreement", async () => {
    const did = await createDID();
    const signer = new AgreementSigner(did);

    const jws = await signer.signRawAgreement(agreement);
    expect(jws).toBeDefined();
  }, 30000);

  test("sign signed agreement", async () => {
    const didA = await createDID();
    const signerA = new AgreementSigner(didA);

    const didB = await createDID();
    const signerB = new AgreementSigner(didB);

    const jwsA = await signerA.signRawAgreement(agreement);
    const jwsB = await signerB.signSignedAgreement(jwsA);

    expect(jwsB).toBeDefined();
    expect(jwsB.signatures.length).toBe(2);
  }, 30000);
});
