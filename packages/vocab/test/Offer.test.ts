import { Offer, schema } from "../src";
import { CID } from "multiformats/cid";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { create } from "@ipld/schema/typed.js";

describe("Offer", () => {
  test("typed", async () => {
    const raw = {
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
      acceptedPaymentMethods: [
        {
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
      ],
      eligibleQuantity: {
        minValue: 5.0,
        unitCode: "DAY",
      },
    };
    const typed: Offer = {
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
      acceptedPaymentMethods: [
        {
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
      ],
      eligibleQuantity: {
        minValue: 5.0,
        unitCode: "DAY",
      },
    };
    const schemaTyped = create(schema, "Offer");
    const typedData = schemaTyped.toTyped(raw);
    const representationData = schemaTyped.toRepresentation(typed);

    expect(typedData).toBeDefined();
    expect(representationData).toBeDefined();

    expect(typedData).toEqual(typed);
    expect(representationData).toEqual(raw);
  }, 30000);
});
