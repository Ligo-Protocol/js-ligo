import { QuantitativeValue, Date } from "./shared";

// See https://schema.org/PriceSpecification
export interface PriceSpecification {
  // The offer price of a product, or of a price component when attached to PriceSpecification and its subtypes
  price: number;

  // The currency of the price, or a price component when attached to PriceSpecification and its subtypes
  priceCurrency: string;

  // The interval and unit of measurement of ordering quantities for which the offer or price specification is valid
  eligibleQuantity?: QuantitativeValue;

  // The date when the item becomes valid
  validFrom?: Date;

  // The date after when the item is not valid
  validThrough?: Date;

  // The reference quantity for which a certain price applies
  referenceQuantity?: QuantitativeValue;

  // This property specifies the minimal quantity and rounding increment that will be the basis for the billing. The unit of measurement is specified by the unitCode property
  billingIncrement?: number;
}
