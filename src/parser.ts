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
  /** locale to use for number symbols */
  locale?: Locale;

  /**
   * controls whether numbers formatted in a weird way are accepted or rejected
   */
  strict?: boolean;
}

/**
 * Parses a string representation of a number into a numeric value, using the
 * number formatting rules of this locale (specifically decimal and grouping
 * symbols). When the given string cannot be parsed, an error is thrown.
 *
 * Examples:
 * ```typescript
 * import { de } from '@jadetree/currency/locales/de';
 * import { en } from '@jadetree/currency/locales/en';
 * import { ru } from '@jadetree/currency/locales/ru';
 *
 * parse('1,099.98', { locale: en });   // returns Decimal(1099.98)
 * parse('1.099,98', { locale: de });   // returns Decimal(1099.98)
 * parse('12 345,12', { locale: ru });  // returns Decimal(12345.12)
 *
 * // Invalid numbers will raise an error
 *
 * parse('2,109,998', { locale: de });
 * // Error('2,109,998 is not a properly formatted decimal number')
 * ```
 *
 * @param value string to parse
 * @param options parse options
 * @return parsed number
 */
export function parse(
  value: string,
  options?: ParseOptions | undefined
): Decimal {
  let locale: Locale = rootLocale;
  let strict = false;

  let s = value;
  let parsed = new Decimal(0);
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

  // Try to parse as a POSIX number
  try {
    parsed = new Decimal(s.trim().split(g).join('').split(d).join('.'));
  } catch {
    throw new Error(`${value} is not a properly formatted decimal number.`);
  }

  // Check that the number can be re-formatted to original
  if (strict && s.includes(g)) {
    const proper = format(parsed, locale.decimalPattern, { locale });
    if (value !== proper && value.replace(/0*$/, '') !== proper + d) {
      try {
        parsedAlt = new Decimal(s.trim().split(d).join('').split(g).join('.'));
      } catch (error: unknown) {
        if (
          error instanceof Error &&
          error.message &&
          /DecimalError/.test(error.message)
        ) {
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
