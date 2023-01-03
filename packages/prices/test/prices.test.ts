import { Prices } from "../src";
import {
  LigoAgreementState,
  PriceSpecification,
  RentalCarReservation,
} from "@js-ligo/vocab";
import { CID } from "multiformats/cid";
import * as json from "multiformats/codecs/json";
import { sha256 } from "multiformats/hashes/sha2";

const bytes = json.encode({ hello: "world" });
const hash = await sha256.digest(bytes);
const cid = CID.create(1, json.code, hash);

describe("prices", () => {
  /**
   * Find Total Price
   *
   **/
  // Case 1: Base Price per day
  const case1: PriceSpecification[] = [
    {
      price: 25,
      priceCurrency: "USD",
      referenceQuantity: {
        value: 1,
        unitCode: "DAY",
      },
    },
  ];
  // Case 2: Base price per kilometer
  const case2: PriceSpecification[] = [
    {
      price: 0.25,
      priceCurrency: "USD",
      referenceQuantity: {
        value: 1,
        unitCode: "KMT",
      },
    },
  ];
  // Case 3: Base price per day + X$ per kilometer over Y range
  const case3: PriceSpecification[] = [
    {
      price: 25,
      priceCurrency: "USD",
      referenceQuantity: {
        value: 1,
        unitCode: "DAY",
      },
    },
    {
      price: 0.25,
      priceCurrency: "USD",
      eligibleQuantity: {
        minValue: 1000,
        unitCode: "KMT",
      },
      referenceQuantity: {
        value: 1,
        unitCode: "KMT",
      },
    },
  ];
  // Case 4: Base price per hour
  const case4: PriceSpecification[] = [
    {
      price: 5,
      priceCurrency: "USD",
      referenceQuantity: {
        value: 1,
        unitCode: "HUR",
      },
    },
  ];
  // Case 5: Different price per day
  const case5: PriceSpecification[] = [
    {
      price: 25,
      priceCurrency: "USD",
      validFrom: "2022-07-01T00:00:00Z",
      validThrough: "2022-07-10T00:00:00Z",
      referenceQuantity: {
        value: 1,
        unitCode: "DAY",
      },
    },
    {
      price: 30,
      priceCurrency: "USD",
      validFrom: "2022-07-10T00:00:00Z",
      referenceQuantity: {
        value: 1,
        unitCode: "DAY",
      },
    },
  ];
  // Case 6: Monthly Subscription of X$
  const case6: PriceSpecification[] = [
    {
      price: 1000,
      priceCurrency: "USD",
      billingIncrement: 1,
      referenceQuantity: {
        unitCode: "MON",
      },
    },
  ];
  // Case 7: Discount for Y+ days
  const case7: PriceSpecification[] = [
    {
      price: 25,
      priceCurrency: "USD",
      eligibleQuantity: {
        maxValue: 3,
        unitCode: "DAY",
      },
      referenceQuantity: {
        value: 1,
        unitCode: "DAY",
      },
    },
    {
      price: 20,
      priceCurrency: "USD",
      eligibleQuantity: {
        minValue: 3,
        unitCode: "DAY",
      },
      referenceQuantity: {
        value: 1,
        unitCode: "DAY",
      },
    },
  ];

  const rentalCarReservation: RentalCarReservation = {
    pickupTime: "2022-07-02T00:00:00Z",
    dropoffTime: "2022-07-15T00:00:00Z",
    bookingTime: "",
    modifiedTime: "",
    provider: "",
    underName: "",
    reservationFor: cid,
    totalPrice: {
      price: 20,
      priceCurrency: "USD",
    },
    dropoffLocation: {
      address: "CA",
    },
    pickupLocation: {
      address: "CA",
    },
  };

  const ligoAgreementState: LigoAgreementState = {
    startOdometer: {
      value: 1000,
    },
    endOdometer: {
      value: 2000,
    },
  };

  //Test Cases

  describe("Case 1: Base Price per day", () => {
    test("Total Price", async () => {
      const priceFinder = new Prices();
      const totalPrice = await priceFinder.calculateTotalPrice(
        case1,
        rentalCarReservation,
        ligoAgreementState
      );
      console.log(totalPrice);
      expect(totalPrice).toBeDefined();
      expect(typeof totalPrice === "number").toBe(true);
    }, 30000);
  });

  describe("Case 2: Base price per kilometer", () => {
    test("Total Price", async () => {
      const priceFinder = new Prices();
      const totalPrice = await priceFinder.calculateTotalPrice(
        case2,
        rentalCarReservation,
        ligoAgreementState
      );
      console.log(totalPrice);
      expect(totalPrice).toBeDefined();
      expect(typeof totalPrice === "number").toBe(true);
    }, 30000);
  });

  describe("Case 3: Base price per day + X$ per kilometer over Y range", () => {
    test("Total Price", async () => {
      const priceFinder = new Prices();
      const totalPrice = await priceFinder.calculateTotalPrice(
        case3,
        rentalCarReservation,
        ligoAgreementState
      );
      console.log(totalPrice);
      expect(totalPrice).toBeDefined();
      expect(typeof totalPrice === "number").toBe(true);
    }, 30000);
  });

  describe("Case 4: Base price per hour", () => {
    test("Total Price", async () => {
      const priceFinder = new Prices();
      const totalPrice = await priceFinder.calculateTotalPrice(
        case4,
        rentalCarReservation,
        ligoAgreementState
      );
      console.log(totalPrice);
      expect(totalPrice).toBeDefined();
      expect(typeof totalPrice === "number").toBe(true);
    }, 30000);
  });

  describe("Case 5: Different price per day", () => {
    test("Total Price", async () => {
      const priceFinder = new Prices();
      const totalPrice = await priceFinder.calculateTotalPrice(
        case5,
        rentalCarReservation,
        ligoAgreementState
      );
      console.log(totalPrice);
      expect(totalPrice).toBeDefined();
      expect(typeof totalPrice === "number").toBe(true);
    }, 30000);
  });

  describe("Case 6: Monthly Subscription of X$", () => {
    test("Total Price", async () => {
      const priceFinder = new Prices();
      const totalPrice = await priceFinder.calculateTotalPrice(
        case6,
        rentalCarReservation,
        ligoAgreementState
      );
      console.log(totalPrice);
      expect(totalPrice).toBeDefined();
      expect(typeof totalPrice === "number").toBe(true);
    }, 30000);
  });

  describe("Case 7: Discount for Y+ days", () => {
    test("Total Price", async () => {
      const priceFinder = new Prices();
      const totalPrice = await priceFinder.calculateTotalPrice(
        case7,
        rentalCarReservation,
        ligoAgreementState
      );
      console.log(totalPrice);
      expect(totalPrice).toBeDefined();
      expect(typeof totalPrice === "number").toBe(true);
    }, 30000);
  });
});
