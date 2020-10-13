import Decimal from 'decimal.js-light';

import { Currency } from './currency';
import { Locale } from './locale';
import rootLocale from './locales/root';
import { parsePattern, NumberPattern, PrecisionLimits } from './numpattern';

/**
 * Return the scaling factor to apply to the number before rendering.
 *
 * Auto-set to a factor of 2 or 3 if presence of a "%" or "‰" sign is
 * detected in the prefix or suffix of the pattern. Default is to not mess
 * with the scale at all and keep it to 0.
 *
 * @private
 */
function computeScale(pattern: NumberPattern): number {
  const { pPrefix, nPrefix, pSuffix, nSuffix } = pattern;
  const fixes = `${pPrefix}${pSuffix}${nPrefix}${nSuffix}`;
  if (fixes.includes('%')) {
    return 2;
  }
  if (fixes.includes('‰')) {
    return 3;
  }
  return 0;
}

/**
 * Holds the results of conversion to scientific notation.  For example 0.00023
 * might get converted into
 * ```typescript
 * {
 *   value: new Decimal('2.3'),
 *   exp: -4,
 *   expSign: '-',
 * }
 * ```
 * @private
 */
interface ScientificParts {
  /** Scaled Value */
  value: Decimal;

  /** Exponential Power */
  exp: number;

  /** Exponential Sign */
  expSign: string;
}

/**
 * Returns normalized scientific notation components of a value.
 * @private
 */
function scientificNotationElements(
  pattern: NumberPattern,
  value: Decimal,
  locale: Locale
): ScientificParts {
  // Adjust Value to have exactly one leading digit
  let exp = value.exponent();
  let svalue = value.times(new Decimal(10).pow(-exp));
  if (svalue.exponent() !== 0) {
    /* istanbul ignore next */
    throw new Error('Assertion Failed: svalue.exponent() != 0');
  }

  /*
   * Shift Exponent and Value by minimum number of digits required by the
   * rendering pattern (at least 1).
   */
  const leadShift = Math.max(1, pattern.intPrec.min) - 1;
  exp -= leadShift;
  svalue = svalue.times(new Decimal(10).pow(leadShift));

  // Get Exponent Sign Symbol
  let expSign = '';
  if (exp < 0) {
    expSign = locale.minusSign || '-';
  } else if (pattern.expPlus) {
    expSign = locale.plusSign || '+';
  }

  // Normalize Exponent Sign
  exp = Math.abs(exp);

  // Return Elements
  return { value: svalue, exp, expSign };
}

/**
 * Format the integer part of a number by adding grouping symbols
 * @param pattern parsed number pattern
 * @param value ungrouped number string
 * @param min minimum number of characters
 * @param max maximum number of characters
 * @param locale locale to use for grouping symbol
 * @return formatted number string
 * @private
 */
function formatInt(
  pattern: NumberPattern,
  value: string,
  min: number,
  max: number,
  locale: Locale
): string {
  let svalue = value;
  const width = value.length;
  const symbol = locale.group;
  let gsize = pattern.grouping.primary;
  let returnValue = '';

  if (width < min) {
    svalue = '0'.repeat(min - width) + svalue;
  }

  while (svalue.length > gsize) {
    returnValue = symbol + svalue.slice(svalue.length - gsize) + returnValue;
    svalue = svalue.slice(0, svalue.length - gsize);
    gsize = pattern.grouping.secondary;
  }

  return svalue + returnValue;
}

/**
 * Zero-pad the right side of the string to meet the minumum number of
 * digits specified in the precision.  Extra trailing zeros are removed,
 * but the string is otherwise not truncated.  The decimal symbol is added
 * to the returned string.
 *
 * @param pattern parsed number pattern
 * @param value ungrouped number string
 * @param locale locale to use for decimal symbol
 * @param force_prec override pattern-derived precision limits
 * @return formatted number string
 * @private
 */
function formatFrac(
  pattern: NumberPattern,
  value: string,
  locale: Locale,
  forceFrac?: PrecisionLimits | undefined
): string {
  let svalue = value;
  const { min, max } = forceFrac || pattern.fracPrec;
  /* istanbul ignore if
   * this seems to not get called due to quantizeValue pre-formatting the
   * value to the maximum allowed fractional precision
   */
  if (svalue.length < min) {
    svalue += '0'.repeat(min - svalue.length);
  }
  if (max === 0 || (min === 0 && Number.parseInt(svalue, 10) === 0)) {
    return '';
  }
  while (svalue.length > min && svalue.charAt(svalue.length - 1) === '0') {
    svalue = svalue.slice(0, -1);
  }
  return locale.decimal + svalue;
}

/**
 * Format a number with a given number of significant digits.
 *
 * Conceptually, the implementation of this method can be summarized in the
 * following steps:
 *
 *   - Move or shift the decimal point (i.e. the exponent) so the maximum
 *     amount of significant digits fall into the integer part (i.e. to the
 *     left of the decimal point)
 *
 *   - Round the number to the nearest integer, discarding all the fractional
 *     part which contained extra digits to be eliminated
 *
 *   - Convert the rounded integer to a string, that will contain the final
 *     sequence of significant digits already trimmed to the maximum
 *
 *   - Restore the original position of the decimal point, potentially
 *     padding with zeroes on either side
 *
 * @param value number to format
 * @param min minimum number of significant digits
 * @param max maximum number of significant digits
 * @return formatted number string
 * @private
 */
function formatSignificant(value: Decimal, min: number, max: number): string {
  const exp = value.exponent();
  const scale = max - 1 - exp;
  const digits = String(
    value.times(new Decimal(10).pow(scale)).toDecimalPlaces(0)
  );
  let result;

  if (scale <= 0) {
    // Initial value had too much precision; pad with zeros to get to
    // original number of integer digits.
    result = digits + '0'.repeat(-scale);
  } else {
    // Initial value did not have enough digits, so pad the fractional part
    // with zeros to achieve the correct number of significant digits.
    const intpart = digits.slice(0, digits.length - scale);
    const i = intpart.length;
    const j = i + Math.max(min - 1, 0);
    result = [
      intpart || '0',
      '.',
      '0'.repeat(-Math.min(exp + 1, 0)),
      digits.slice(i, j),
      digits.slice(j).replace(/0*$/g, ''),
    ]
      .join('')
      .replace(/\.*$/g, '');
  }

  return result;
}

/**
 * This function handles the main legwork of formatting the number part of the
 * pattern into a string which has the correct minimum precision on both
 * integer and fractional parts, with the localized decimal and grouping
 * symbols.
 *
 * @param pattern parsed number pattern
 * @param value value to quantize
 * @param locale locale to use for grouping and decimal symbols
 * @param force_prec override pattern-derived precision limits
 * @private
 */
function quantizeValue(
  pattern: NumberPattern,
  value: Decimal,
  locale: Locale,
  fracPrec: PrecisionLimits
): string {
  const [int, frac] = value.toFixed(fracPrec.max).split('.', 2);
  const intPart = formatInt(
    pattern,
    int,
    pattern.intPrec.min,
    pattern.intPrec.max,
    locale
  );
  const fracPart = formatFrac(pattern, frac || '', locale, fracPrec);
  return intPart + fracPart;
}

/**
 * Format Options
 */
export interface FormatOptions {
  /** Locale to use for numeric formatting symbols */
  locale?: Locale;

  /** Currency, if any, to provide to the formatting pattern */
  currency?: Currency | string;

  /**
   * Whether or not to use the currency's precision.  If set to `false`, the
   * pattern's precision is used.  This defaults to `true` if not provided in
   * the `options` parameter to `format()`.
   */
  currencyDigits?: boolean;

  /**
   * Whether decimal numbers should be forcibly quantized to produce a formatted
   * output strictly matching the CLDR definition for the locale. If set to
   * `false`, the returned fractional part string may exceed the allowed length
   * of the number pattern. This defaults to `true` if not provided in the
   * `options` parameter to `format()`.
   */
  quantize?: boolean;
}

/**
 * Format a Number with a {@link NumberPattern}
 *
 * @param value numeric value to format. If this is not a Decimal object, it
 *  will be cast to one.
 * @param pattern parsed number pattern
 * @param options formatting options
 * @return formatted numeric string
 */
export function format(
  value: Decimal | number | string,
  pattern: NumberPattern | string,
  options?: FormatOptions | undefined
): string {
  let locale: Locale = rootLocale;
  let currency: Currency | undefined;
  let currencyDigits = true;
  let quantize = true;

  let dval: Decimal;
  let exp = 0;
  let expSign = '';
  let fracPrec: PrecisionLimits;
  let numberString: string;
  let returnValue: string;

  // Parse the Number Pattern if needed
  let patt: NumberPattern;
  if (typeof pattern === 'string') {
    patt = parsePattern(pattern);
  } else {
    patt = pattern;
  }

  // Default Fractional Precision
  fracPrec = patt.fracPrec;

  // Assign Options
  if (options && options.locale) {
    locale = options.locale;
  }

  if (options && options.currency) {
    currency = new Currency(options.currency);
    if (typeof options.currencyDigits !== 'undefined') {
      currencyDigits = !!options.currencyDigits;
    }
  }

  if (options && options.quantize) {
    quantize = !!options.quantize;
  }

  // Ensure we are working with a Decimal object
  if (value instanceof Decimal) {
    dval = value;
  } else if (typeof value === 'number') {
    dval = new Decimal(value);
  } else {
    dval = new Decimal(String(value));
  }

  // Force Scaling if required
  dval = dval.times(new Decimal(10).pow(computeScale(patt)));

  // Separate the Sign and Absolute Value
  const isNegative = dval.isNegative() ? 1 : 0;
  dval = dval.abs();

  // Prepare Scientific Notation Metadata
  if (patt.expPrec) {
    ({ value: dval, exp, expSign } = scientificNotationElements(
      patt,
      dval,
      locale
    ));
  }

  // Force fractional precision based on currency defaults
  if (currency && currencyDigits) {
    fracPrec = {
      min: currency.precision || 0,
      max: currency.precision || 0,
    };
  }

  // Bump decimal precision to the natural precision of the number if it
  // exceeds the one we're about to use. This adaptative precision is only
  // triggered if the decimal quantization is disabled or if a scientific
  // notation pattern has a missing mandatory fractional part (as in the
  // default '#E0' pattern). This special case has been extensively
  // discussed at https://github.com/python-babel/babel/pull/494#issuecomment-307649969 .
  if (!quantize || (patt.expPrec && fracPrec.min === 0 && fracPrec.max === 0)) {
    fracPrec = {
      min: fracPrec.min,
      max: Math.max(fracPrec.max, dval.dp()),
    };
  }

  // Render Scientific Notation
  if (patt.expPrec) {
    numberString = [
      quantizeValue(patt, dval, locale, fracPrec),
      locale.exponential,
      expSign,
      formatInt(patt, String(exp), patt.expPrec.min, patt.expPrec.max, locale),
    ].join('');
  }

  // Render a Significant Digits Pattern
  else if (patt.pattern.includes('@')) {
    const text = formatSignificant(dval, patt.intPrec.min, patt.intPrec.max);
    const [int, frac] = text.split('.', 2);
    numberString = formatInt(patt, int, 0, 1000, locale);
    if (frac) {
      numberString += locale.decimal + frac;
    }
  }

  // Normal Number Pattern
  else {
    numberString = quantizeValue(patt, dval, locale, fracPrec);
  }

  // Apply Prefix and Suffix
  returnValue = [
    isNegative ? patt.nPrefix : patt.pPrefix,
    numberString,
    isNegative ? patt.nSuffix : patt.pSuffix,
  ].join('');

  // Apply Currency Symbol
  if (returnValue.includes('¤')) {
    const ccyCode: string = currency?.currencyCode || 'XXX';
    returnValue = returnValue.replace(
      '¤¤¤',
      locale.currencyName(ccyCode) || ccyCode
    );
    returnValue = returnValue.replace('¤¤', ccyCode);
    returnValue = returnValue.replace(
      '¤',
      locale.currencySymbol(ccyCode) || ccyCode
    );
  }

  // Return Formatted Value
  return returnValue;
}
