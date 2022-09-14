import { LigoAgreement } from "@js-ligo/vocab";
import { DagJWS, DID } from "dids";

export class AgreementVerifier {
  #did: DID;

  constructor(did: DID) {
    this.#did = did;
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

    if (agreements.length == 0) {
      throw new Error("No valid signatures found");
    }
    return agreements[0];
  }
}
