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
declare class CurrencyData {
    currencyCode: string;
    numericCode: number;
    precision: number;
    /**
     * Class Constructor
     * @param {String} ccyCode      ISO 4127 Currency Code
     * @param {Number} numericCode  ISO 4127 Numeric Code
     * @param {Number} precision    Number of Fractional Digits
     * @return {Currency} New Currency Object
     */
    constructor(ccyCode: string, numericCode: number, precision: number);
    /**
     * @return {String} String Representation of the Currency
     *
     * Returns a string representation of the currency of the form
     * "<Currency 'XXX'>" where "XXX" is the three-letter ISO 4127 Currency Code.
     */
    toString(): string;
}
/**
 * Load a Currency Object from its ISO 4127 Code
 * @param {String|Number} code ISO 4127 Currency Code (string or numeric)
 * @return {CurrencyData} the Currency instance for the given currency code
 */
declare function Currency(code: string | number | CurrencyData): CurrencyData;
declare namespace Currency {
    var register: (currencyCode: string, numericCode: number, precision: number) => any;
    var all: () => CurrencyData[];
    var isCurrency: (obj: any) => boolean;
}
export default Currency;
