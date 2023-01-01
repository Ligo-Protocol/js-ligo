/* eslint-disable eqeqeq */
import { PriceSpecification } from "@js-ligo/vocab";
import { LigoAgreementState } from "@js-ligo/vocab";
import { RentalCarReservation } from "@js-ligo/vocab";
import { Offer } from "@js-ligo/vocab";

export class Prices {
  /**
   * Find Total Price
  // Case 1: Base Price per day
  // Case 2: Base price per kilometer
  // Case 3: Base price per day + X$ per kilometer over Y range
  // Case 4: Base price per hour
  // Case 5: Different price per day
  // Case 6: Monthly Subscription of X$
  // Case 7: Discount for Y+ days
  */
  async CalculateTotalPrice(
    _priceSpecifications: Offer["priceSpecifications"],
    _rentalCarReservation: RentalCarReservation,
    _ligoAgreementState: LigoAgreementState
  ) {
    let sum = 0;
    for (let i = 0; i < _priceSpecifications.length; i++) {
      if (_priceSpecifications[i].referenceQuantity?.unitCode === "DAY") {
        sum =
          sum +
          (await this._totalPriceDays(
            _priceSpecifications[i],
            _rentalCarReservation
          ));
      } else if (
        _priceSpecifications[i].referenceQuantity?.unitCode === "KMT"
      ) {
        const result = this._totalPriceKM(
          _priceSpecifications[i],
          _ligoAgreementState
        );
        if (typeof result == "number") {
          sum = sum + result;
        }
      } else if (
        _priceSpecifications[i].referenceQuantity?.unitCode === "HUR"
      ) {
        const result = this._totalPriceHour(
          _priceSpecifications[i],
          _rentalCarReservation
        );
        if (typeof result == "number") {
          sum = sum + result;
        }
      } else if (
        _priceSpecifications[i].referenceQuantity?.unitCode === "MON"
      ) {
        const result = this._totalMonthlySub(_priceSpecifications[i]);
        if (typeof result == "number") {
          sum = sum + result;
        }
      }
    }
  }

  private async _totalPriceDays(
    PriceSpecification: PriceSpecification,
    RentalCarReservation: RentalCarReservation
  ) {
    const a = new Date(RentalCarReservation.dropoffTime);
    const b = new Date(RentalCarReservation.pickupTime);
    // For discount maxValue
    if (PriceSpecification.eligibleQuantity?.maxValue != null) {
      return (
        PriceSpecification.eligibleQuantity?.maxValue * PriceSpecification.price
      );
    }
    // For discount minValue
    if (PriceSpecification.eligibleQuantity?.minValue != null) {
      return (
        ((await this._dateDiffInDays(a, b)) -
          PriceSpecification.eligibleQuantity?.minValue) *
        PriceSpecification.price
      );
    }
    // Normal days
    return (await this._dateDiffInDays(a, b)) * PriceSpecification.price;
  }

  private async _totalPriceKM(
    PriceSpecification: PriceSpecification,
    _ligoAgreementState: LigoAgreementState
  ) {
    if (
      _ligoAgreementState.startOdometer?.value != null &&
      _ligoAgreementState.endOdometer?.value != null
    ) {
      if (PriceSpecification.eligibleQuantity?.minValue != null) {
        if (
          Math.abs(
            _ligoAgreementState.endOdometer.value -
              _ligoAgreementState.startOdometer.value
          ) > PriceSpecification.eligibleQuantity?.minValue
        )
          return (
            Math.abs(
              _ligoAgreementState.endOdometer.value -
                _ligoAgreementState.startOdometer.value -
                PriceSpecification.eligibleQuantity?.minValue
            ) * PriceSpecification.price
          );
      }
      return (
        Math.abs(
          _ligoAgreementState.endOdometer.value -
            _ligoAgreementState.startOdometer.value
        ) * PriceSpecification.price
      );
    }
    return;
  }

  private async _totalPriceHour(
    PriceSpecification: PriceSpecification,
    RentalCarReservation: RentalCarReservation
  ) {
    const a = new Date(RentalCarReservation.dropoffTime);
    const b = new Date(RentalCarReservation.pickupTime);
    return (await this._hourDiffInDays(a, b)) * PriceSpecification.price;
  }

  private async _totalMonthlySub(PriceSpecification: PriceSpecification) {
    if (PriceSpecification.billingIncrement != null) {
      return PriceSpecification.price * PriceSpecification.billingIncrement;
    }
    return;
  }

  private async _dateDiffInDays(a: Date, b: Date) {
    const _MS_PER_DAY = 1000 * 60 * 60 * 24;
    // Discard the time and time-zone information.
    const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.floor((utc2 - utc1) / _MS_PER_DAY);
  }

  private async _hourDiffInDays(a: Date, b: Date) {
    const _MS_PER_HOUR = 1000 * 60 * 60;
    const utc1 = Date.UTC(
      a.getFullYear(),
      a.getMonth(),
      a.getDate(),
      a.getHours()
    );
    const utc2 = Date.UTC(
      b.getFullYear(),
      b.getMonth(),
      b.getDate(),
      b.getHours()
    );
    return Math.floor((utc2 - utc1) / _MS_PER_HOUR);
  }
}
