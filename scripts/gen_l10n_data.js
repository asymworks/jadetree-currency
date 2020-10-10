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
const resolve = require('resolve');

const currencyData = require('cldr-core/supplemental/currencyData.json');
const likelySubtags = require('cldr-core/supplemental/likelySubtags.json');

const { generateList } = require('./ccy_list');
const {
  cldrAliases,
  cldrNumbersRoot,
  cldrNumbersLocales,
  cldrParentLocales,
  loadLocaleData,
  localCurrencies,
} = require('./cldr');

const { generateLocale, parseLocale } = require('./localeUtils');

// Load a JSON File
const loadJson = (jsonPath) => JSON.parse(fs.readFileSync(jsonPath));

async function main(args) {
  // Load Currency List
  let ccyList;
  if (args.list) {
    ccyList = loadJson(args.list);
  } else {
    ccyList = Object.keys(await generateList());
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
      locales.filter((locale) => !parents.includes(locale)).forEach((locale) => {
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

  process.stdout.write(JSON.stringify(localeData));
  process.stdout.write('\n');

  /*
  // Sort by Language
  const langList = {};

  cldrNumbersLocales
    .map((tag) => {
      const localeString = generateLocale(tag, '-');
      return Object.prototype.hasOwnProperty.call(cldrAliases, localeString)
        ? parseLocale(cldrAliases[localeString], '-')
        : localeString;
    })
    .filter((tag) => !tag.script || tag.script === 'Latn')
    .forEach((tag) => {
      const { language, territory, script, variant } = tag;
      if (Object.prototype.hasOwnProperty.call(langList, language)) {
        langList[language].push(tag);
      } else {
        langList[language] = [tag];
      }
    });


  // Load the Supported Currency list
  let ccyList;
  if (args.list) {
    ccyList = loadJson(args.list);
  } else {
    ccyList = Object.keys(await generateList());
  }

  // Process Languages
  //process.stdout.write(JSON.stringify(loadLocaleData(args.tag, ccyList)));
  process.stdout.write(JSON.stringify(langList));
  process.stdout.write('\n');
  */
}

const parser = new ArgumentParser({
  description: 'Generates localization data for the Jade Tree Currency library',
});

parser.add_argument('-v', '--version', { action: 'version', version });
parser.add_argument('-l', '--list', { help: 'load list of supported currency codes from the given JSON file' });
parser.add_argument('tag', { help: 'locale tag to load' });

const args = parser.parse_args();

main(args);
