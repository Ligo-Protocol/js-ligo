import { Offer, schema } from "../src";
import { CID } from "multiformats/cid";
// @ts-ignore
import { create } from "@ipld/schema/typed.js";

describe("Offer", () => {
  test("typed", async () => {
    const data: Offer = {
      description: "test",
      images: [],
      itemOffered: CID.parse(
        "bafybeidskjjd4zmr7oh6ku6wp72vvbxyibcli2r6if3ocdcy7jjjusvl2u"
      ),
      seller: "",
      areaServed: {
        geoRadius: 10.0,
        geoMidpoint: {
          latitude: 10.0,
          longitude: 20.0,
        },
      },
      priceSpecifications: [],
      acceptedPaymentMethods: [],
      eligibleQuantity: {
        minValue: 5.0,
        unitCode: "DAY",
      },
    };
    const schemaTyped = create(schema, "Offer");
    const typedData = schemaTyped.toTyped(data);

    expect(typedData).toBeDefined();
    expect(typedData).toEqual(data);
  }, 30000);
});
