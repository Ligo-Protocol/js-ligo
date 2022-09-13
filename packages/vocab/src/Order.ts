import { Text, URL, Organization, Person, DateTime } from "schema-dts";
import { IdReference, SchemaValue } from "./shared";
import { LigoPaymentMethod } from "./LigoPaymentMethod";
import { Offer } from "./Offer";

export interface Order {
  /** The offer(s) -- e.g., product, quantity and price combinations -- included in the order. */
  acceptedOffer?: SchemaValue<Offer, "acceptedOffer">;
  /** Party placing the order. */
  customer?: SchemaValue<Organization | Person | IdReference, "customer">;
  /** The entity offering the rental. */
  seller?: SchemaValue<Organization | Person | IdReference, "seller">;
  /** Date order was placed. */
  orderDate?: SchemaValue<DateTime, "orderDate">;
  /** The payment method for the order. */
  paymentMethod?: SchemaValue<LigoPaymentMethod, "paymentMethod">;
  /** An identifier for the method of payment used. See specific payment method for usage. */
  paymentMethodId?: SchemaValue<Text, "paymentMethodId">;
  /** The URL for sending a payment. See specific payment method for usage. */
  paymentUrl?: SchemaValue<URL, "paymentUrl">;
}
