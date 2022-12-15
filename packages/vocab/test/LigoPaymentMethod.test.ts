import { LigoPaymentMethod, schema } from "../src";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { create } from "@ipld/schema/typed.js";

describe("LigoPaymentMethod", () => {
  test("typed", async () => {
    const raw = {
      method: "LigoSafeEscrow",
      vehicleCredentialIssuers: [],
      erc792Arbitrator: "",
      buyerSignerAccountId: "",
      sellerSignerAccountId: "",
      deploymentPaymentAmount: 10,
      deploymentPaymentReceiver: "",
      deploymentNonce: "",
      safeAccountId: "",
    };
    const typed: LigoPaymentMethod = {
      LigoSafeEscrow: {
        vehicleCredentialIssuers: [],
        erc792Arbitrator: "",
        buyerSignerAccountId: "",
        sellerSignerAccountId: "",
        deploymentPaymentAmount: 10,
        deploymentPaymentReceiver: "",
        deploymentNonce: "",
        safeAccountId: "",
      },
    };
    const schemaTyped = create(schema, "LigoPaymentMethod");
    const typedData = schemaTyped.toTyped(raw);
    const representationData = schemaTyped.toRepresentation(typed);

    expect(typedData).toBeDefined();
    expect(representationData).toBeDefined();

    expect(typedData).toEqual(typed);
    expect(representationData).toEqual(raw);
  }, 30000);
});
