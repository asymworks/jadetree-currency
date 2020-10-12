import Currency from './currency';
import { parseLocale } from './locale-utils';
import { NumberPattern, parsePattern } from './numpattern';

/**
 * @typedef {LocaleData}
 * @property {String} d Decimal Symbol
 * @property {String} g Grouping Symbol
 * @property {String} p Plus Sign
 * @property {String} m Minus Sign
 * @property {String} pc Percent Sign
 * @property {String} pm Permille Sign
 * @property {String} e Exponential Sign
 * @property {String} x Superscripting Exponent
 * @property {String} inf Inifinity Symbol
 * @property {String} nan Not-a-Number Symbol
 * @property {String} c Default Currency (ISO 4217 Code)
 * @property {Object} cs Currency Symbol Map
 * @property {Object} cn Currency Name Map
 * @property {String} np Decimal Number Pattern
 * @property {String} cp Currency Number Pattern
 * @property {String} ap Accounting Number Pattern
 * @property {String} pp Percentage Number Pattern
 * @property {String} sp Scientific Number Pattern
 */
export interface LocaleData {
  readonly d?: string;
  readonly g?: string;
  readonly p?: string;
  readonly m?: string;
  readonly pc?: string;
  readonly pm?: string;
  readonly e?: string;
  readonly x?: string;
  readonly inf?: string;
  readonly nan?: string;
  readonly c?: string;
  readonly cs?: { [key: string]: string };
  readonly cn?: { [key: string]: string };
  readonly np?: string;
  readonly cp?: string;
  readonly ap?: string;
  readonly pp?: string;
  readonly sp?: string;

  // Index Access
  readonly [index: string]: string | { [key: string]: string } | undefined;
}

// Shim for Object.hasOwnProperty
const hasOwnProperty = (o: unknown, k: string): boolean =>
  Object.prototype.hasOwnProperty.call(o, k);

// Private Method Function for Locale.getField
const getField = Symbol('getField');
const getDictField = Symbol('getDictField');

/**
 * Locale Class
 *
 * @property {String} tag Locale Tag
 * @property {String} language Locale Language
 * @property {String} territory Locale Territory
 * @property {String} script Locale Script
 * @property {String} variant Locale Variant
 *
 * @property {String} decimal Decimal Symbol
 * @property {String} group Grouping Symbol
 * @property {String} plusSign Plus Sign
 * @property {String} minusSign Minus Sign
 * @property {String} percentSign Percent Sign
 * @property {String} permilleSign Permille Sign
 * @property {String} exponential Exponential Sign
 * @property {String} superscriptingExponent Superscripting Exponent
 *
 * @property {String} inf Inifinity Symbol
 * @property {String} nan Not-a-Number Symbol
 * @property {Currency} currency Default Currency (ISO 4217 Code)
 *
 * @property {NumberPattern} decimalPattern Decimal Number Pattern
 * @property {NumberPattern} currencyPattern Currency Number Pattern
 * @property {NumberPattern} accountingPattern Accounting Number Pattern
 * @property {NumberPattern} percentagePattern Percentage Number Pattern
 * @property {NumberPattern} scientificPattern Scientific Number Pattern
 */
export class Locale {
  readonly tag: string;
  readonly language: string;
  readonly territory: string | undefined;
  readonly script: string | undefined;
  readonly variant: string | undefined;

  private readonly data: LocaleData;
  private readonly parent: Locale | undefined;

  readonly decimalPattern: NumberPattern | undefined;
  readonly currencyPattern: NumberPattern | undefined;
  readonly accountingPattern: NumberPattern | undefined;
  readonly percentagePattern: NumberPattern | undefined;
  readonly scientificPattern: NumberPattern | undefined;

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
    const np = this[getField]('np');
    if (np) {
      this.decimalPattern = parsePattern(np);
    }

    const cp = this[getField]('cp');
    if (cp) {
      this.currencyPattern = parsePattern(cp);
    }

    const ap = this[getField]('ap');
    if (ap) {
      this.accountingPattern = parsePattern(ap);
    }

    const pp = this[getField]('pp');
    if (pp) {
      this.percentagePattern = parsePattern(pp);
    }

    const sp = this[getField]('sp');
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

  /** @private Get Field from Data or Parent Language */
  [getField](key: string): string | undefined {
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

  /** @private Get a Dictionary Item from Data or Parent Language */
  [getDictField](dataKey: string, dictKey: string): string | undefined {
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
    return this[getField]('d');
  }

  /** Digit Grouping Symbol */
  get group(): string | undefined {
    return this[getField]('g');
  }

  /** Plus Sign */
  get plusSign(): string | undefined {
    return this[getField]('p');
  }

  /** Minus Sign */
  get minusSign(): string | undefined {
    return this[getField]('m');
  }

  /** Percent Sign */
  get percentSign(): string | undefined {
    return this[getField]('pc');
  }

  /** Permille Sign */
  get permilleSign(): string | undefined {
    return this[getField]('pm');
  }

  /** Exponential Sign */
  get exponential(): string | undefined {
    return this[getField]('e');
  }

  /** Superscripting Exponent */
  get superscriptingExponent(): string | undefined {
    return this[getField]('x');
  }

  /** Infinity String */
  get inf(): string | undefined {
    return this[getField]('inf');
  }

  /** Not-a-Number String */
  get nan(): string | undefined {
    return this[getField]('nan');
  }

  /** Default Currency */
  get currency(): Currency {
    const ccy = this[getField]('c');
    if (typeof ccy === 'undefined') {
      return new Currency('XXX');
    }
    return new Currency(ccy);
  }

  /**
   * Look up the localized Currency Symbol
   * @param {String|Currency} ccy Currency Object or ISO 4217 Currency Code
   * @return {String} Currency Symbol
   *
   * If the locale provides a symbol for the currency, it is returned,
   * otherwise the three-character currency code is returned in upper case.
   *
   * // Returns '$'
   * (new Locale('en_US')).currencySymbol('USD');
   *
   * // Returns 'CA$'
   * (new Locale('en_US')).currencySymbol(Currency('CAD'));
   *
   * // Returns 'CHF'
   * (new Locale('en_US')).currencySymbol('CHF');
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

    const ccySym = this[getDictField]('cs', ccyCode);
    if (typeof ccySym === 'string') {
      return ccySym;
    }

    // Fallback is Upper-Case Currency Code
    return ccyCode;
  }

  /**
   * Look up the localized Currency Name
   * @param {String|Currency} ccy Currency Object or ISO 4217 Currency Code
   * @param {Numeric} count Number of items (for pluralization)
   * @return {String} Currency Name
   *
   * If the locale provides a name for the currency, it is returned, otherwise
   * the three-character currency code is returned in upper case.
   *
   * // Returns 'US Dollar'
   * (new Locale('en_US')).currencySymbol('USD');
   *
   * // Returns 'Kanadischer Dollar'
   * (new Locale('de_DE')).currencySymbol(Currency('CAD'));
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

    const ccyName = this[getDictField]('cn', ccyCode);
    if (typeof ccyName === 'string') {
      return ccyName;
    }

    // Fallback is Upper-Case Currency Code
    return ccyCode;
  }
}
