import { IdReference, SchemaValue } from "./shared";
import { Order } from "./Order";
import { RentalCarReservation } from "./RentalCarReservation";

export interface LigoAgreement {
  /** The order that started the agreement. */
  order?: SchemaValue<Order | IdReference, "order">;
  /** Details of the reservation. */
  reservation?: SchemaValue<RentalCarReservation | IdReference, "reservation">;
}
