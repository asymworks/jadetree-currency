/* eslint-disable-next-line @typescript-eslint/no-var-requires */
const localeAliases = require('./locale-aliases');

// String Shims
const isalpha = (s) => !!s.match(/^[A-Za-z]+$/);
const isdigit = (s) => !!s.match(/^\d+$/);

module.exports = {
  generateLocale(parts, separator = '_') {
    const { language, territory, script, variant } = parts;

    if (!language) {
      throw new Error('"language" key must be provided');
    }

    return [language, script, territory, variant]
      .filter((x) => x)
      .join(separator);
  },
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
    const language = parts.shift().toLowerCase();

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
  negotiateLocale(
    preferred,
    available,
    separator = '_',
    aliases = localeAliases
  ) {
    /* eslint-disable-next-line unicorn/prefer-set-has */
    const avail = available.map((s) => s.toLowerCase());
    /* eslint-disable-next-line unicorn/no-for-loop */
    for (let i = 0; i < preferred.length; i += 1) {
      const locale = preferred[i];
      const ll = locale.toLowerCase();
      if (avail.includes(ll)) {
        return locale;
      }

      if (aliases) {
        if (Object.prototype.hasOwnProperty.call(aliases, ll)) {
          let alias = aliases[ll];
          if (alias) {
            alias = alias.split('_').join(separator);
            if (avail.includes(alias.toLowerCase())) {
              return alias;
            }
          }
        }
      }

      const parts = locale.split(separator);
      if (parts && avail.includes(parts[0].toLowerCase())) {
        return parts[0];
      }
    }

    /* eslint-disable-next-line unicorn/no-useless-undefined */
    return undefined;
  },
};
