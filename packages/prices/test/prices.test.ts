import { PriceSpecification } from "@js-ligo/vocab";
import { Prices } from "../src";
import { DynamicPrice } from "../src";

describe("prices", () => {
  const givenPrice: PriceSpecification = {
    price: 30,
    priceCurrency: "USD",
    validFrom: "2017-01-01",
    validThrough: "2017-03-01",
  };
  const givenDynamicPrice: DynamicPrice = {
    "2017-01-01": 200,
    "2017-01-02": 300,
    "2017-01-03": 250,
  };

  describe("findTotalStaticPrice", () => {
    test("total static price", async () => {
      const priceFinder = new Prices();
      const totalPrice = await priceFinder.findTotalStaticPrice(givenPrice);
      console.log(totalPrice);
      expect(totalPrice).toBeDefined();
      expect(typeof totalPrice === "number").toBe(true);
    }, 30000);
  });

  describe("findTotalDynamicPrice", () => {
    test("total dynamic price", async () => {
      const priceFinder = new Prices();
      const totalPrice = await priceFinder.findTotalDynamicPrice(
        givenDynamicPrice
      );
      console.log(totalPrice);
      expect(totalPrice).toBeDefined();
      expect(typeof totalPrice === "number").toBe(true);
    }, 30000);
  });
});
