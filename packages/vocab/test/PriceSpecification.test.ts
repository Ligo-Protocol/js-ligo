import { PriceSpecification, schema } from "../src";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { create } from "@ipld/schema/typed.js";

describe("PriceSpecification", () => {
  test("typed", async () => {
    const raw = {
      price: 25,
      priceCurrency: "USD",
      referenceQuantity: {
        value: 1,
        unitCode: "DAY",
      },
    };
    const typed: PriceSpecification = raw as PriceSpecification;
    const schemaTyped = create(schema, "PriceSpecification");
    const typedData = schemaTyped.toTyped(raw);
    const representationData = schemaTyped.toRepresentation(typed);

    expect(typedData).toBeDefined();
    expect(representationData).toBeDefined();

    expect(typedData).toEqual(typed);
    expect(representationData).toEqual(raw);
  }, 30000);
});
