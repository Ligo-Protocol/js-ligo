import { QuantitativeValue, GeoCircle, DID } from "./shared";
import { PriceSpecification } from "./PriceSpecification";
import { LigoPaymentMethod } from "./LigoPaymentMethod";
import { CID } from "multiformats/cid";

export interface Offer {
  // Description of the offer
  description: string;

  // Image(s) of specific vehicle being offered
  images: CID[];

  // The vehicle being offered
  itemOffered: CID;

  // The entity offering the rental
  seller: DID;

  // The approximate area where the vehicle is available to pickup. Can be used to obfuscate the precise location
  areaServed: GeoCircle;

  // Available prices of an offer
  priceSpecifications: PriceSpecification[];

  // The payment method(s) accepted by seller for this offer
  acceptedPaymentMethods: LigoPaymentMethod[];

  // The amount of time that is required between accepting the offer and the actual usage of the resource or service
  advanceBookingRequirement?: QuantitativeValue;

  // The interval and unit of measurement of ordering quantities for which the offer or price specification is valid
  eligibleQuantity?: QuantitativeValue;
}
