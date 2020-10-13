/**
 * Describe the major parts of a BCP 47 Locale Tag, used for parsing and
 * generating locale tags.
 */
interface LocaleTag {
  /** ISO 639 language code */
  language: string;

  /** ISO 3166-1 alpha-2 country code or UN M.49 region code */
  territory?: string;

  /** ISO 15924 script name */
  script?: string;

  /** IANA variant tag */
  variant?: string;
}

/**
 * Generate a BCP 47 Locale Tag from its parts, comprising language, territory,
 * script, and variant. The language part is required but the territory, script,
 * and variant parts may be omitted.
 *
 * @param parts locale tag parts
 * @param separator separator character (defaults to "_")
 * @return locale tag
 */
export function generateLocale(parts: LocaleTag, separator?: string): string;

/**
 * Parse a Locale Tag into its parts, including language, territory, script,
 * and variant. If a part does not appear in the tag, it will be omitted or
 * set to undefined in the result.
 *
 * @param identifier locale tag
 * @param separator separator character (defaults to "_")
 * @return locale tag parts
 */
export function parseLocale(identifier: string, separator?: string): LocaleTag;
