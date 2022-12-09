import { DID, Date, GeoCoordinates } from "./shared";
import { CID } from "multiformats/cid";
import { PriceSpecification } from "./PriceSpecification";

// See https://schema.org/Place
export interface Place {
  geo?: GeoCoordinates;
  address?: String;
}

export interface RentalCarReservation {
  // The date and time the reservation was booked
  bookingTime: Date;

  // The date and time the reservation was modified
  modifiedTime: Date;

  // The entity providing the rental. Same as `seller` of `Offer`
  provider: DID;

  // The vehicle being reserved
  reservationFor: CID;

  // The total price for the reservation
  totalPrice: PriceSpecification;

  // The person or organization the reservation is for
  underName: DID;

  // Where a rental car can be dropped off
  dropoffLocation: Place;

  // When a rental car can be dropped off
  dropoffTime: Date;

  // Where a rental car can be picked up
  pickupLocation: Place;

  // When a rental car can be picked up
  pickupTime: Date;
}
