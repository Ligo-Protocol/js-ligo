import { QuantitativeValue, GeoCoordinates } from "./shared";

export interface LigoAgreementState {
  // The level of the fuel tank or in the case of electric cars, the battery, at the start of the trip
  startFuelLevel?: QuantitativeValue;

  // The odometer reading at the start of the trip
  startOdometer?: QuantitativeValue;

  // The location of the vehicle at the start of the trip
  startLocation?: GeoCoordinates;

  // The level of the fuel tank or in the case of electric cars, the battery, at the end of the trip
  endFuelLevel?: QuantitativeValue;

  // The odometer reading at the end of the trip
  endOdometer?: QuantitativeValue;

  // The location of the vehicle at the end of the trip
  endLocation?: GeoCoordinates;
}
