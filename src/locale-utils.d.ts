/**
 * @typedef {LocaleTag}
 */
interface LocaleTag {
  language: string;
  territory?: string | undefined;
  script?: string | undefined;
  variant?: string | undefined;
}

export function generateLocale(parts: LocaleTag, separator?: string): string;
export function parseLocale(identifier: string, separator?: string): LocaleTag;
