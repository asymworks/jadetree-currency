import Decimal from 'decimal.js-light';
import Currency from './currency';
import { Locale } from './locale';
// eslint-disable-next-line camelcase
import { en_US_POSIX } from './locales/en';
import { format } from './formatter';
import { parse } from './parser';

// Money Amount Type
// eslint-disable-next-line no-use-before-define
type MoneyAmount = Money | Decimal | number | string;

/**
 *
 */
export default class Money {
  private amt: Decimal;
  private ccy: Currency;

  /**
   *
   */
  constructor(
    amount: MoneyAmount,
    currency?: Currency | Locale | string | number | undefined,
    locale?: Locale | undefined
  ) {
    this.amt = new Decimal(0);
    this.ccy = new Currency('XXX');
    let fmtLocale = locale;

    if (amount instanceof Money) {
      // Copy Constructor semantics
      return new Money(amount.amt, amount.ccy);
    }

    // Load Currency and maybe Locale
    if (currency instanceof Locale) {
      // Handle Money(<amount>, <locale>) call signature
      fmtLocale = currency;
      if (fmtLocale.currency) {
        this.ccy = fmtLocale.currency;
      }
    } else if (typeof currency === 'string' || typeof currency === 'number') {
      this.ccy = new Currency(currency);
    } else if (currency instanceof Currency) {
      this.ccy = currency;
    }

    // Parse Amount String?
    if (typeof amount === 'string') {
      this.amt = parse(amount, { locale: fmtLocale });
    } else {
      this.amt = new Decimal(amount);
    }

    // Freeze Object
    Object.freeze(this);
    Object.freeze(this.amt);
    Object.freeze(this.ccy);
  }

  /** Currency Object */
  get currency(): Currency {
    return this.ccy;
  }

  /** Decimal value */
  get amount(): Decimal {
    return this.amt.todp(this.ccy.precision);
  }

  /**
   * Add a Money Value to this Money Value
   * @param {Money|Decimal|Numeric|String} otherAmt amount to add
   * @return {Money} new Money object
   *
   * Adds the other money amount to this money amount and returns a new Money
   * object with the result. If the other money amount has no currency value
   * (or is a Decimal or plain numeric value), the resulting money will have
   * the same currency as this. If the other money amount has a currency which
   * is different than this, an exception is raised.
   */
  add(otherAmt: MoneyAmount): Money {
    if (otherAmt instanceof Money) {
      if (otherAmt.currency !== this.currency) {
        throw new Error(
          `Cannot add money of currency ${otherAmt.currency.currencyCode} to currency ${this.currency.currencyCode}`
        );
      }
      return new Money(this.amt.plus(otherAmt.amt), this.currency);
    }
    return new Money(
      this.amt.plus(new Decimal(otherAmt.toString())),
      this.currency
    );
  }

  /**
   * Subtract a Money Value to this Money Value
   * @param {Money|Decimal|Numeric|String} otherAmt amount to subtract
   * @return {Money} new Money object
   *
   * Subtracts the other money amount to this money amount and returns a new
   * Money object with the result. If the other money amount has no currency
   * value (or is a Decimal or plain numeric value), the resulting money will
   * have the same currency as this. If the other money amount has a currency
   * which is different than this, an exception is raised.
   */
  subtract(otherAmt: MoneyAmount): Money {
    if (otherAmt instanceof Money) {
      if (otherAmt.currency !== this.currency) {
        throw new Error(
          `Cannot subtract money of currency ${otherAmt.currency.currencyCode} from currency ${this.currency.currencyCode}`
        );
      }
      return new Money(this.amt.minus(otherAmt.amt), this.currency);
    }
    return new Money(
      this.amt.minus(new Decimal(otherAmt.toString())),
      this.currency
    );
  }

  /**
   * Multiply a Money Value with a Number
   * @param {Decimal|Numeric|String} factor amount by which to multiply
   * @param {Number} roundingMode Decimal Rounding Mode
   * @return {Money} new Money object
   *
   * Multiplies ththis money amount by a factor and returns a new Money object
   * with the result. The other amount must be a plain number (or Decimal)
   * object; it does not make sense to multiply currencies.
   *
   * Results are rounded to the nearest minor currency unit.  By default, this
   * uses half-up rounding (i.e. towards nearest neighbor, with half values
   * rounding away from zero). This can be overridden using Decimal rounding
   * constants (e.g. Decimal.ROUND_HALF_EVEN).
   */
  multiply(
    factor: Decimal | string | number,
    roundingMode = Decimal.ROUND_HALF_UP
  ): Money {
    return new Money(
      this.amt
        .times(new Decimal(factor.toString()))
        .todp(this.ccy.precision, roundingMode)
    );
  }

  /**
   * Allocate Money Evenly into Groups
   * @param {Array} ratios ratios to allocate
   * @return {Array} array of allocated values
   */
  distributeRatios(ratios: number[]): Money[] {
    const prec: number = this.ccy.precision || 6;
    if (
      !(
        typeof ratios === 'object' &&
        Array.isArray(ratios) &&
        ratios.length > 0
      )
    ) {
      throw new Error(
        'Money objects must be distributed by an array of ratios'
      );
    }

    const amtCents = this.amount
      .times(new Decimal(10).pow(prec))
      .toint()
      .toNumber();
    const results = [];
    let remainder = amtCents;
    let total = 0;

    // Calculate Total
    ratios.forEach((x) => {
      total += x;
    });

    // Allocate Money
    // eslint-disable-next-line unicorn/no-for-loop
    for (let i = 0; i < ratios.length; i += 1) {
      // ROUND_FLOOR is important here to ensure remainder stays positive
      const cents = new Decimal(amtCents)
        .times(ratios[i])
        .div(total)
        .todp(0, Decimal.ROUND_FLOOR);
      results[i] = new Money(
        cents.times(new Decimal(10).pow(-prec)),
        this.currency
      );
      remainder -= cents.toNumber();
    }

    // Allocate Remainder
    const cent = new Decimal(10).pow(-prec);
    for (let i = 0; i < remainder; i += 1) {
      results[i] = results[i].add(cent);
    }

    // Return Results
    return results;
  }

  /**
   * Allocate Money into multiple groups
   * @param {Number|Array} n number of groups among which to allocate, or array
   *                         of ratios.
   * @return {Array} array of allocated values
   *
   */
  distribute(n: number | number[]): Money[] {
    if (typeof n === 'number') {
      return this.distributeRatios(new Array(n).fill(1));
    }
    return this.distributeRatios(n);
  }

  /**
   * Compare two Money Values
   * @param {Money|Decimal|Numeric|String} otherAmt amount to compare
   * @return {Numeric} result
   *
   * Returns 0 if the money values are equal and have the same currency.
   * Returns 1 if the value of this Money is greater than otherAmt.
   * Returns -1 if the value of this Money is less than otherAmt.
   *
   * If the otherAmt has a different currency than this, an exception is
   * raised.
   */
  cmp(otherAmt: MoneyAmount): number {
    if (otherAmt instanceof Money) {
      if (otherAmt.currency !== this.currency) {
        throw new Error(
          `Cannot compare money of currency ${otherAmt.currency.currencyCode} to currency ${this.currency.currencyCode}`
        );
      }
      return this.amt.cmp(otherAmt.amt);
    }
    return this.amt.cmp(new Decimal(otherAmt));
  }

  /**
   * Return true if the other Money is equal to this. Equivalent to
   * (this.cmp(otherAmt) === 0)
   */
  eq(otherAmt: MoneyAmount): boolean {
    return this.cmp(otherAmt) === 0;
  }

  /**
   * Return true if the other Money is not equal to this. Equivalent to
   * (this.cmp(otherAmt) === 0)
   */
  ne(otherAmt: MoneyAmount): boolean {
    return this.cmp(otherAmt) !== 0;
  }

  /**
   * Return true if the this Money is greater than the other. Equivalent to
   * (this.cmp(otherAmt) > 0)
   */
  gt(otherAmt: MoneyAmount): boolean {
    return this.cmp(otherAmt) > 0;
  }

  /**
   * Return true if the this Money is greater than or equal to the other.
   * Equivalent to (this.cmp(otherAmt) >= 0)
   */
  ge(otherAmt: MoneyAmount): boolean {
    return this.cmp(otherAmt) >= 0;
  }

  /**
   * Return true if the this Money is less than the other. Equivalent to
   * (this.cmp(otherAmt) > 0)
   */
  lt(otherAmt: MoneyAmount): boolean {
    return this.cmp(otherAmt) < 0;
  }

  /**
   * Return true if the this Money is less than or equal to the other.
   * Equivalent to (this.cmp(otherAmt) <= 0)
   */
  le(otherAmt: MoneyAmount): boolean {
    return this.cmp(otherAmt) <= 0;
  }

  /**
   * Format the Money as a localized currency string
   * @param {Locale} locale locale to use for formatting (default is POSIX)
   * @param {String} formatType either 'standard' or 'accounting'
   */
  format(locale: Locale = en_US_POSIX, formatType = 'standard'): string {
    let fmtPattern = locale.currencyPattern;
    if (formatType === 'accounting') {
      fmtPattern = locale.accountingPattern;
    }

    if (!fmtPattern) {
      throw new Error(
        `Could not load format ${formatType} from locale ${locale.tag}`
      );
    }

    return format(this.amt, fmtPattern, { locale, currency: this.ccy });
  }

  /**
   * @return {String} String Representation of the Money
   *
   * Returns a string representation of the money of the form
   * "<XXX ##.###>" where "XXX" is the three-letter ISO 4127 Currency Code.
   */
  toString(): string {
    const amtString = format(this.amount, '#,##0.000000 ¤¤', {
      currency: this.ccy,
      currencyDigits: false,
    });
    return `<${amtString}>`;
  }
}