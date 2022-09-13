import { GeoCoordinates, QuantitativeValue } from "schema-dts";
import { SchemaValue } from "./shared";

export interface LigoAgreementState {
  /** The level of the fuel tank or in the case of electric cars, the battery, at the start of the trip. */
  startFuelLevel?: SchemaValue<QuantitativeValue, "startFuelLevel">;
  /** The level of the fuel tank or in the case of electric cars, the battery, at the end of the trip. */
  endFuelLevel?: SchemaValue<QuantitativeValue, "endFuelLevel">;

  /** The odometer reading at the start of the trip. */
  startOdometer?: SchemaValue<QuantitativeValue, "startOdometer">;
  /** The odometer reading at the end of the trip. */
  endOdometer?: SchemaValue<QuantitativeValue, "endOdometer">;

  /** The location of the vehicle at the start of the trip. */
  startLocation?: SchemaValue<GeoCoordinates, "startLocation">;
  /** The location of the vehicle at the end of the trip. */
  endLocation?: SchemaValue<GeoCoordinates, "endLocation">;
}
