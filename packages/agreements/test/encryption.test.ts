import { AgreementEncrypter } from "../src";
import { LigoAgreement } from "@js-ligo/vocab";
import { randomBytes } from "@stablelib/random";

describe("encryption", () => {
  const agreement: LigoAgreement = {
    order: {
      "@id": "ipfs://fake",
    },
  };

  test("encrypt agreement", async () => {
    const key = randomBytes(32);

    const encrypter = new AgreementEncrypter(key);

    const jwe = await encrypter.encryptAgreement(agreement);
    expect(jwe).toBeDefined();
  }, 30000);

  test("decrypt agreement", async () => {
    const key = randomBytes(32);

    const encrypter = new AgreementEncrypter(key);

    const jwe = await encrypter.encryptAgreement(agreement);

    const decryptedAgreement = await encrypter.decryptAgreement(jwe);
    expect(decryptedAgreement).toStrictEqual(agreement);
  }, 30000);
});
