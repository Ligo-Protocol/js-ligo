import { CID } from "multiformats/cid";

export interface LigoAgreement {
  // The order that started the agreement
  order: CID;

  // Details of the reservation
  reservation: CID;
}
