/**
 * gen_ccy_data.py - Generate List of Currencies for Jade Tree
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
 * Jade Tree frontend.
 *
 * Sources:
 * - {@link https://www.currency-iso.org/dam/downloads/lists/list_one.xml}
 * - {@link https://www.xe.com/iso4217.php}
 */

const http = require('http');
const https = require('https');
const html_parser = require('node-html-parser');
const xml2js = require('xml2js');

/**
 * Retrieve data from a URL
 * @param {String} url URL to fetch
 * @return {String} body text
 * @async
 */
const getUrl = (url) => new Promise((resolve, reject) => {
  let client = http;
  if (url.toString().indexOf('https') === 0) {
    client = https;
  }

  client.get(url, (resp) => {
    let data = '';
    resp.on('data', (chunk) => {
      data += chunk;
    });
    resp.on('end', () => {
      resolve(data);
    });
  }).on('error', (err) => {
    reject(err);
  });
});

/**
 * Load Currency List from xe.org
 * @return {Array} list of ISO 4217 currency codes in circulation
 */
async function load_currencies() {
  const url = 'https://www.xe.com/iso4217.php';
  const root = await getUrl(url)
    .then((htmlString) => html_parser.parse(htmlString));

  return root.querySelectorAll('#currencyTable a').map((e) => e.text);
}

/**
 * Load ISO 4217 Data from currency-iso.org
 * @return {Object} object mapping currecy code to currency number and precision
 */
async function load_iso4217() {
  const url = 'https://www.currency-iso.org/dam/downloads/lists/list_one.xml';
  const data = {};
  const iso4217 = await getUrl(url)
    .then((xmlString) => xml2js.parseStringPromise(xmlString));

  if (!Object.prototype.hasOwnProperty.call(iso4217, 'ISO_4217')) {
    throw Error('Invalid response returned for ISO 4217 data');
  }

  data.currencies = {};
  data.published = iso4217['ISO_4217'].$?.Pblshd;

  iso4217['ISO_4217'].CcyTbl[0].CcyNtry.forEach(
    (
      { CtryNm, Ccy, CcyNm, CcyNbr, CcyMnrUnts }
    ) => {
      if (Ccy && Ccy.length > 0) {
        const country = CtryNm[0];
        const ccy = Ccy[0];
        const ccyName = CcyNm[0];
        const ccyNumber = parseInt(CcyNbr[0]);
        const ccyMinor = parseInt(CcyMnrUnts[0]) || 0;

        if (ccyName.$?.IsFund) {
          process.stderr.write(`Skipping ${ccy} (IsFund)\n`);
        } else if (data.currencies[ccy]) {
          process.stderr.write(`Skipping ${ccy} (Already Exists)\n`);
          if (data.currencies[ccy].number !== ccyNumber) {
            process.stderr.write(`Number for ${ccy} in ${country} differs from previously seen\n`);
          }
          if (data.currencies[ccy].precision !== ccyMinor) {
            process.stderr.write(`Minor Units for ${ccy} in ${country} differs from previously seen\n`);
          }
        } else {
          data.currencies[ccy] = {
            number: ccyNumber,
            precision: ccyMinor,
          };
        }
      }
    },
  );

  return data;
}

/**
 * Generate the Jade Tree Currency List
 *
 * Generates the list of supported ISO 4217 currency codes, which is the
 * intersection of the xe.com list and the ISO 4217 list, along with any
 * manually-specified additional currency codes.
 *
 * @param {Array} addCodes List of ISO 4217 codes to add to the xe.com list
 *    before processing the intersection with ISO data (defaults to the
 *    unknown currency `XXX`)
 * @return {Object} currency data (number and precision) for supported Jade
 *    Tree currencies (object keys are supported codes)
 */
async function generateList(addCodes = ['XXX']) {
  const iso4217 = await load_iso4217();
  const xeList = await load_currencies();
  const ccyList = {};

  // Ensure the additional currency codes are processed
  addCodes.map((code) => code.toUpperCase()).forEach((code) => {
    if (!xeList.find((c) => c === code)) {
      xeList.push(code);
    }
  });

  // Ensure 'XXX' has precision of 6, not 0 as defualt (this is an internal
  // Jade Tree requirement to show full precision on unknown currency numbers)
  iso4217.currencies.XXX.precision = 6;

  // Filter currencies by what xe.com believes is currently in circulation
  xeList.forEach((ccy) => {
    if (iso4217.currencies[ccy]) {
      ccyList[ccy] = iso4217.currencies[ccy];
    } else {
      process.stderr.write(`Warning: no ISO 4217 entry found for ${ccy}\n`);
    }
  });

  return {
    currencies: ccyList,
    published: iso4217.published,
  };
}

module.exports = {
  load_currencies,
  load_iso4217,
  generateList,
};
