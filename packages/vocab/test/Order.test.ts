import { Order, schema } from "../src";
import { CID } from "multiformats/cid";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { create } from "@ipld/schema/typed.js";

describe("Order", () => {
  test("typed", async () => {
    const raw = {
      acceptedOffer: CID.parse(
        "bafybeidskjjd4zmr7oh6ku6wp72vvbxyibcli2r6if3ocdcy7jjjusvl2u"
      ),
      customer: "",
      seller: "",
      orderDate: "",
      paymentMethod: {
        method: "LigoSafeEscrow",
        vehicleCredentialIssuers: [],
        erc792Arbitrator: "",
        buyerSignerAccountId: "",
        sellerSignerAccountId: "",
        deploymentPaymentAmount: 10,
        deploymentPaymentReceiver: "",
        deploymentNonce: "",
        safeAccountId: "",
      },
      paymentUrl: "",
      paymentMethodId: "",
    };
    const typed: Order = {
      acceptedOffer: CID.parse(
        "bafybeidskjjd4zmr7oh6ku6wp72vvbxyibcli2r6if3ocdcy7jjjusvl2u"
      ),
      customer: "",
      seller: "",
      orderDate: "",
      paymentMethod: {
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
      },
      paymentUrl: "",
      paymentMethodId: "",
    };
    const schemaTyped = create(schema, "Order");
    const typedData = schemaTyped.toTyped(raw);
    const representationData = schemaTyped.toRepresentation(typed);

    expect(typedData).toBeDefined();
    expect(representationData).toBeDefined();

    expect(typedData).toEqual(typed);
    expect(representationData).toEqual(raw);
  }, 30000);
});
