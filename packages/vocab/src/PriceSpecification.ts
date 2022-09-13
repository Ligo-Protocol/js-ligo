import { Text, QuantitativeValue, DateTime } from "schema-dts";
import { IdReference, SchemaValue } from "./shared";

interface PriceSpecificationBase {
  /**
   * The offer price of a product, or of a price component when attached to PriceSpecification and its subtypes.
   *
   * Usage guidelines:
   * - Use the {@link https://schema.org/priceCurrency priceCurrency} property (with standard formats: {@link http://en.wikipedia.org/wiki/ISO_4217 ISO 4217 currency format} e.g. "USD"; {@link https://en.wikipedia.org/wiki/List_of_cryptocurrencies Ticker symbol} for cryptocurrencies e.g. "BTC"; well known names for {@link https://en.wikipedia.org/wiki/Local_exchange_trading_system Local Exchange Tradings Systems} (LETS) and other currency types e.g. "Ithaca HOUR") instead of including {@link http://en.wikipedia.org/wiki/Dollar_sign#Currencies_that_use_the_dollar_or_peso_sign ambiguous symbols} such as '$' in the value.
   * - Use '.' (Unicode 'FULL STOP' (U+002E)) rather than ',' to indicate a decimal point. Avoid using these symbols as a readability separator.
   * - Note that both {@link http://www.w3.org/TR/xhtml-rdfa-primer/#using-the-content-attribute RDFa} and Microdata syntax allow the use of a "content=" attribute for publishing simple machine-readable values alongside more human-friendly formatting.
   * - Use values from 0123456789 (Unicode 'DIGIT ZERO' (U+0030) to 'DIGIT NINE' (U+0039)) rather than superficially similiar Unicode symbols.
   */
  price?: SchemaValue<Number | Text, "price">;
  /**
   * The currency of the price, or a price component when attached to {@link https://schema.org/PriceSpecification PriceSpecification} and its subtypes.
   *
   * Use standard formats: {@link http://en.wikipedia.org/wiki/ISO_4217 ISO 4217 currency format} e.g. "USD"; {@link https://en.wikipedia.org/wiki/List_of_cryptocurrencies Ticker symbol} for cryptocurrencies e.g. "BTC"; well known names for {@link https://en.wikipedia.org/wiki/Local_exchange_trading_system Local Exchange Tradings Systems} (LETS) and other currency types e.g. "Ithaca HOUR".
   */
  priceCurrency?: SchemaValue<Text, "priceCurrency">;
  /** The date when the item becomes valid. */
  validFrom?: SchemaValue<DateTime, "validFrom">;
  /** The date after when the item is not valid. For example the end of an offer, salary period, or a period of opening hours. */
  validThrough?: SchemaValue<DateTime, "validThrough">;
  /** The interval and unit of measurement of ordering quantities for which the offer or price specification is valid. */
  eligibleQuantity?: SchemaValue<QuantitativeValue, "eligibleQuantity">;
}

export interface UnitPriceSpecification extends PriceSpecificationBase {
  /** The reference quantity for which a certain price applies, e.g. 1 EUR per 4 kWh of electricity. This property is a replacement for unitOfMeasurement for the advanced cases where the price does not relate to a standard unit. */
  referenceQuantity?: SchemaValue<
    QuantitativeValue | IdReference,
    "referenceQuantity"
  >;
}

export type PriceSpecification =
  | PriceSpecificationBase
  | UnitPriceSpecification;
