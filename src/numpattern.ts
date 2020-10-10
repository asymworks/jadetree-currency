/**
 * Splits a string into a list, starting from the right.
 * @param  {String} string String to Split
 * @param  {String} separator Optional. Specifies the character, or the regular
 *                      expression, to use for splitting the string. If
 *                      omitted, the entire string will be returned (an array
 *                      with only one item)
 * @param  {Number} maxsplit Optional. An integer that specifies the number of
 *                           splits, items after the split limit will not be
 *                           included in the array
 * @return {Array}
 */
export function rsplit(
  string: string,
  separator: string,
  maxsplit: number
): string[] {
  const split = string.split(separator);
  return maxsplit
    ? [split.slice(0, -maxsplit).join(separator)].concat(split.slice(-maxsplit))
    : split;
}

/**
 * @constant Unicode CLDR Number Pattern Regular Expression
 * @type {NumberFormatRegEx}
 */
const RE_NUMBER_FORMAT = /(?<prefix>(?:'[^']*'|[^\d#,.@])*)(?<number>[\d#+,.@E]*)(?<suffix>.*)/;

/**
 * @typedef {PatternParts}
 * @type {object}
 * @property {String} prefix Number Prefix String
 * @property {String} number Number Pattern
 * @property {String} suffix Number Suffix String
 */
export interface PatternParts {
  number: string;
  prefix: string;
  suffix: string;
}

/**
 * Match a Unicode CLDR Number Format Pattern
 * @param  {String} pattern Unicode CLDR Number Pattern
 * @return {PatternParts} Pattern Parts
 *
 * Each Unicode CLDR Number Format is expected to be formatted as an optional
 * prefix string, the number format itself, and an optional suffix string.
 */
export function matchNumber(pattern: string): PatternParts {
  const rv = pattern.match(RE_NUMBER_FORMAT);
  if (!rv || !rv.groups || !rv.groups.number) {
    /* istanbul ignore next
        invalid patterns get turned into prefixes in parsePattern
     */
    throw new Error(`Invalid number pattern '${pattern}'`);
  }

  return {
    number: rv.groups.number,
    prefix: rv.groups.prefix,
    suffix: rv.groups.suffix,
  };
}

/**
 * @typedef {PrecisionLimits}
 * @type {object}
 * @property {Number} min Minimum Allowed Digits
 * @property {Number} max Maximum Allowed Digits
 */
export interface PrecisionLimits {
  min: number;
  max: number;
}

/**
 * Calculate the Minimum and Maximum Allowed Digits in a Number
 * @param  {String} pattern Number Format String
 * @return {PrecisionLimits} Calculated Precision Limits
 */
export function parsePrecision(pattern: string): PrecisionLimits {
  let min = 0;
  let max = 0;

  // Iterator equivalent of if c not in '@0#,' then break
  const width = pattern.search(/[^#,0@]/);
  pattern
    .slice(0, width === -1 ? undefined : width)
    .split('')
    .forEach((c) => {
      if (c === '@' || c === '0') {
        min += 1;
        max += 1;
      } else if (c === '#') {
        max += 1;
      }
      /* skip commas */
    });

  return { min, max };
}

/**
 * @typedef {GroupingSizes}
 * @type {object}
 * @property {Number} primary Number of Digits in Primary Groups
 * @property {Number} secondary Number of Digits in each Secondary Group
 */
export interface GroupingSizes {
  primary: number;
  secondary: number;
}

/**
 * Calculate Primary and Secondary Grouping Lengths
 * @param  {String} pattern Number Format String
 * @return {GroupingSizes} Calculated Grouping Sizes
 *
 * @example <caption>Default or Invalid Grouping</caption>
 * // returns { primary: 1000, secondary: 1000 }
 * parseGrouping('##')
 * @example <caption>Thousands-based Grouping</caption>
 * // returns { primary: 3, secondary: 3 }
 * parseGrouping('#,##0')
 * @example <caption>Indian Vedic Grouping</caption>
 * // returns { primary: 2, secondary: 2 }
 * parseGrouping('#,##,##0')
 */
export function parseGrouping(pattern: string): GroupingSizes {
  const width = pattern.length;
  let g1 = pattern.lastIndexOf(',');
  let g2;
  if (g1 === -1) {
    // Default is no grouping (1000 digits)
    return { primary: 1000, secondary: 1000 };
  }

  g1 = width - g1 - 1;
  g2 = pattern.slice(0, width - g1 - 1).lastIndexOf(',');
  if (g2 === -1) {
    // No Secondary Grouping
    return { primary: g1, secondary: g1 };
  }

  g2 = width - g1 - g2 - 2;
  return { primary: g1, secondary: g2 };
}

/**
 * @typedef {NumberPattern}
 * @type {object}
 * @property {String} pattern Number Pattern which was Parsed
 * @property {String} pPrefix Positive Number Prefix String
 * @property {String} pSuffix Positive Number Suffix String
 * @property {String} nPrefix Negative Number Prefix String
 * @property {String} nSuffix Negative Number Suffix String
 * @property {GroupingSizes} grouping Number Grouping Sizes
 * @property {PrecisionLimits} iPrec Integer Part Precision Limits
 * @property {PrecisionLimits} fPrec Fractional Part Precision Limits
 * @property {PrecisionLimits} ePrec Exponent Part Precision Limits
 * @property {Boolean} ePlus Exponent Part requires a Plus Sign
 */
export interface NumberPattern {
  pattern: string;
  pPrefix: string;
  pSuffix: string;
  nPrefix: string;
  nSuffix: string;
  grouping: GroupingSizes;
  intPrec: PrecisionLimits;
  fracPrec: PrecisionLimits;
  expPrec: PrecisionLimits | undefined;
  expPlus: boolean;
}

/**
 * Parse a Unicode CLDR Number or Currency Format String
 * @param  {String} pattern Number Pattern String
 * @return {NumberPattern}
 *
 * Parses a Unicode CLDR Number Format string into its component parts
 */
export function parsePattern(pattern: string): NumberPattern {
  // Parser Results
  let pPrefix: string;
  let pSuffix: string;
  let nPrefix: string;
  let nSuffix: string;

  let expPrec: PrecisionLimits | undefined;
  let expPlus: boolean;

  // Internal Variables
  let number: string;
  let integer: string;
  let fraction: string;
  let exp: string;

  // Parse Positive (and possibly Negative) Patterns
  if (pattern.includes(';')) {
    const [pPattern, nPattern] = pattern.split(';', 2);
    ({ prefix: pPrefix, number, suffix: pSuffix } = matchNumber(pPattern));
    ({ prefix: nPrefix, suffix: nSuffix } = matchNumber(nPattern));
  } else {
    ({ prefix: pPrefix, number, suffix: pSuffix } = matchNumber(pattern));
    nPrefix = `-${pPrefix}`;
    nSuffix = pSuffix;
  }

  // Parse Exponent
  if (number.includes('E')) {
    [number, exp] = number.split('E', 2);
  } else {
    exp = '';
  }

  // Parse Integer and Decimal Part
  if (number.includes('@')) {
    if (number.includes('.') || number.includes('0')) {
      throw new Error('Significant digit patterns may not contain "." or "0"');
    }
  }

  if (number.includes('.')) {
    [integer, fraction] = rsplit(number, '.', 1);
  } else {
    integer = number;
    fraction = '';
  }

  // Parse Precisions
  const intPrec: PrecisionLimits = parsePrecision(integer);
  const fracPrec: PrecisionLimits = parsePrecision(fraction);

  if (exp) {
    expPlus = false;
    if (exp[0] === '+') {
      expPlus = true;
      exp = exp.slice(1);
    }

    expPrec = parsePrecision(exp);
  } else {
    expPlus = false;
    expPrec = undefined;
  }

  // Parse Groupings
  const grouping = parseGrouping(integer);

  // Return NumberPattern
  return {
    pattern,
    pPrefix,
    pSuffix,
    nPrefix,
    nSuffix,
    grouping,
    intPrec,
    fracPrec,
    expPrec,
    expPlus,
  };
}
