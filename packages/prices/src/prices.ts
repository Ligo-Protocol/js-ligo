import { PriceSpecification } from "@js-ligo/vocab";

export class Prices {
  /**
   * Find Total Price Static
   */
  async findTotalStaticPrice(givenPrice: PriceSpecification) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const a = new Date(givenPrice.validThrough!);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const b = new Date(givenPrice.validFrom!);
    return (await this._dateDiffInDays(a, b)) * givenPrice.price;
  }

  private async _dateDiffInDays(a: Date, b: Date) {
    const _MS_PER_DAY = 1000 * 60 * 60 * 24;
    // Discard the time and time-zone information.
    const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.floor((utc2 - utc1) / _MS_PER_DAY);
  }
}
