import { DID, Date } from "./shared";
import { LigoPaymentMethod } from "./LigoPaymentMethod";
import { CID } from "multiformats/cid";

export interface Order {
  // The offer included in the order
  acceptedOffer: CID;

  // Party placing the order
  customer: DID;

  // The entity offering the rental
  seller: DID;

  // Date order was placed
  orderDate: Date;

  // The payment method for the order
  paymentMethod: LigoPaymentMethod;

  // An identifier for the method of payment used. See specific payment method for usage
  paymentMethodId?: string;

  // The URL for sending a payment. See specific payment method for usage
  paymentUrl?: string;
}
