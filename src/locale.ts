import Currency from './currency';
import { NumberPattern, parsePattern } from './numpattern';

// String Shims
const isalpha = (s: string) => !!s.match(/^[A-Za-z]+$/);
const isdigit = (s: string) => !!s.match(/^\d+$/);

/**
 * @typedef {LocaleTag}
 */
interface LocaleTag {
  language: string;
  territory: string | undefined;
  script: string | undefined;
  variant: string | undefined;
}

/**
 * Parse a Locale Identifier into its parts
 * @param {String} identifier locale identifier
 * @param {String} separator separator character (defaults to "_")
 * @return {Object} object with language, territory, script, and variant keys
 */
export function parseLocale(identifier: string, separator = '_'): LocaleTag {
  let ident = identifier;
  let script;
  let territory;
  let variant;

  if (ident.includes('.')) {
    // this is probably the charset/encoding, which we don't care about
    [ident] = ident.split('.', 1);
  }

  if (ident.includes('@')) {
    // this is a locale modifier such as @euro, which we don't care about either
    [ident] = ident.split('@', 1);
  }

  const parts = ident.split(separator);
  const language = parts.shift()?.toLowerCase();

  if (!isalpha(language)) {
    throw new Error(`Invalid locale language "${language}"`);
  }

  if (parts.length > 0) {
    // Parse script to Title Case
    if (parts[0].length === 4 && isalpha(parts[0])) {
      script = parts.shift().toLowerCase();
      script = script[0].toUpperCase() + script.slice(1);
    }
  }

  if (parts.length > 0) {
    // Parse territory
    if (parts[0].length === 2 && isalpha(parts[0])) {
      territory = parts.shift().toUpperCase();
    } else if (parts[0].length === 3 && isdigit(parts[0])) {
      territory = parts.shift();
    }
  }

  if (parts.length > 0) {
    // Parse variant
    if (
      (parts[0].length === 4 && isdigit(parts[0][0])) ||
      (parts[0].length >= 5 && isalpha(parts[0][0]))
    ) {
      variant = parts.shift();
    }
  }

  if (parts.length > 0) {
    throw new Error(`Invalid locale identifier "${identifier}"`);
  }

  // eslint-disable-next-line no-alert, object-curly-newline
  return { language, territory, script, variant };
}

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
}

// Shim for Object.hasOwnProperty
const hasOwnProperty = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

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
 */
export class Locale {
  readonly tag: string;
  readonly language: string;
  readonly territory: string | undefined;
  readonly script: string | undefined;
  readonly variant: string | undefined;

  private readonly data: LocaleData;
  private readonly parent: Locale | undefined;
  private readonly np: NumberFormat | undefined;
  private readonly cp: NumberFormat | undefined;
  private readonly ap: NumberFormat | undefined;

  constructor(
    tag: string,
    data: LocaleData,
    parent: Locale | undefined = undefined
  ) {
    const { language, territory, script, variant } = parseLocale(tag);
    this.tag = tag;
    this.language = language;
    this.territory = territory;
    this.script = script;
    this.variant = variant;

    // Language-only Locales may not have a parent
    if (!territory && !script && !variant && !!parent) {
      throw new Error(`Language-only Locale ${tag} may not have a parent`);
    }

    // Parent must share language
    if (parent) {
      if (parent.language !== this.language) {
        throw new Error(
          `Locale ${tag} must have a parent with language ${language}`
        );
      }
      this.parent = parent;
    }

    // Load Data and Patterns
    this.data = data;
    if (this.data.np) {
      this.np = parsePattern(this.data.np);
    }
    if (this.data.cp) {
      this.cp = parsePattern(this.data.cp);
    }
    if (this.data.ap) {
      this.ap = parsePattern(this.data.ap);
    }

    // Freeze Objects
    Object.freeze(this.data);
    Object.freeze(this.np);
    Object.freeze(this.cp);
    Object.freeze(this.ap);
    Object.freeze(this);
  }

  /** @private Get Field from Data or Parent Language */
  [getField](key: string): string | undefined {
    if (hasOwnProperty(this.data, key)) {
      return this.data[key];
    }

    if (this.parent !== null && hasOwnProperty(this.parent, key)) {
      return this.parent[key];
    }

    // eslint-disable-next-line unicorn/no-useless-undefined
    return undefined;
  }

  /** @private Get a Dictionary Item from Data or Parent Language */
  [getDictField](dataKey: string, dictKey: string): string | undefined {
    if (hasOwnProperty(this.data, dataKey)) {
      if (hasOwnProperty(this.data[dataKey], dictKey)) {
        return this.data[dataKey][dictKey];
      }
    }

    if (this.parent !== null && hasOwnProperty(this.parent, dataKey)) {
      if (hasOwnProperty(this.parent[dataKey], dictKey)) {
        return this.parent[dataKey][dictKey];
      }
    }

    // eslint-disable-next-line unicorn/no-useless-undefined
    return undefined;
  }

  /** Decimal Point Symbol */
  get decimal(): string {
    return this[getField]('d');
  }

  /** Digit Grouping Symbol */
  get group(): string {
    return this[getField]('g');
  }

  /** Plus Sign */
  get plusSign(): string {
    return this[getField]('p');
  }

  /** Minus Sign */
  get minusSign(): string {
    return this[getField]('m');
  }

  /** Percent Sign */
  get percentSign(): string {
    return this[getField]('pc');
  }

  /** Permille Sign */
  get permilleSign(): string {
    return this[getField]('pm');
  }

  /** Exponential Sign */
  get exponential(): string {
    return this[getField]('e');
  }

  /** Superscripting Exponent */
  get superscriptingExponent(): string {
    return this[getField]('x');
  }

  /** Infinity String */
  get inf(): string {
    return this[getField]('inf');
  }

  /** Not-a-Number String */
  get nan(): string {
    return this[getField]('nan');
  }

  /** Default Currency */
  get currency(): Currency {
    const ccy: string = this[getField]('c');
    if (ccy === null) {
      return Currency('XXX');
    }
    return Currency(ccy);
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
  currencySymbol(ccy: string | CurrencyData): string {
    let ccyObject = ccy;

    // Ensure we have a normalized Currency Code
    if (!(ccy instanceof Currency)) {
      ccyObject = Currency(ccy);
    }
    const ccyCode = ccyObject.currencyCode;
    const ccySym = this[getDictField]('cs', ccyCode);

    return ccySym || ccyCode;
  }

  /**
   * Look up the localized Currency Name
   * @param {String|CurrencyData} ccy Currency Object or ISO 4217 Currency Code
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
  currencyName(ccy: string | CurrencyData): string {
    // TODO: Add Pluralization

    let ccyObject = ccy;

    // Ensure we have a normalized Currency Code
    if (!(ccy instanceof Currency)) {
      ccyObject = Currency(ccy);
    }
    const ccyCode = ccyObject.currencyCode;
    const ccyName = this[getDictField]('cn', ccyCode);

    return ccyName || ccyCode;
  }
}
