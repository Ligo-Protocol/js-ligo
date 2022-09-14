import { LigoAgreement } from "@js-ligo/vocab";
import { DagJWS, DID } from "dids";

export class AgreementSigner {
  constructor(private readonly did: DID) {}

  async signRawAgreement(rawAgreement: LigoAgreement): Promise<DagJWS> {
    return await this.did.createJWS(rawAgreement);
  }

  async signSignedAgreement(signedAgreement: DagJWS): Promise<DagJWS> {
    const jws = await this.did.createJWS(signedAgreement.payload);
    return {
      ...jws,
      signatures: [...signedAgreement.signatures, ...jws.signatures],
    };
  }
}
