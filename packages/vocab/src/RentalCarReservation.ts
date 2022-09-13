import { Organization, Person, DateTime, Place } from "schema-dts";
import { IdReference, SchemaValue } from "./shared";
import { PriceSpecification } from "./PriceSpecification";
import { Car } from "./Car";

export interface RentalCarReservation {
  /** The date and time the reservation was booked. */
  bookingTime?: SchemaValue<DateTime, "bookingTime">;
  /** The date and time the reservation was modified. */
  modifiedTime?: SchemaValue<DateTime, "modifiedTime">;
  /** The entity providing the rental. Same as seller of Offer */
  provider?: SchemaValue<Organization | Person | IdReference, "provider">;
  /** The vehicle being reserved. */
  reservationFor?: SchemaValue<Car, "reservationFor">;
  /**
   * The total price for the reservation or ticket, including applicable taxes, shipping, etc.
   *
   * Usage guidelines:
   * - Use values from 0123456789 (Unicode 'DIGIT ZERO' (U+0030) to 'DIGIT NINE' (U+0039)) rather than superficially similiar Unicode symbols.
   * - Use '.' (Unicode 'FULL STOP' (U+002E)) rather than ',' to indicate a decimal point. Avoid using these symbols as a readability separator.
   */
  totalPrice?: SchemaValue<PriceSpecification, "totalPrice">;
  /** The person or organization the reservation or ticket is for. */
  underName?: SchemaValue<Organization | Person | IdReference, "underName">;
  /** Where a rental car can be dropped off. */
  dropoffLocation?: SchemaValue<Place, "dropoffLocation">;
  /** When a rental car can be dropped off. */
  dropoffTime?: SchemaValue<DateTime, "dropoffTime">;
  /** Where a taxi will pick up a passenger or a rental car can be picked up. */
  pickupLocation?: SchemaValue<Place, "pickupLocation">;
  /** When a taxi will pickup a passenger or a rental car can be picked up. */
  pickupTime?: SchemaValue<DateTime, "pickupTime">;
}
