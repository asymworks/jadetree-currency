import Decimal from 'decimal.js-light';
import { NumberPattern } from './numpattern';

/**
 * Format a Number with a set number of Significant Digits
 * @param {Decimal} value Number to Format
 * @param {Number} min Minimum Number of Significant Digits
 * @param {Number} max Maximum Number of Significant Digits
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
 * Return the scaling factor to apply to the number before rendering.
 *
 * Auto-set to a factor of 2 or 3 if presence of a "%" or "‰" sign is
 * detected in the prefix or suffix of the pattern. Default is to not mess
 * with the scale at all and keep it to 0.
 *
 * @param {NumberPattern} pattern parsed number pattern
 * @return {Number} scaling factor (in log10, so a value of 2 means scale by 100)
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
