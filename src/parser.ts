import Decimal from 'decimal.js-light';

import { format } from './formatter';
import { Locale } from './locale';
import rootLocale from './locales/root';

/**
 * Parse Options
 * @param {Locale} locale locale to use for number symbols
 * @param {Boolean} strict controls whether numbers formatted in a weird way
 *                         are accepted or rejected
 */
export interface ParseOptions {
  locale?: Locale | undefined;
  strict?: boolean | undefined;
}

/**
 * Parse a String into a Numeric Decimal value
 * @param {String} value string to Parse
 * @param {ParseOptions} options parse options
 * @return {Decimal} parsed number
 *
 * Parses a string representation of a number into a numeric value, using the
 * number formatting rules of this locale (specifically decimal and grouping
 * symbols). When the given string cannot be parsed, an error is thrown.
 *
 * @example
 * // Returns Decimal(1099.98)
 * (new Locale('en_US')).parseNumber('1,099.98');
 * // Returns Decimal(1099.98)
 * (new Locale('de_DE')).parseNumber('1.099,98');
 * // Returns Decimal(12345.12)
 * (new Locale('ru')).parseNumber('12 345,12');
 *
 * When the given string cannot be parsed, an exception is raised:
 * @example
 * // Error('2,109,998 is not a properly formatted decimal number')
 *
 */
export function parse(
  value: string,
  options?: ParseOptions | undefined
): Decimal {
  let locale: Locale = rootLocale;
  let strict = false;

  let s = value;
  let parsedAlt = new Decimal(0);

  // Assign Options
  if (options && options.locale) {
    locale = options.locale;
  }

  if (options && options.strict) {
    strict = !!options.strict;
  }

  if (!locale.decimalPattern) {
    throw new Error(`Locale ${locale.tag} does not define a decimal pattern`);
  }

  if (!locale.decimal || !locale.group) {
    throw new Error(
      `Locale ${locale.tag} does not define a decimal or group symbol`
    );
  }

  // Cache Decimal and Group Symbols
  const d: string = locale.decimal;
  const g: string = locale.group;

  if (
    !strict &&
    (g === '\u00A0' || g === '\u202F') &&
    !s.includes(g) &&
    s.includes(' ')
  ) {
    // if the grouping symbol is U+00A0 NO-BREAK SPACE,
    // and the string to be parsed does not contain it
    // but instead contains a space
    // then it's reasonable to assume it is taking the place of the
    // grouping symbol
    s = s.split(' ').join(g);
  }

  // Try to parse as a normal number
  const parsed = new Decimal(s.split(g).join('').split(d).join('.'));

  // Check that the number can be re-formatted to original
  if (strict && s.includes(g)) {
    const proper = format(parsed, locale.decimalPattern, { locale });
    if (value !== proper && value.replace(/0*$/, '') !== proper + d) {
      try {
        parsedAlt = new Decimal(s.split(d).join('').split(g).join('.'));
      } catch (error) {
        if (error instanceof Error && /DecimalError/.test(error.message)) {
          throw new Error(
            `${value} is not a properly formatted decimal number. Did you mean ${proper}?`
          );
        }
      }

      const properAlt = format(parsedAlt, locale.decimalPattern, { locale });
      if (properAlt === proper) {
        throw new Error(
          `${value} is not a properly formatted decimal number. Did you mean ${proper}?`
        );
      } else {
        throw new Error(
          `${value} is not a properly formatted decimal number. Did you mean ${proper} or ${properAlt}?`
        );
      }
    }
  }

  // Return Parsed Number
  return parsed;
}
