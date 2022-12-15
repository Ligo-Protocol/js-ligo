import { Car, schema } from "../src";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { create } from "@ipld/schema/typed.js";

describe("Car", () => {
  test("typed", async () => {
    const raw = {
      modelDate: "2019",
      vehicleIdentificationNumber: "5YJ3E1EA1KF064316",
      manufacturer: "Tesla, Inc.",
      brand: "Tesla",
      model: "Model 3",
      vehicleConfiguration: "Standard Range Plus",
    };
    const typed: Car = raw as Car;
    const schemaTyped = create(schema, "Car");
    const typedData = schemaTyped.toTyped(raw);
    const representationData = schemaTyped.toRepresentation(typed);

    expect(typedData).toBeDefined();
    expect(representationData).toBeDefined();

    expect(typedData).toEqual(typed);
    expect(representationData).toEqual(raw);
  }, 30000);
});
