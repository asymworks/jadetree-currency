/** @internal */
function rsplit(string: string, separator: string, maxsplit: number): string[] {
  const split = string.split(separator);
  return maxsplit
    ? [split.slice(0, -maxsplit).join(separator)].concat(split.slice(-maxsplit))
    : split;
}

/** @internal */
const RE_NUMBER_FORMAT = /(?<prefix>(?:'[^']*'|[^\d#,.@])*)(?<number>[\d#+,.@E]*)(?<suffix>.*)/;

/**
 * Top level parsed elements of a Unicode Number Pattern
 */
export interface PatternParts {
  /** Pattern Number Format */
  number: string;

  /** Pattern Prefix */
  prefix: string;

  /** Pattern Suffix */
  suffix: string;
}

/**
 * Match a Unicode CLDR Number Format Pattern
 *
 * Each Unicode CLDR Number Format is expected to be formatted as an optional
 * prefix string, the number format itself, and an optional suffix string.
 *
 * @param pattern Unicode CLDR Number Pattern
 * @return Pattern Parts
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
 * Precision limits for a number primitive in a number pattern
 */
export interface PrecisionLimits {
  /** Minimum allowed digits in the primitive string */
  min: number;

  /** Maximum allowed digits in the primitive string */
  max: number;
}

/**
 * Calculate the Minimum and Maximum Allowed Digits in a Number
 *
 * @param pattern Number Format String
 * @return Calculated Precision Limits
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
 * Grouping sizes for a number pattern
 */
export interface GroupingSizes {
  /** Number of digits in the primary (first) group */
  primary: number;

  /** Number of digits in the secondary groups */
  secondary: number;
}

/**
 * Calculate Primary and Secondary Grouping Lengths. Invalid grouping patterns
 * will result in a "near-infinite" grouping length of 1000 characters, which
 * means no grouping symbols will be inserted.
 *
 * ```typescript
 * parseGrouping('##');       // Invalid: returns { primary: 1000, secondary: 1000 }
 * parseGrouping('#,##0');    // returns { primary: 3, secondary: 3 }
 * parseGrouping('#,##,##0'); // returns { primary: 3, secondary: 2}
 * ```
 *
 * @param pattern Number Format String
 * @return Calculated Grouping Sizes
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
 * Holds the parsed parts of a Unicode number pattern
 */
export interface NumberPattern {
  /** Number Pattern which was Parsed */
  pattern: string;

  /** Positive Number Prefix String */
  pPrefix: string;

  /** Positive Number Suffix String */
  pSuffix: string;

  /** Negative Number Prefix String */
  nPrefix: string;

  /** Negative Number Suffix String */
  nSuffix: string;

  /** Number Grouping Sizes */
  grouping: GroupingSizes;

  /** Integer Part Precision Limits */
  intPrec: PrecisionLimits;

  /** Fractional Part Precision Limits */
  fracPrec: PrecisionLimits;

  /** Exponential Part Precision Limits */
  expPrec: PrecisionLimits | undefined;

  /** Exponent Part requires a Plus Sign */
  expPlus: boolean;
}

/**
 * Parse a Unicode CLDR Number or Currency Format String
 * @param pattern Number Pattern string
 * @return parse results
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
