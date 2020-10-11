/**
 * @typedef {LocaleTag}
 */
interface LocaleTag {
  language: string;
  territory?: string | undefined;
  script?: string | undefined;
  variant?: string | undefined;
}

export function generateLocale(parts: LocaleTag, separator = '_'): string;
export function parseLocale(identifier: string, separator = '_'): LocaleTag;
