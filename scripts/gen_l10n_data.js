/**
 * gen_ccy_data.py - Generate List of Currencies for nvlps
 *
 *   Copyright (c) 2020 Asymworks, LLC.
 *
 *   The jt-currency library may be freely distributed under the terms of
 *   the BSD license.  For all licensing information, details and documentation:
 *   https://jadetree.io/api/jt-currency
 *
 * This script pulls data from ISO 4217 and xe.com to generate a list of
 * currencies that are currently in circulation.  This data is used to filter
 * the Unicode CLDR databases and limit the amount of data packaged for the
 * Nvlps frontend.
 *
 * Sources:
 * - {@link https://www.currency-iso.org/dam/downloads/lists/list_one.xml}
 * - {@link https://www.xe.com/iso4217.php}
 */

const { ArgumentParser } = require('argparse');
const { version } = require('../package.json');

const fs = require('fs');
const glob = require('glob');
const path = require('path');
const prettier = require('prettier');
const resolve = require('resolve');

var { template } = require('lodash');

const currencyData = require('cldr-core/supplemental/currencyData.json');
const likelySubtags = require('cldr-core/supplemental/likelySubtags.json');

const { generateList } = require('./ccy_list');
const {
  cldrAliases,
  cldrNumbersRoot,
  cldrNumbersLocales,
  cldrParentLocales,
  cldrVersion,
  loadLocaleData,
  localCurrencies,
} = require('./cldr');

const { generateLocale, parseLocale } = require('../src/locale-utils');

// Load a JSON File
const loadJson = (jsonPath) => JSON.parse(fs.readFileSync(jsonPath));

// L10N Root Data Template
const ts_root_template = `/* Automatically generated by gen_l10n_data.py */
import { Locale } from '../locale';

// Unicode CLDR Version <%= cldrVersion %>, retrieved <%= dateRetrieved %>
export default new Locale('root', <%= langData %>);
`;

// L10N Data File Template
const ts_data_template = `/* eslint-disable camelcase, unicorn/prevent-abbreviations */
/* Automatically generated by gen_l10n_data.py */
import { Locale } from '../locale';
import root from './root';

// Unicode CLDR Version <%= cldrVersion %>, retrieved <%= dateRetrieved %>
export const <%= lang %> = new Locale('<%= lang %>', <%= base %>, root);
<% if (parents && parents.length) { %>
// Common Locale Parents<% parents.forEach(function({ name, data }) { %>
export const <%= name %> = new Locale('<%= name %>', <%= data %>, <%= lang %>);
<% }) %><% } %>
// Locale Data<% locales.forEach(function({ name, parent, data }) { %>
export const <%= name %> = new Locale('<%= name %>', <%= data %>, <%= parent || lang %>);<% }) %>
<% if (aliases && aliases.length) { %>
// Aliased Locales<% aliases.forEach(function({ alias, name }) { %>
export const <%= alias %> = <%= name %>;
<% }) %><% } %>

// Default Export
export default <%= defaultKey %>;
`;

// L10N Index Template
const ts_index_template = `/* Automatically generated by gen_l10n_data.py */
/* Unicode CLDR Version <%= cldrVersion %>, retrieved <%= dateRetrieved %> */

<% languages.forEach(function(lang) { %>
export * from './<%= lang %>';<% }) %>
`;

async function main(args) {
  // Load Output Directory
  const outpath = path.normalize(args.outdir);
  fs.mkdirSync(outpath, { recursive: true, mode: 0o755 });

  // Load Currency List
  let ccyList;
  if (args.list) {
    ccyList = loadJson(args.list);
  } else {
    ccyList = Object.keys((await generateList()).currencies);
  }

  // Load Number Locales
  const languageList = {};
  cldrNumbersLocales.forEach((tag) => {
      const { language, territory, script, variant } = tag;
      if (Object.prototype.hasOwnProperty.call(languageList, language)) {
        languageList[language].push(tag);
      } else {
        languageList[language] = [tag];
      }
    });

  // Load Root Locale
  const root = loadLocaleData('root', ccyList);
  const localeData = {
    root,
  };

  // Load Languages
  Object.keys(languageList).filter((lang) => lang !== 'root').forEach((lang) => {
    const langData = loadLocaleData(lang, ccyList, [root]);
    if (langData) {
      const locales = languageList[lang].map((tag) => generateLocale(tag, '-'));
      const parents = [
        ...new Set(locales.map((l) => cldrParentLocales[l]))
      ].filter((e) => !!e);

      // Process Language Defaults
      process.stderr.write(`Processing ${lang}\n`);
      localeData[lang] = {
        base: langData,
        locales: {},
      };

      // Load Parent Locales
      if (parents.length) {
        localeData[lang].parents = {};
        parents.forEach((locale) => {
          process.stderr.write(`Loading Parent Locale ${locale}\n`);
          localeData[lang].parents[locale] = loadLocaleData(locale, ccyList, [langData, root]);
        });
      }

      // Load Child Locales
      locales.filter((locale) => !parents.includes(locale) && locale !== lang).forEach((locale) => {
        const bases = [langData, root];
        if (cldrParentLocales[locale]) {
          bases.unshift(localeData[lang].parents[cldrParentLocales[locale]]);
        }

        process.stderr.write(`Processing ${locale}\n`);
        localeData[lang].locales[locale] = loadLocaleData(locale, ccyList, bases);

        if (cldrParentLocales[locale]) {
          localeData[lang].locales[locale]._parent = cldrParentLocales[locale];
        }
      });
    }
  });

  const rootTemplate = template(ts_root_template);
  const dataTemplate = template(ts_data_template);
  const baseOptions = {
    cldrVersion,
    dateRetrieved: (new Date()).toISOString().substring(0, 10),
  };

  const prettierOpts = {
    parser: 'babel',
    singleQuote: true,
  };

  // Dump Localization Data Root
  if (Object.keys(localeData).includes('root')) {
    const fn = path.join(outpath, 'root.ts');
    const options = {
      langData: JSON.stringify(localeData.root),
      ...baseOptions,
    }

    process.stderr.write(`Writing ${fn}\n`);
    fs.writeFileSync(fn, prettier.format(rootTemplate(options), prettierOpts));
  } else {
    throw new Error('Did not load any data for locale "root"');
  }

  Object.keys(localeData).filter((key) => key !== 'root').forEach((lang) => {
    let defaultKey = lang;

    const parents = Object.keys(localeData[lang].parents || {})
      .filter((parentTag) => parentTag !== 'root')
      .map((parentTag) => ({
        name: parentTag.replace(/-/g, '_'),
        data: JSON.stringify(localeData[lang].parents[parentTag]),
      }));

    const locales = Object.keys(localeData[lang].locales).map((tag) => {
      const { _parent, ...rest } = localeData[lang].locales[tag];
      return {
        name: tag.replace(/-/g, '_'),
        parent: _parent && _parent.replace(/-/g, '_'),
        data: JSON.stringify(rest),
      }
    });

    const aliases = [];
    const aliasTag = cldrAliases[lang];
    if (aliasTag) {
      const { language, territory, variant } = parseLocale(aliasTag, '-');
      const tryTag = generateLocale({ language, territory }, '-');
      if (!Object.keys(localeData[lang].locales).includes(tryTag)) {
        aliases.push({ alias: tryTag.replace(/-/g, '_'), name: lang });
      }
    }

    const fn = path.join(outpath, `${lang}.ts`);
    const options = {
      lang: lang,
      base: JSON.stringify(localeData[lang].base),
      parents,
      locales,
      aliases,
      defaultKey: defaultKey.replace(/-/g, '_'),
      ...baseOptions,
    };

    process.stderr.write(`Writing ${fn}\n`);
    fs.writeFileSync(fn, prettier.format(dataTemplate(options), prettierOpts));
  });

  // Write Index File
  const indexTemplate = template(ts_index_template);
  process.stderr.write(`Writing ${path.join(outpath, 'index.ts')}\n`);
  fs.writeFileSync(
    path.join(outpath, 'index.ts'),
    prettier.format(
      indexTemplate({
        languages: Object.keys(localeData),
        ...baseOptions,
      }),
      prettierOpts
    )
  )
}

const parser = new ArgumentParser({
  description: 'Generates localization data for the Jade Tree Currency library',
});

parser.add_argument('-v', '--version', { action: 'version', version });
parser.add_argument('-l', '--list', { help: 'load list of supported currency codes from the given JSON file' });
parser.add_argument('outdir', { help: 'locale file output directory' });
// parser.add_argument('tag', { help: 'locale tag to load' });

const args = parser.parse_args();

main(args);
