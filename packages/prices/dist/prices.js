/* eslint-disable eqeqeq */ export class Prices {
    /**
   * Find Total Price
  // Case 1: Base Price per day
  // Case 2: Base price per kilometer
  // Case 3: Base price per day + X$ per kilometer over Y range
  // Case 4: Base price per hour
  // Case 5: Different price per day
  // Case 6: Monthly Subscription of X$
  // Case 7: Discount for Y+ days
  */ async calculateTotalPrice(_priceSpecifications, _rentalCarReservation, _ligoAgreementState) {
        let sum = 0;
        for(let i = 0; i < _priceSpecifications.length; i++){
            if (_priceSpecifications[i].referenceQuantity?.unitCode === "DAY") {
                sum = sum + await this._totalPriceDays(_priceSpecifications[i], _rentalCarReservation);
            } else if (_priceSpecifications[i].referenceQuantity?.unitCode === "KMT") {
                sum = sum + await this._totalPriceKM(_priceSpecifications[i], _ligoAgreementState);
            } else if (_priceSpecifications[i].referenceQuantity?.unitCode === "HUR") {
                sum = sum + await this._totalPriceHour(_priceSpecifications[i], _rentalCarReservation);
            } else if (_priceSpecifications[i].referenceQuantity?.unitCode === "MON") {
                sum = sum + await this._totalMonthlySub(_priceSpecifications[i]);
            }
        }
        return sum;
    }
    async _totalPriceDays(_priceSpecification, _rentalCarReservation) {
        //Filter ValidFrom and ValidThrough
        const validF = new Date(_priceSpecification.validFrom ? _priceSpecification.validFrom : _rentalCarReservation.pickupTime);
        const validT = new Date(_priceSpecification.validThrough ? _priceSpecification.validThrough : _rentalCarReservation.dropoffTime);
        const dropoffT = new Date(_rentalCarReservation.dropoffTime);
        const pickupT = new Date(_rentalCarReservation.pickupTime);
        const a = validF >= pickupT ? validF : pickupT;
        const b = validT <= dropoffT ? validT : dropoffT;
        // For discount maxValue
        if (_priceSpecification.eligibleQuantity?.maxValue != null) {
            return _priceSpecification.eligibleQuantity?.maxValue * _priceSpecification.price;
        }
        // For discount minValue
        if (_priceSpecification.eligibleQuantity?.minValue != null) {
            return (await this._dateDiffInDays(a, b) - _priceSpecification.eligibleQuantity?.minValue) * _priceSpecification.price;
        }
        // Normal days
        return await this._dateDiffInDays(a, b) * _priceSpecification.price;
    }
    async _totalPriceKM(_priceSpecification, _ligoAgreementState) {
        if (_ligoAgreementState.startOdometer?.value != null && _ligoAgreementState.endOdometer?.value != null) {
            if (_priceSpecification.eligibleQuantity?.minValue != null) {
                if (Math.abs(_ligoAgreementState.endOdometer.value - _ligoAgreementState.startOdometer.value) > _priceSpecification.eligibleQuantity?.minValue) {
                    return Math.abs(_ligoAgreementState.endOdometer.value - _ligoAgreementState.startOdometer.value - _priceSpecification.eligibleQuantity?.minValue) * _priceSpecification.price;
                }
            }
            {
                return Math.abs(_ligoAgreementState.endOdometer.value - _ligoAgreementState.startOdometer.value) * _priceSpecification.price;
            }
        } else return 0;
    }
    async _totalPriceHour(_priceSpecification, _rentalCarReservation) {
        const a = new Date(_rentalCarReservation.dropoffTime);
        const b = new Date(_rentalCarReservation.pickupTime);
        return await Math.abs(await this._hourDiffInDays(a, b)) * _priceSpecification.price;
    }
    async _totalMonthlySub(_priceSpecification) {
        if (_priceSpecification.billingIncrement != null) {
            return _priceSpecification.price * _priceSpecification.billingIncrement;
        }
        return 0;
    }
    async _dateDiffInDays(a, b) {
        const _MS_PER_DAY = 1000 * 60 * 60 * 24;
        // Discard the time and time-zone information.
        const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
        const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
        return Math.floor((utc2 - utc1) / _MS_PER_DAY);
    }
    async _hourDiffInDays(a, b) {
        const _MS_PER_HOUR = 1000 * 60 * 60;
        const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate(), a.getHours());
        const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate(), b.getHours());
        return Math.floor((utc2 - utc1) / _MS_PER_HOUR);
    }
}
