import { AgreementSigner, AgreementVerifier } from "../src";
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

describe("verifier", () => {
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

  test("verify agreement with one signature", async () => {
    const didA = await createDID();
    const didB = await createDID();
    const signer = new AgreementSigner(didA);
    const verifier = new AgreementVerifier(didB);

    const jws = await signer.signRawAgreement(agreement);
    const payload = await verifier.verifyAgreement(jws);
    expect(payload).toStrictEqual(agreement);
  }, 30000);

  test("verify agreement with multiple signatures", async () => {
    const didA = await createDID();
    const didB = await createDID();
    const signerA = new AgreementSigner(didA);
    const signerB = new AgreementSigner(didB);
    const verifier = new AgreementVerifier(didB);

    const jwsA = await signerA.signRawAgreement(agreement);
    const jwsB = await signerB.signSignedAgreement(jwsA);

    const payload = await verifier.verifyAgreement(jwsB);
    expect(payload).toStrictEqual(agreement);
  }, 30000);

  test("fail if missing signatures", async () => {
    const didA = await createDID();
    const didB = await createDID();
    const signerA = new AgreementSigner(didA);
    const signerB = new AgreementSigner(didB);
    const verifier = new AgreementVerifier(didB);

    const jwsA = await signerA.signRawAgreement(agreement);
    const jwsB = await signerB.signSignedAgreement(jwsA);

    const payloadP = verifier.verifyAgreement({
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
    const verifier = new AgreementVerifier(didB);

    const jwsA = await signerA.signRawAgreement(agreement);
    const jwsB = await signerB.signSignedAgreement(jwsA);
    const jwsBad = await signerB.signRawAgreement(agreementB);

    const payloadP = verifier.verifyAgreement({
      ...jwsB,
      signatures: [...jwsA.signatures, ...jwsBad.signatures],
    });
    await expect(payloadP).rejects.toThrow(
      "invalid_signature: Signature invalid for JWT"
    );
  }, 30000);
});
