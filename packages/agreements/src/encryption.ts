import { DagJWS } from "dids";
import {
  xc20pDirEncrypter,
  xc20pDirDecrypter,
  createJWE,
  decryptJWE,
  JWE,
} from "did-jwt";
import { prepareCleartext, decodeCleartext } from "dag-jose-utils";

export class AgreementEncrypter {
  #key: Uint8Array;

  constructor(key: Uint8Array) {
    this.#key = key;
  }
  async encryptAgreement(
    signedAgreement: DagJWS,
    encryptedSymmetricKey: string
  ): Promise<JWE> {
    // 1. Prepare cleartext
    const dirEncrypter = xc20pDirEncrypter(this.#key);
    const cleartext = await prepareCleartext(signedAgreement);

    // 2. Encrypt + add encrypted key to protected header
    const jwe = await createJWE(cleartext, [dirEncrypter], {
      encryptedSymmetricKey,
    });

    return jwe;
  }

  async decryptAgreement(jwe: JWE): Promise<DagJWS> {
    const dirDecrypter = xc20pDirDecrypter(this.#key);
    const decryptedData = await decryptJWE(jwe, dirDecrypter);
    const decryptedAgreement = decodeCleartext(decryptedData);

    return decryptedAgreement as DagJWS;
  }
}
