// String Shims
const isalpha = (s) => !!s.match(/^[A-Za-z]+$/);
const isdigit = (s) => !!s.match(/^\d+$/);

module.exports = {
  /**
   * Generate a Locale Identifier from its parts
   * @param {Object} parts object with language, territory, script, and variant keys
   * @param {String} separator separator character (defaults to "_")
   * @return {String} locale identifier
   */
  generateLocale(parts, separator = '_') {
    const { language, territory, script, variant } = parts;

    if (!language) {
      throw new Error('"language" key must be provided');
    }

    return [language, script, territory, variant]
      .filter((x) => x)
      .join(separator);
  },

  /**
   * Parse a Locale Identifier into its parts
   * @param {String} identifier locale identifier
   * @param {String} separator separator character (defaults to "_")
   * @return {Object} object with language, territory, script, and variant keys
   */
  parseLocale(identifier, separator = '_') {
    let ident = identifier;
    let script;
    let territory;
    let variant;

    if (ident.includes('.')) {
      // this is probably the charset/encoding, which we don't care about
      [ident] = ident.split('.', 1);
    }

    if (ident.includes('@')) {
      // this is a locale modifier such as @euro, which we don't care about either
      [ident] = ident.split('@', 1);
    }

    const parts = ident.split(separator);
    const language = parts.shift()?.toLowerCase();

    if (!isalpha(language)) {
      throw new Error(`Invalid locale language "${language}"`);
    }

    if (parts.length > 0) {
      // Parse script to Title Case
      if (parts[0].length === 4 && isalpha(parts[0])) {
        script = parts.shift().toLowerCase();
        script = script[0].toUpperCase() + script.slice(1);
      }
    }

    if (parts.length > 0) {
      // Parse territory
      if (parts[0].length === 2 && isalpha(parts[0])) {
        territory = parts.shift().toUpperCase();
      } else if (parts[0].length === 3 && isdigit(parts[0])) {
        territory = parts.shift();
      }
    }

    if (parts.length > 0) {
      // Parse variant
      if (
        (parts[0].length === 4 && isdigit(parts[0][0])) ||
        (parts[0].length >= 5 && isalpha(parts[0][0]))
      ) {
        variant = parts.shift();
      }
    }

    if (parts.length > 0) {
      throw new Error(`Invalid locale identifier "${identifier}"`);
    }

    // eslint-disable-next-line no-alert, object-curly-newline
    return { language, territory, script, variant };
  },
};
