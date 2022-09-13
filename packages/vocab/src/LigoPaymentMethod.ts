import { Text } from "schema-dts";
import { SchemaValue } from "./shared";
import { LigoVehicleOracle } from "./LigoVehicleOracle";

interface LigoSafeEscrowBase {
  /** The oracle used as the source of truth for vehicle data. */
  vehicleOracle?: SchemaValue<LigoVehicleOracle, "vehicleOracle">;
  /** The arbitrator used to resolve subjective disputes. */
  erc792Arbitrator?: SchemaValue<Text, "erc792Arbitrator">;
}

interface LigoSafeEscrowLeaf extends LigoSafeEscrowBase {
  "@type": "LigoSafeEscrow";
}

export declare type LigoSafeEscrow = LigoSafeEscrowLeaf;
export declare type LigoPaymentMethod = LigoSafeEscrow;
