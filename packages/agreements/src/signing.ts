import { LigoAgreement } from "@js-ligo/vocab";
import { DagJWS, DID } from "dids";

export class AgreementSigner {
  #did: DID;

  constructor(did: DID) {
    this.#did = did;
  }

  async signRawAgreement(rawAgreement: LigoAgreement): Promise<DagJWS> {
    return await this.#did.createJWS(rawAgreement);
  }

  async signSignedAgreement(signedAgreement: DagJWS): Promise<DagJWS> {
    const jws = await this.#did.createJWS(signedAgreement.payload);
    return {
      ...jws,
      signatures: [...signedAgreement.signatures, ...jws.signatures],
    };
  }

  async verifyAgreement(signedAgreement: DagJWS): Promise<LigoAgreement> {
    const agreements: LigoAgreement[] = await Promise.all(
      signedAgreement.signatures.map(async (sig) => {
        const jws: DagJWS = {
          ...signedAgreement,
          signatures: [sig],
        };
        const result = await this.#did.verifyJWS(jws);
        return result.payload as LigoAgreement;
      })
    );

    if (agreements.length === 0) {
      throw new Error("No valid signatures found");
    }
    return agreements[0];
  }
}
