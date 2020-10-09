/**
 * nvlps-currency Currency Library for nvlps.io
 *
 *   Copyright (c) 2020 Asymworks, LLC.
 *
 *   The nvlps-currency library may be freely distributed under the terms of
 *   the BSD license.  For all licensing information, details and documentation:
 *   https://nvlps.io/nvlps-currency
 *
 * nvlps-currency contains currency and money handling routines for the
 * nvlps.io budgeting software package.  It includes currency information for
 * most world currencies as well as localized formatting, currency symbols, and
 * currency names.
 */

// Currency Data
import ccyData from './ccy-data';

/**
 * ISO 4127 Currency Data Class
 * @typedef CurrencyData
 * @type {Object}
 * @property {String} currencyCode ISO 4127 Currency Code
 * @property {Number} numericCode  ISO 4127 Numeric Code
 * @property {Number} precision    Number of Fractional Digits
 *
 * Represents a currency. Currencies are identified by their ISO 4217 currency
 * codes. Visit the ISO web site for more information.
 *
 * This class is not exported and is not intended to be created directly. Use
 * the Currency and Currency.register functions to obtain CurrencyData
 * instances.
 */
class CurrencyData {
  readonly currencyCode: string;
  readonly numericCode: number;
  readonly precision: number;

  /**
   * Class Constructor
   * @param {String} ccyCode      ISO 4127 Currency Code
   * @param {Number} numericCode  ISO 4127 Numeric Code
   * @param {Number} precision    Number of Fractional Digits
   * @return {Currency} New Currency Object
   */
  constructor(ccyCode: string, numericCode: number, precision: number) {
    this.currencyCode = ccyCode;
    this.numericCode = numericCode;
    this.precision = precision;
    Object.freeze(this);
  }

  /**
   * @return {String} String Representation of the Currency
   *
   * Returns a string representation of the currency of the form
   * "<Currency 'XXX'>" where "XXX" is the three-letter ISO 4127 Currency Code.
   */
  toString() {
    return `<Currency '${this.currencyCode}'>`;
  }
}

/**
 * Registry of Currency Objects
 * @private
 */
const ccyRegistry: { [key: string]: CurrencyData } = Object.create(null);

/**
 * Load a Currency Object from its ISO 4127 Code
 * @param {String|Number} code ISO 4127 Currency Code (string or numeric)
 * @return {CurrencyData} the Currency instance for the given currency code
 */
function Currency(code: string | number | CurrencyData): CurrencyData {
  if (code instanceof CurrencyData) {
    return code;
  }
  if (typeof code === 'string') {
    // Direct Lookup from Registry
    if (
      !Object.prototype.hasOwnProperty.call(ccyRegistry, code.toUpperCase())
    ) {
      throw new Error(`Currency '${code}' is not defined`);
    }

    return ccyRegistry[code.toUpperCase()];
  }
  if (typeof code === 'number') {
    const ccy: CurrencyData | undefined = Object.values(ccyRegistry).find(
      (c: CurrencyData) => c.numericCode === code
    );
    if (ccy) {
      return ccy;
    }
  }

  throw new Error(`Currency with code ${code} is not defined`);
}

/**
 * Define a new Currency Object
 * @param {String} currencyCode ISO 4127 Currency Code
 * @param {Number} numericCode  ISO 4127 Numeric Code
 * @param {Number} precision    Number of Fractional Digits
 * @return {CurrencyData} New Currency Object
 * @static
 *
 * This function defines a new {Currency} object if it does not already exist
 * and enters it into the runtime currency registry, after which it can be
 * accessed using {Currency.getCurrency}.
 *
 * If the currency already exists, an Error will be thrown.
 */
Currency.register = function registerCurrency(
  currencyCode: string,
  numericCode: number,
  precision: number
) {
  const ucCode = currencyCode.toUpperCase();
  if (Object.prototype.hasOwnProperty.call(ccyRegistry, ucCode)) {
    throw new Error(`Currency '${currencyCode}' has already been defined`);
  }

  // Add new Currency Data to the Registry
  ccyRegistry[ucCode] = new CurrencyData(currencyCode, numericCode, precision);

  // Return the Currency Data object
  return ccyRegistry[ucCode];
};

/**
 * Gets the set of all available currencies.
 * @return {Array} Array of {Currency} objects
 * @static
 */
Currency.all = function allCurrencies() {
  const ccys: CurrencyData[] = [];
  Object.keys(ccyRegistry).forEach((ccyCode) => {
    ccys.push(ccyRegistry[ccyCode]);
  });
  return ccys;
};

/**
 * Check if an Object is a CurrencyData Instance
 * @param {Object} object object to test
 * @return {Boolean} true if the obj is a CurrencyData instance
 * @static
 */
Currency.isCurrency = function isCurrency(object: unknown) {
  return object instanceof CurrencyData;
};

// Export the Currency function
export default Currency;

// Load Currency Data
(function loadCurrencyData() {
  Object.keys(ccyData).forEach((ccy) => {
    const { n, p } = ccyData[ccy];
    Currency.register(ccy, n, p);
  });
})();
