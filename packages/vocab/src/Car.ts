import { Date } from "./shared";

export interface Car {
  // The release date of a vehicle model (often used to differentiate versions of the same make and model)
  modelDate: Date;

  // The Vehicle Identification Number (VIN) is a unique serial number used by the automotive industry to identify individual motor vehicles
  vehicleIdentificationNumber: String;

  // The manufacturer of the vehicle
  manufacturer: String;

  // The make/brand of the vehicle.
  brand: String;

  // The model of the vehicle.
  model: String;

  // A short text indicating the configuration of the vehicle, e.g. '5dr hatchback ST 2.5 MT 225 hp' or 'limited edition'
  vehicleConfiguration: String;
}
