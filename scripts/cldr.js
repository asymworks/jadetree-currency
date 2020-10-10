// CLDR Helpers

const fs = require('fs');
const glob = require('glob');
const path = require('path');
const resolve = require('resolve');

const currencyData = require('cldr-core/supplemental/currencyData.json');
const likelySubtags = require('cldr-core/supplemental/likelySubtags.json');
const parentLocales = require('cldr-core/supplemental/parentLocales.json');

const { generateLocale, parseLocale } = require('./localeUtils');

// Store Parent Locales
const cldrParentLocales = parentLocales.supplemental.parentLocales.parentLocale;

// Load a JSON File
const loadJson = (jsonPath) => JSON.parse(fs.readFileSync(jsonPath));

// CLDR Number Data Root
const cldrNumbersRoot = path.join(
  path.dirname(
    resolve.sync('cldr-numbers-modern/main/root/currencies.json')
  ),
  '..',
);

// CLDR Number Data Locale List
const cldrNumbersLocales = glob.sync('*/', { cwd: cldrNumbersRoot })
  .map((d) => parseLocale(d.slice(0, -1), '-'));

// Load the default currency list
function loadTerritoryCurrencies() {
  const territoryCurrencies = {};
  const regions = currencyData.supplemental.currencyData.region;
  Object.keys(regions).forEach((t) => {
    regions[t].forEach((o) => {
      const ccy = Object.keys(o)[0];
      if (!o[ccy]['_to']) {
        territoryCurrencies[t] = ccy;
      }
    });
  });

  return territoryCurrencies;
}

// Pre-Load Currencies
const localCurrencies = loadTerritoryCurrencies();

// Create an Overlay LocaleData Object relative to base locales
function makeOverlay(localeData, bases) {
  const overlay = localeData;
  const baseList = bases.length ? bases : [bases];
  baseList.forEach((base) => {
    Object.keys(base).forEach((key) => {
      if (typeof base[key] === 'object' && overlay[key]) {
        Object.keys(base[key]).forEach((subKey) => {
          if (overlay[key][subKey] === base[key][subKey]) {
            delete overlay[key][subKey];
          }
        });
      } else {
        if (overlay[key] === base[key]) {
          delete overlay[key];
        }
      }
    });
  });
  return overlay;
}

// Load a LocaleData Object from the data at the path
function loadLocaleData(localeString, ccyList, bases = undefined) {
  const localePath = path.join(cldrNumbersRoot, localeString);
  const { territory } = parseLocale(localeString, '-');
  const currencies = loadJson(path.join(localePath, 'currencies.json'));
  const numbers = loadJson(path.join(localePath, 'numbers.json'));

  if (!numbers || !numbers.main) {
    throw new Error('Missing "main" key in numbers.json');
  }

  if (Object.keys(numbers.main).length > 1) {
    throw new Error('Multiple tag keys in numbers.json');
  }

  if (!currencies || !currencies.main) {
    throw new Error('Missing "main" key in currencies.json');
  }

  if (Object.keys(currencies.main).length > 1) {
    throw new Error('Multiple tag keys in currencies.json');
  }

  if (Object.keys(currencies.main)[0] !== Object.keys(numbers.main)[0]) {
    throw new Error('Tag key mismatch between currencies.json and numbers.json');
  }

  // Set the Locale Data Root
  const localeKey = Object.keys(numbers.main)[0]
  const nRoot = numbers.main[localeKey].numbers;
  const cRoot = currencies.main[localeKey].numbers;

  // Skip locales with non-Latin numbering systems
  if (!nRoot['symbols-numberSystem-latn']) {
    process.stderr.write(`Skipping locale with non-Latin numbering system ${localeKey}\n`);
    return;
  }

  // Load Raw Data from numbers.json
  const numSyms = nRoot['symbols-numberSystem-latn'];
  const decimalFmt = nRoot['decimalFormats-numberSystem-latn']['standard'];
  const percentFmt = nRoot['percentFormats-numberSystem-latn']['standard'];
  const scientificFmt = nRoot['scientificFormats-numberSystem-latn']['standard'];
  const currencyFmt = nRoot['currencyFormats-numberSystem-latn']['standard'];
  const accountingFmt = nRoot['currencyFormats-numberSystem-latn']['accounting'];

  // Load Raw Data from currencies.json
  const ccyData = cRoot.currencies;
  const ccyNames = {};
  const ccySyms = {};

  Object.keys(ccyData).filter((ccy) => ccyList.includes(ccy)).forEach((ccy) => {
    const { symbol, displayName } = ccyData[ccy];
    if (displayName !== ccy)
    {
      ccyNames[ccy] = displayName;
    }
    if (symbol !== ccy) {
      ccySyms[ccy] = symbol;
    }
  });

  // Return LocaleData Object
  const data = {
    d: numSyms.decimal,
    g: numSyms.group,
    p: numSyms.plusSign,
    m: numSyms.minusSign,
    pc: numSyms.percentSign,
    pm: numSyms.perMille,
    e: numSyms.exponential,
    x: numSyms.superscriptingExponent,
    inf: numSyms.infinity,
    nan: numSyms.nan,

    c: territory && localCurrencies[territory],

    cs: ccySyms,
    cn: ccyNames,

    np: decimalFmt,
    pp: percentFmt,
    sp: scientificFmt,
    cp: currencyFmt,
    ap: accountingFmt,
  };

  if (bases) {
    return makeOverlay(data, bases);
  }

  return data;
}

module.exports = {
  cldrAliases: likelySubtags.supplemental.likelySubtags,
  cldrNumbersRoot,
  cldrNumbersLocales,
  cldrParentLocales,
  loadLocaleData,
  localCurrencies,
};
