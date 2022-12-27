import { PriceSpecification } from "@js-ligo/vocab";
import { Prices } from "../src";

describe("prices", () => {
  const givenPrice: PriceSpecification = {
    price: 30,
    priceCurrency: "USD",
    validFrom: "2017-01-01",
    validThrough: "2017-03-01",
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
});
