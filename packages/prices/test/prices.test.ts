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
  // Case 2: Base price per mile
  const case2_2: PriceSpecification[] = [
    {
      price: 0.25,
      priceCurrency: "USD",
      referenceQuantity: {
        value: 1,
        unitCode: "SMI",
      },
    },
  ];
  // Case 3.1 & 3.2: Base price per day + X$ per kilometer over Y range
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

  // Case 3.3: Base price per day + X$ per kilometer over Y range mileage greater than 0$
  const case3_3: PriceSpecification[] = [
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
        minValue: 500,
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
      validThrough: "2022-07-05T00:00:00Z",
      referenceQuantity: {
        value: 1,
        unitCode: "DAY",
      },
    },
    {
      price: 30,
      priceCurrency: "USD",
      validFrom: "2022-07-05T00:00:00Z",
      referenceQuantity: {
        value: 1,
        unitCode: "DAY",
      },
    },
  ];
  // Case 6.1: Monthly Subscription of X$
  const case6_1: PriceSpecification[] = [
    {
      price: 1000,
      priceCurrency: "USD",
      billingIncrement: 1,
      referenceQuantity: {
        unitCode: "MON",
      },
    },
  ];
  // Case 6.2: Monthly Subscription of X$
  const case6_2: PriceSpecification[] = [
    {
      price: 1000,
      priceCurrency: "USD",
      billingIncrement: 5,
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

  const rentalCarReservation2: RentalCarReservation = {
    pickupTime: "2022-07-02T00:00:00Z",
    dropoffTime: "2022-09-15T00:00:00Z",
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
      console.log("case 1", totalPrice);
      expect(totalPrice).toBeDefined();
      expect(totalPrice === 325).toBe(true);
    }, 30000);
  });

  describe("Case 2.1 : Base price per kilometer", () => {
    test("Total Price", async () => {
      const priceFinder = new Prices();
      const totalPrice = await priceFinder.calculateTotalPrice(
        case2,
        rentalCarReservation,
        ligoAgreementState
      );
      console.log("case 2.1", totalPrice);
      expect(totalPrice).toBeDefined();
      expect(totalPrice === 250).toBe(true);
    }, 30000);
  });

  describe("Case 2.2 : Base price per mile", () => {
    test("Total Price", async () => {
      const priceFinder = new Prices();
      const totalPrice = await priceFinder.calculateTotalPrice(
        case2_2,
        rentalCarReservation,
        ligoAgreementState
      );
      console.log("case 2.2", totalPrice);
      expect(totalPrice).toBeDefined();
      expect(totalPrice === 402.336).toBe(true);
    }, 30000);
  });

  describe("Case 3.1 : Base price per day + X$ per kilometer over Y range", () => {
    test("Total Price", async () => {
      const priceFinder = new Prices();
      const totalPrice = await priceFinder.calculateTotalPrice(
        case3,
        rentalCarReservation,
        ligoAgreementState
      );
      console.log("case 3.1", totalPrice);
      expect(totalPrice).toBeDefined();
      expect(totalPrice === 325).toBe(true);
    }, 30000);
  });

  describe("Case 3.2 : Base price per day + X$ per kilometer over Y range for multiple months", () => {
    test("Total Price", async () => {
      const priceFinder = new Prices();
      const totalPrice = await priceFinder.calculateTotalPrice(
        case3,
        rentalCarReservation2,
        ligoAgreementState
      );
      console.log("case 3.2", totalPrice);
      expect(totalPrice).toBeDefined();
      expect(totalPrice === 1875).toBe(true);
    }, 30000);
  });

  describe("Case 3.3 : Base price per day + X$ per kilometer over Y range mileage more than 0$", () => {
    test("Total Price", async () => {
      const priceFinder = new Prices();
      const totalPrice = await priceFinder.calculateTotalPrice(
        case3_3,
        rentalCarReservation,
        ligoAgreementState
      );
      console.log("case 3.3", totalPrice);
      expect(totalPrice).toBeDefined();
      expect(totalPrice === 450).toBe(true);
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
      console.log("case 4", totalPrice);
      expect(totalPrice).toBeDefined();
      expect(totalPrice === 1560).toBe(true);
    }, 30000);
  });

  describe("Case 5.1 : Different price per day", () => {
    test("Total Price", async () => {
      const priceFinder = new Prices();
      const totalPrice = await priceFinder.calculateTotalPrice(
        case5,
        rentalCarReservation,
        ligoAgreementState
      );
      console.log("case 5.1", totalPrice);
      expect(totalPrice).toBeDefined();
      expect(totalPrice === 375).toBe(true);
    }, 30000);
  });

  describe("Case 5.2 : Different price per day for multiple months", () => {
    test("Total Price", async () => {
      const priceFinder = new Prices();
      const totalPrice = await priceFinder.calculateTotalPrice(
        case5,
        rentalCarReservation2,
        ligoAgreementState
      );
      console.log("case 5.2", totalPrice);
      expect(totalPrice).toBeDefined();
      expect(totalPrice === 2235).toBe(true);
    }, 30000);
  });

  describe("Case 6.1: Monthly Subscription of X$", () => {
    test("Total Price", async () => {
      const priceFinder = new Prices();
      const totalPrice = await priceFinder.calculateTotalPrice(
        case6_1,
        rentalCarReservation,
        ligoAgreementState
      );
      console.log("case 6.1", totalPrice);
      expect(totalPrice).toBeDefined();
      expect(totalPrice === 1000).toBe(true);
    }, 30000);
  });
  describe("Case 6.2: Monthly Subscription of X$ multiple months", () => {
    test("Total Price", async () => {
      const priceFinder = new Prices();
      const totalPrice = await priceFinder.calculateTotalPrice(
        case6_2,
        rentalCarReservation,
        ligoAgreementState
      );
      console.log("case 6.2", totalPrice);
      expect(totalPrice).toBeDefined();
      expect(totalPrice === 5000).toBe(true);
    }, 30000);
  });

  describe("Case 7.1 : Discount for Y+ days", () => {
    test("Total Price", async () => {
      const priceFinder = new Prices();
      const totalPrice = await priceFinder.calculateTotalPrice(
        case7,
        rentalCarReservation,
        ligoAgreementState
      );
      console.log("case 7.1", totalPrice);
      expect(totalPrice).toBeDefined();
      expect(totalPrice === 275).toBe(true);
    }, 30000);
  });
  describe("Case 7.2 : Discount for Y+ days for multiple months", () => {
    test("Total Price", async () => {
      const priceFinder = new Prices();
      const totalPrice = await priceFinder.calculateTotalPrice(
        case7,
        rentalCarReservation2,
        ligoAgreementState
      );
      console.log("case 7.2", totalPrice);
      expect(totalPrice).toBeDefined();
      expect(totalPrice === 1515).toBe(true);
    }, 30000);
  });
});
