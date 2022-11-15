import {
  xc20pDirEncrypter,
  xc20pDirDecrypter,
  createJWE,
  decryptJWE,
  JWE,
} from "did-jwt";
import { prepareCleartext, decodeCleartext } from "dag-jose-utils";
import { LigoAgreement } from "@js-ligo/vocab";

export class AgreementEncrypter {
  #key: Uint8Array;

  constructor(key: Uint8Array) {
    this.#key = key;
  }
  async encryptAgreement(agreement: LigoAgreement): Promise<JWE> {
    // 1. Prepare cleartext
    const dirEncrypter = xc20pDirEncrypter(this.#key);
    const cleartext = await prepareCleartext(agreement);

    // 2. Encrypt
    const jwe = await createJWE(cleartext, [dirEncrypter]);

    return jwe;
  }

  async decryptAgreement(jwe: JWE): Promise<LigoAgreement> {
    const dirDecrypter = xc20pDirDecrypter(this.#key);
    const decryptedData = await decryptJWE(jwe, dirDecrypter);
    const decryptedAgreement = decodeCleartext(decryptedData);

    return decryptedAgreement as LigoAgreement;
  }
}
