import ccyData from './ccy-data';

/** @private */
interface CurrencyData {
  readonly currencyCode: string;
  readonly numericCode: number;
  readonly precision: number;
}

/** @private */
interface RegistryEntry {
  data: CurrencyData;
  // eslint-disable-next-line no-use-before-define
  instance: Currency | undefined;
}

/** @private */
interface Registry {
  [key: string]: RegistryEntry;
}

/**
 * Registry of Currency Objects
 * @private
 */
const ccyRegistry: Registry = Object.create(null);

/**
 * ISO 4127 Currency Data Class
 * @typedef CurrencyData
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
export default class Currency {
  private data: CurrencyData | undefined;

  /**
   * Class Constructor
   *
   */
  constructor(code: string | number | Currency) {
    if (code instanceof Currency) {
      return code;
    }

    // Lookup by Name or Number
    let entry: RegistryEntry | undefined;
    if (typeof code === 'string') {
      entry = Object.values(ccyRegistry).find(
        (c: RegistryEntry) => c.data.currencyCode === code.toUpperCase()
      );
    } else if (typeof code === 'number') {
      entry = Object.values(ccyRegistry).find(
        (c: RegistryEntry) => c.data.numericCode === code
      );
    }

    if (!entry) {
      // Nothing Found
      throw new Error(`Currency with code ${code} is not defined`);
    }

    if (entry.instance) {
      return entry.instance;
    }

    this.data = entry.data;
    Object.freeze(this);

    entry.instance = this;
  }

  /** ISO 4217 Currency Code */
  get currencyCode(): string | undefined {
    return this.data?.currencyCode;
  }

  /** ISO 4217 Numeric Code */
  get numericCode(): number | undefined {
    return this.data?.numericCode;
  }

  /** Precision */
  get precision(): number | undefined {
    return this.data?.precision;
  }

  /**
   * @return {String} String Representation of the Currency
   *
   * Returns a string representation of the currency of the form
   * "<Currency 'XXX'>" where "XXX" is the three-letter ISO 4127 Currency Code.
   */
  toString(): string {
    return `<Currency '${this.data?.currencyCode}'>`;
  }
}

/**
 * Define a new {@link Currency} object if it does not already exist and enter
 * it into the runtime currency registry, after which it can be accessed using
 * using the {@link Currency} class.
 *
 * If the currency already exists, an Error will be thrown.
 *
 * @param {String} currencyCode ISO 4127 Currency Code
 * @param {Number} numericCode  ISO 4127 Numeric Code
 * @param {Number} precision    Number of Fractional Digits
 * @return {Currency} New Currency Object
 */
export function registerCurrency(
  currencyCode: string,
  numericCode: number,
  precision: number
): Currency {
  const ucCode = currencyCode.toUpperCase();
  if (Object.prototype.hasOwnProperty.call(ccyRegistry, ucCode)) {
    throw new Error(`Currency '${currencyCode}' has already been defined`);
  }

  // Add new Currency Data to the Registry
  ccyRegistry[ucCode] = {
    data: { currencyCode, numericCode, precision },
    instance: undefined,
  };

  // Return the Currency Data object
  return new Currency(ucCode);
}

/**
 * Gets the set of all available currencies.
 * @return {Array} Array of registered {@link Currency} objects
 */
export function allCurrencies(): string[] {
  return Object.keys(ccyRegistry);
}

// Load Currency Data
(function loadCurrencyData() {
  Object.keys(ccyData).forEach((ccy) => {
    const { n, p } = ccyData[ccy];
    ccyRegistry[ccy.toUpperCase()] = {
      data: {
        currencyCode: ccy.toUpperCase(),
        numericCode: n,
        precision: p,
      },
      instance: undefined,
    };
  });
})();
