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

/**
 * Find the best match between available and requested locale strings.
 *
 * ```ts
 * // returns 'de_DE'
 * negotiate_locale(['de_DE', 'en_US'], ['de_DE', 'de_AT'])}
 *
 * // returns 'de'
 * negotiate_locale(['de_DE', 'en_US'], ['en', 'de'])}
 * ```
 *
 * Case is ignored by the algorithm, the result uses the case of the preferred
 * locale identifier:
 * ```ts
 * // returns 'de_DE'
 * negotiate_locale(['de_DE', 'en_US'], ['de_de', 'de_at'])
 * ```
 *
 * By default, some web browsers unfortunately do not include the territory
 * in the locale identifier for many locales, and some don't even allow the
 * user to easily add the territory. So while you may prefer using qualified
 * locale identifiers in your web-application, they would not normally match
 * the language-only locale sent by such browsers. To workaround that, this
 * function uses a default mapping of commonly used langauge-only locale
 * identifiers to identifiers including the territory:
 * ```ts
 * // returns 'ja_JP'
 * negotiate_locale(['ja', 'en_US'], ['ja_JP', 'en_US'])
 * ```
 *
 * Some browsers even use an incorrect or outdated language code, such as "no"
 * for Norwegian, where the correct locale identifier would actually be "nb_NO"
 * (Bokmål) or "nn_NO" (Nynorsk). The aliases are intended to take care of
 * such cases, too:
 * ```ts
 * // returns 'nb_NO'
 * negotiate_locale(['no', 'sv'], ['nb_NO', 'sv_SE'])
 * ```
 *
 * You can override this default mapping by passing a different `aliases`
 * dictionary to this function, or you can bypass the behavior althogher by
 * setting the `aliases` parameter to `null`.
 *
 * @param preferred the list of locale strings preferred by the user
 * @param available the list of locale strings available
 * @param sep character that separates the different parts of the locale strings
 * @param aliases a dictionary of aliases for locale identifiers
 */
export function negotiateLocale(
  preferred: string[],
  available: string[],
  separator?: string,
  aliases?: { [key: string]: string }
): string | undefined;
