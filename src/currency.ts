import ccyData from './ccy-data';

/** @internal */
interface CurrencyData {
  readonly currencyCode: string;
  readonly numericCode: number;
  readonly precision: number;
}

/** @internal */
interface RegistryEntry {
  data: CurrencyData;
  // eslint-disable-next-line no-use-before-define
  instance: Currency | undefined;
}

/** @internal */
interface Registry {
  [key: string]: RegistryEntry;
}

/**
 * Registry of Currency Objects
 * @internal
 */
const ccyRegistry: Registry = Object.create(null);

/**
 * ISO 4127 Currency Data Class
 *
 * Represents a currency. Currencies are identified by their ISO 4217 currency
 * codes. Visit the ISO web site for more information.
 *
 * This class provides singleton access to pre-defined currencies, and repeated
 * calls to `new Currency()` with the same currency code return the same
 * immutable object. To create a new currency, use the
 * {@link Currency.registerCurrency} static class method.
 */
export class Currency {
  /** @internal */
  private data: CurrencyData;

  /**
   * Load an object containing data for the given ISO 4217 currency code. The
   * provided code can be a string code (`USD`) or numeric code (`840`). This
   * method returns a singleton object, so repeated calls to the constructor
   * with the same currency code return the same object. Returned objects are
   * frozen and cannot be modified.
   *
   * Calling the constructor with a `Currency` object as the argument will
   * return the same object, and can be used to ensure a value is a valid
   * `Currency` instance.
   *
   * @param code ISO 4217 currency code (string or numeric)
   */
  constructor(code: string | number | Currency) {
    this.data = { currencyCode: '', numericCode: 0, precision: 0 };
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
  get currencyCode(): string {
    return this.data.currencyCode;
  }

  /** ISO 4217 Numeric Code */
  get numericCode(): number {
    return this.data.numericCode;
  }

  /** Precision */
  get precision(): number {
    return this.data.precision;
  }

  /**
   * Return a string representation of the currency of the form
   * `<Currency 'XXX'>` where "XXX" is the three-letter ISO 4217 Currency Code.
   */
  toString(): string {
    return `<Currency '${this.data?.currencyCode}'>`;
  }

  /**
   * Define a new {@link Currency} object and enter it into the runtime
   * currency registry, after which it can be accessed using using the
   * {@link Currency} class constructor.
   *
   * If the currency already exists, an Error will be thrown.
   *
   * @param currencyCode ISO 4127 Currency Code
   * @param numericCode  ISO 4127 Numeric Code
   * @param precision    Number of Fractional Digits
   * @return new `Currency` object
   */
  static registerCurrency(
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
   * Gets the list of all available currencies
   * @return list of registered currency codes
   */
  static allCurrencies(): string[] {
    return Object.keys(ccyRegistry);
  }
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
