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

describe("signing", () => {
  const agreement: LigoAgreement = {
    order: {
      "@id": "ipfs://fake",
    },
  };

  const agreementB: LigoAgreement = {
    order: {
      "@id": "ipfs://fakeB",
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

  test("verify agreement with one signature", async () => {
    const didA = await createDID();
    const didB = await createDID();
    const signer = new AgreementSigner(didA);
    const verifier = new AgreementSigner(didB);

    const jws = await signer.signRawAgreement(agreement);
    const payload = await verifier.verifyAgreement(jws);
    expect(payload).toStrictEqual(agreement);
  }, 30000);

  test("verify agreement with multiple signatures", async () => {
    const didA = await createDID();
    const didB = await createDID();
    const signerA = new AgreementSigner(didA);
    const signerB = new AgreementSigner(didB);

    const jwsA = await signerA.signRawAgreement(agreement);
    const jwsB = await signerB.signSignedAgreement(jwsA);

    const payload = await signerB.verifyAgreement(jwsB);
    expect(payload).toStrictEqual(agreement);
  }, 30000);

  test("fail if missing signatures", async () => {
    const didA = await createDID();
    const didB = await createDID();
    const signerA = new AgreementSigner(didA);
    const signerB = new AgreementSigner(didB);

    const jwsA = await signerA.signRawAgreement(agreement);
    const jwsB = await signerB.signSignedAgreement(jwsA);

    const payloadP = signerB.verifyAgreement({
      ...jwsB,
      signatures: [],
    });
    await expect(payloadP).rejects.toThrow("No valid signatures found");
  }, 30000);

  test("fail if one signature is bad", async () => {
    const didA = await createDID();
    const didB = await createDID();
    const signerA = new AgreementSigner(didA);
    const signerB = new AgreementSigner(didB);

    const jwsA = await signerA.signRawAgreement(agreement);
    const jwsB = await signerB.signSignedAgreement(jwsA);
    const jwsBad = await signerB.signRawAgreement(agreementB);

    const payloadP = signerB.verifyAgreement({
      ...jwsB,
      signatures: [...jwsA.signatures, ...jwsBad.signatures],
    });
    await expect(payloadP).rejects.toThrow(
      "invalid_signature: Signature invalid for JWT"
    );
  }, 30000);
});
