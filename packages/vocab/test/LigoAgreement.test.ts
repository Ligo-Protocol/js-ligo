import { LigoAgreement, schema } from "../src";
import { CID } from "multiformats/cid";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { create } from "@ipld/schema/typed.js";

describe("LigoAgreement", () => {
  test("typed", async () => {
    const raw = {
      order: CID.parse(
        "bafybeidskjjd4zmr7oh6ku6wp72vvbxyibcli2r6if3ocdcy7jjjusvl2u"
      ),
      reservation: CID.parse(
        "bafybeidskjjd4zmr7oh6ku6wp72vvbxyibcli2r6if3ocdcy7jjjusvl2u"
      ),
    };
    const typed: LigoAgreement = {
      order: CID.parse(
        "bafybeidskjjd4zmr7oh6ku6wp72vvbxyibcli2r6if3ocdcy7jjjusvl2u"
      ),
      reservation: CID.parse(
        "bafybeidskjjd4zmr7oh6ku6wp72vvbxyibcli2r6if3ocdcy7jjjusvl2u"
      ),
    };
    const schemaTyped = create(schema, "LigoAgreement");
    const typedData = schemaTyped.toTyped(raw);
    const representationData = schemaTyped.toRepresentation(typed);

    expect(typedData).toBeDefined();
    expect(representationData).toBeDefined();

    expect(typedData).toEqual(typed);
    expect(representationData).toEqual(raw);
  }, 30000);
});
