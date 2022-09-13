import { Text, Organization, Brand } from "schema-dts";
import { IdReference, SchemaValue } from "./shared";

export interface Car {
  /** The release date of a vehicle model (often used to differentiate versions of the same make and model). */
  modelDate?: SchemaValue<Date, "modelDate">;
  /** A short text indicating the configuration of the vehicle, e.g. '5dr hatchback ST 2.5 MT 225 hp' or 'limited edition'. */
  vehicleConfiguration?: SchemaValue<Text, "vehicleConfiguration">;
  /** The Vehicle Identification Number (VIN) is a unique serial number used by the automotive industry to identify individual motor vehicles. */
  vehicleIdentificationNumber?: SchemaValue<
    Text,
    "vehicleIdentificationNumber"
  >;
  /** The brand(s) associated with a product or service, or the brand(s) maintained by an organization or business person. */
  brand?: SchemaValue<Brand | Organization | IdReference, "brand">;
  /** The manufacturer of the product. */
  manufacturer?: SchemaValue<Organization | IdReference, "manufacturer">;
  /** The model of the product. Use with the URL of a ProductModel or a textual representation of the model identifier. The URL of the ProductModel can be from an external source. It is recommended to additionally provide strong product identifiers via the gtin8/gtin13/gtin14 and mpn properties. */
  model?: SchemaValue<Text, "model">;
}
