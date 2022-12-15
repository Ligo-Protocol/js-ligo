import { RentalCarReservation, schema } from "../src";
import { CID } from "multiformats/cid";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { create } from "@ipld/schema/typed.js";

describe("RentalCarReservation", () => {
  test("typed", async () => {
    const raw = {
      bookingTime: "2020-01-01",
      modifiedTime: "2020-01-01",
      provider: "did:web:test",
      reservationFor: CID.parse(
        "bafybeidskjjd4zmr7oh6ku6wp72vvbxyibcli2r6if3ocdcy7jjjusvl2u"
      ),
      totalPrice: {
        price: 25,
        priceCurrency: "USD",
        referenceQuantity: {
          value: 1,
          unitCode: "DAY",
        },
      },
      underName: "did:web:test1",
      dropoffLocation: {
        address: "Some Address",
      },
      dropoffTime: "2020-01-01",
      pickupLocation: {
        address: "Some Address",
      },
      pickupTime: "2020-01-01",
    };
    const typed: RentalCarReservation = {
      bookingTime: "2020-01-01",
      modifiedTime: "2020-01-01",
      provider: "did:web:test",
      reservationFor: CID.parse(
        "bafybeidskjjd4zmr7oh6ku6wp72vvbxyibcli2r6if3ocdcy7jjjusvl2u"
      ),
      totalPrice: {
        price: 25,
        priceCurrency: "USD",
        referenceQuantity: {
          value: 1,
          unitCode: "DAY",
        },
      },
      underName: "did:web:test1",
      dropoffLocation: {
        address: "Some Address",
      },
      dropoffTime: "2020-01-01",
      pickupLocation: {
        address: "Some Address",
      },
      pickupTime: "2020-01-01",
    };
    const schemaTyped = create(schema, "RentalCarReservation");
    const typedData = schemaTyped.toTyped(raw);
    const representationData = schemaTyped.toRepresentation(typed);

    expect(typedData).toBeDefined();
    expect(representationData).toBeDefined();

    expect(typedData).toEqual(typed);
    expect(representationData).toEqual(raw);
  }, 30000);
});
