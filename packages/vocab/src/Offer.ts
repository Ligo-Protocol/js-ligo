import {
  Text,
  URL,
  Organization,
  Person,
  GeoShape,
  QuantitativeValue,
} from "schema-dts";
import { IdReference, SchemaValue } from "./shared";
import { PriceSpecification } from "./PriceSpecification";
import { LigoPaymentMethod } from "./LigoPaymentMethod";
import { Car } from "./Car";

export interface Offer {
  /** Description of the offer. */
  description?: SchemaValue<Text, "description">;
  /** Image(s) of specific vehicle being offered. */
  image?: SchemaValue<URL, "image">;
  /** The vehicle being offered. */
  itemOffered?: SchemaValue<Car | IdReference, "itemOffered">;
  /** The entity offering the rental. */
  seller?: SchemaValue<Organization | Person | IdReference, "seller">;
  /** The approximate area where the vehicle is available to pickup. Can be used to obfuscate the precise location. */
  areaServed?: SchemaValue<GeoShape, "areaServed">;
  /** Available prices of an offer. */
  priceSpecification?: SchemaValue<PriceSpecification, "priceSpecification">;
  /** The payment method(s) accepted by seller for this offer. */
  acceptedPaymentMethod?: SchemaValue<
    LigoPaymentMethod,
    "acceptedPaymentMethod"
  >;
  /** The amount of time that is required between accepting the offer and the actual usage of the resource or service. */
  advanceBookingRequirement?: SchemaValue<
    QuantitativeValue,
    "advanceBookingRequirement"
  >;
  /** The interval and unit of measurement of ordering quantities for which the offer or price specification is valid. */
  eligibleQuantity?: SchemaValue<QuantitativeValue, "eligibleQuantity">;
}
