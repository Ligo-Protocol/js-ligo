import { AgreementSigner, AgreementEncrypter } from "../src";
import { LigoAgreement } from "@js-ligo/vocab";
import { DID } from "dids";
import { Ed25519Provider } from "key-did-provider-ed25519";
import { getResolver } from "key-did-resolver";
import { randomBytes } from "@stablelib/random";
import * as u8a from "uint8arrays";

async function createDID() {
  const seed = randomBytes(32);
  const provider = new Ed25519Provider(seed);
  const did = new DID({ provider, resolver: getResolver() });
  await did.authenticate();

  return did;
}

describe("encryption", () => {
  const agreement: LigoAgreement = {
    order: {
      "@id": "ipfs://fake",
    },
  };

  test("encrypt signed agreement", async () => {
    const key = randomBytes(32);

    const did = await createDID();
    const signer = new AgreementSigner(did);
    const encrypter = new AgreementEncrypter(key);

    const jws = await signer.signRawAgreement(agreement);

    const jwe = await encrypter.encryptAgreement(jws);
    expect(jwe).toBeDefined();
  }, 30000);

  test("decrypt signed agreement", async () => {
    const key = randomBytes(32);

    const did = await createDID();
    const signer = new AgreementSigner(did);
    const encrypter = new AgreementEncrypter(key);

    const jws = await signer.signRawAgreement(agreement);

    const jwe = await encrypter.encryptAgreement(jws);

    const decryptedJWS = await encrypter.decryptAgreement(jwe);
    expect(decryptedJWS).toStrictEqual(jws);
  }, 30000);
});
