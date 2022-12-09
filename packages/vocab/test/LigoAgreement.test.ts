import { LigoAgreement, schema } from "../src";
import { CID } from "multiformats/cid";
// @ts-ignore
import { create } from "@ipld/schema/typed.js";

describe("LigoAgreement", () => {
  test("typed", async () => {
    const data: LigoAgreement = {
      order: CID.parse(
        "bafybeidskjjd4zmr7oh6ku6wp72vvbxyibcli2r6if3ocdcy7jjjusvl2u"
      ),
      reservation: CID.parse(
        "bafybeidskjjd4zmr7oh6ku6wp72vvbxyibcli2r6if3ocdcy7jjjusvl2u"
      ),
    };
    const schemaTyped = create(schema, "LigoAgreement");
    const typedData = schemaTyped.toTyped(data);

    expect(typedData).toBeDefined();
    expect(typedData).toEqual(data);
  }, 30000);
});
