import { Date } from "./shared";

export interface Car {
  // The release date of a vehicle model (often used to differentiate versions of the same make and model)
  modelDate: Date;

  // The Vehicle Identification Number (VIN) is a unique serial number used by the automotive industry to identify individual motor vehicles
  vehicleIdentificationNumber: string;

  // The manufacturer of the vehicle
  manufacturer: string;

  // The make/brand of the vehicle.
  brand: string;

  // The model of the vehicle.
  model: string;

  // A short text indicating the configuration of the vehicle, e.g. '5dr hatchback ST 2.5 MT 225 hp' or 'limited edition'
  vehicleConfiguration: string;
}
