import { Currency } from './currency';
import { parseLocale } from './locale-utils';
import { NumberPattern, parsePattern } from './numpattern';

/**
 * Locale Data Record
 *
 * The Locale Data Record holds all the required information to do localized
 * numeric formatting of decimal, currency, percent, and scientific numbers.
 *
 * > Note that the number pattern fields are expected to comply with the
 * > Unicode CLDR Number Pattern spec. The specification can be found online
 * > at http://cldr.unicode.org/translation/numbers-currency/number-patterns
 */
export interface LocaleData {
  /** Decimal Symbol */
  readonly d?: string;

  /** Grouping Symbol */
  readonly g?: string;

  /** Plus Sign */
  readonly p?: string;

  /** Minus Sign */
  readonly m?: string;

  /** Percent Sign */
  readonly pc?: string;

  /** Permille Sign */
  readonly pm?: string;

  /** Exponential Symbol */
  readonly e?: string;

  /** Superscripting Exponent Symbol */
  readonly x?: string;

  /** Infinity Symbol */
  readonly inf?: string;

  /** Not-a-Number Symbol */
  readonly nan?: string;

  /** Local ISO 4217 Currency Code */
  readonly c?: string;

  /** Map of ISO 4217 currency codes to localized symbols */
  readonly cs?: { [key: string]: string };

  /** Map of ISO 4217 currency codes to localized names */
  readonly cn?: { [key: string]: string };

  /** Decimal Number Pattern */
  readonly np?: string;

  /** Currency Number Pattern */
  readonly cp?: string;

  /** Accounting Number Pattern */
  readonly ap?: string;

  /** Percentage Pattern */
  readonly pp?: string;

  /** Scientific Notation Pattern */
  readonly sp?: string;

  /** @internal */
  readonly [index: string]: string | { [key: string]: string } | undefined;
}

/**
 * Shim for Object.hasOwnProperty
 * @internal
 */
const hasOwnProperty = (o: unknown, k: string): boolean =>
  Object.prototype.hasOwnProperty.call(o, k);

/**
 * Holds all formatting data associated with a particular locale, such as
 * decimal point, grouping symbol, currency symbols and names, and number
 * formatting patterns.  Jade Tree locales are pre-defined and can be imported
 * directly from the `@jadetree/currency/locales` module.
 */
export class Locale {
  /** Locale Tag */
  readonly tag: string;

  /** Language */
  readonly language: string;

  /** Territory or Region Name */
  readonly territory: string | undefined;

  /** Script Name */
  readonly script: string | undefined;

  /** Variant Name */
  readonly variant: string | undefined;

  /** Locale Data */
  private readonly data: LocaleData;

  /** Parent Locale */
  private readonly parent: Locale | undefined;

  /** Decimal Number Pattern */
  readonly decimalPattern: NumberPattern | undefined;

  /** Currency Number Pattern */
  readonly currencyPattern: NumberPattern | undefined;

  /** Accounting Number Pattern */
  readonly accountingPattern: NumberPattern | undefined;

  /** Percentage Number Pattern */
  readonly percentagePattern: NumberPattern | undefined;

  /** Scientific Number Pattern */
  readonly scientificPattern: NumberPattern | undefined;

  /**
   * Create a new Locale definition. Data passed in the `data` parameter will
   * override anything from the `parent` locale. Users will typically not need
   * to create `Locale` objects unless they need a custom locale not provided
   * by Jade Tree.
   *
   * @param tag locale tag with underscore separators (e.g. `en_US`)
   * @param data formatting data specific to this locale
   * @param parent formatting data that this locale inherits
   */
  constructor(tag: string, data: LocaleData, parent?: Locale | undefined) {
    const { language, territory, script, variant } = parseLocale(tag);
    this.tag = tag;
    this.data = data;
    this.language = language;
    this.territory = territory;
    this.script = script;
    this.variant = variant;

    // Language-only Locales may not have a parent
    if (!territory && !script && !variant) {
      if (parent && parent.tag !== 'root') {
        throw new Error(`Language-only Locale ${tag} may not have a parent`);
      }
    }

    // Parent must share language
    if (parent) {
      if (parent.tag !== 'root' && parent.language !== this.language) {
        throw new Error(
          `Locale ${tag} must have a parent with language ${language}`
        );
      }
      this.parent = parent;
    }

    // Load Number Patterns
    const np = this.getField('np');
    if (np) {
      this.decimalPattern = parsePattern(np);
    }

    const cp = this.getField('cp');
    if (cp) {
      this.currencyPattern = parsePattern(cp);
    }

    const ap = this.getField('ap');
    if (ap) {
      this.accountingPattern = parsePattern(ap);
    }

    const pp = this.getField('pp');
    if (pp) {
      this.percentagePattern = parsePattern(pp);
    }

    const sp = this.getField('sp');
    if (sp) {
      this.scientificPattern = parsePattern(sp);
    }

    // Freeze Objects
    Object.freeze(this.data);
    Object.freeze(this.decimalPattern);
    Object.freeze(this.currencyPattern);
    Object.freeze(this.accountingPattern);
    Object.freeze(this.percentagePattern);
    Object.freeze(this.scientificPattern);
    Object.freeze(this);
  }

  /**
   * Lookup a property recursively by walking up the locale data inheritance
   * chain until a locale has the specified key defined.
   *
   * @param key key name within {@link LocaleData}
   * @return first found value or `undefined` if the key was not set by this
   *  locale or any parent
   * @private
   */
  private getField(key: string): string | undefined {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let currentObject: Locale | undefined = this;
    let returnValue: string | { [key: string]: string } | undefined;
    while (currentObject && !hasOwnProperty(currentObject.data, key)) {
      currentObject = currentObject.parent;
    }

    // Help TypeScript with Narrowing
    if (currentObject) {
      returnValue = currentObject.data[key];
    }

    if (typeof returnValue === 'string') {
      return returnValue;
    }

    // eslint-disable-next-line unicorn/no-useless-undefined
    return undefined;
  }

  /**
   * Lookup a map property recursively by walking up the locale data inheritance
   * chain until a locale has the specified key defined.
   *
   * @param dataKey key name within {@link LocaleData.cs} or
   *  {@link LocaleData.cn}
   * @param dictKey key name within the `cs` or `cn` map
   * @return first found value or `undefined` if the data key or map key was
   *  not set by this locale or any parent
   * @private
   */
  private getDictField(dataKey: string, dictKey: string): string | undefined {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let currentObject: Locale | undefined = this;
    let returnValue: string | { [key: string]: string } | undefined;
    while (currentObject) {
      const hasDataKey = hasOwnProperty(currentObject.data, dataKey);
      const hasDictKey =
        hasDataKey && hasOwnProperty(currentObject.data[dataKey], dictKey);

      if (hasDataKey && hasDictKey) {
        break;
      }

      currentObject = currentObject.parent;
    }

    // Help TypeScript with Narrowing
    if (currentObject) {
      returnValue = currentObject.data[dataKey];
    }

    if (typeof returnValue === 'object') {
      return returnValue[dictKey];
    }

    // eslint-disable-next-line unicorn/no-useless-undefined
    return undefined;
  }

  /** Decimal Point Symbol */
  get decimal(): string | undefined {
    return this.getField('d');
  }

  /** Digit Grouping Symbol */
  get group(): string | undefined {
    return this.getField('g');
  }

  /** Plus Sign */
  get plusSign(): string | undefined {
    return this.getField('p');
  }

  /** Minus Sign */
  get minusSign(): string | undefined {
    return this.getField('m');
  }

  /** Percent Sign */
  get percentSign(): string | undefined {
    return this.getField('pc');
  }

  /** Permille Sign */
  get permilleSign(): string | undefined {
    return this.getField('pm');
  }

  /** Exponential Sign */
  get exponential(): string | undefined {
    return this.getField('e');
  }

  /** Superscripting Exponent */
  get superscriptingExponent(): string | undefined {
    return this.getField('x');
  }

  /** Infinity String */
  get inf(): string | undefined {
    return this.getField('inf');
  }

  /** Not-a-Number String */
  get nan(): string | undefined {
    return this.getField('nan');
  }

  /** Default Currency */
  get currency(): Currency {
    const ccy = this.getField('c');
    if (typeof ccy === 'undefined') {
      return new Currency('XXX');
    }
    return new Currency(ccy);
  }

  /**
   * Look up the localized Currency Symbol
   *
   * If the locale provides a symbol for the currency, it is returned,
   * otherwise the three-character currency code is returned in upper case.
   *
   * ```typescript
   * import { en_US } from '@jadetree/currency/locales/en';
   *
   * en_US.currencySymbol('USD');             // returns '$'
   * en_US.currencySymbol(Currency('CAD'));   // returns 'CA$'
   * en_US.currencySymbol('CHF');             // returns 'CHF'
   * ```
   *
   * @param ccy `Currency` object or ISO 4217 currency code
   * @return localized symbol
   */
  currencySymbol(ccy: string | number | Currency): string | undefined {
    // Ensure we have a normalized Currency Code
    let ccyCode: string | undefined;
    if (ccy instanceof Currency) {
      ccyCode = ccy.currencyCode;
    } else {
      ccyCode = new Currency(ccy).currencyCode;
    }

    if (typeof ccyCode === 'undefined') {
      return ccyCode;
    }

    const ccySym = this.getDictField('cs', ccyCode);
    if (typeof ccySym === 'string') {
      return ccySym;
    }

    // Fallback is Upper-Case Currency Code
    return ccyCode;
  }

  /**
   * Look up the localized Currency Name
   *
   * If the locale provides a name for the currency, it is returned, otherwise
   * the three-character currency code is returned in upper case.
   *
   * ```typescript
   * import { en_US } from '@jadetree/currency/locales/en';
   * import { de_DE } from '@jadetree/currency/locales/de';
   *
   * en_US.currencyName('USD');  // returns 'US Dollar'
   * en_US.currencyName('CAD');  // returns 'Kanadischer Dollar'
   * ```
   *
   * @param ccy `Currency` object or ISO 4217 currency code
   * @return currency name
   */
  currencyName(ccy: string | number | Currency): string | undefined {
    // Ensure we have a normalized Currency Code
    let ccyCode: string | undefined;
    if (ccy instanceof Currency) {
      ccyCode = ccy.currencyCode;
    } else {
      ccyCode = new Currency(ccy).currencyCode;
    }

    if (typeof ccyCode === 'undefined') {
      return ccyCode;
    }

    const ccyName = this.getDictField('cn', ccyCode);
    if (typeof ccyName === 'string') {
      return ccyName;
    }

    // Fallback is Upper-Case Currency Code
    return ccyCode;
  }
}
