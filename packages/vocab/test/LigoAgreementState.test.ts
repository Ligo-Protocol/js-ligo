import { LigoAgreementState, schema } from "../src";
import { CID } from "multiformats/cid";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { create } from "@ipld/schema/typed.js";

describe("LigoAgreementState", () => {
  test("typed", async () => {
    const raw = {
      startFuelLevel: {
        value: 70,
        unitCode: "KWH",
      },
      startOdometer: {
        value: 70,
        unitCode: "KMT",
      },
      startLocation: {
        latitude: 10,
        longitude: 10,
      },
      endFuelLevel: {
        value: 70,
        unitCode: "KWH",
      },
      endOdometer: {
        value: 70,
        unitCode: "KMT",
      },
      endLocation: {
        latitude: 10,
        longitude: 10,
      },
    };
    const typed: LigoAgreementState = raw as LigoAgreementState;
    const schemaTyped = create(schema, "LigoAgreementState");
    const typedData = schemaTyped.toTyped(raw);
    const representationData = schemaTyped.toRepresentation(typed);

    expect(typedData).toBeDefined();
    expect(representationData).toBeDefined();

    expect(typedData).toEqual(typed);
    expect(representationData).toEqual(raw);
  }, 30000);
});
