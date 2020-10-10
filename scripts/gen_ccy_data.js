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

var fs = require('fs');
var http = require('http');
var https = require('https');
var html_parser = require('node-html-parser');
var { template } = require('lodash');
var xml2js = require('xml2js');

const { generateList } = require('./ccy_list');

const ts_data_template = `/* Automatically generated by gen_ccy_data.py */

// ISO 4217 data published <%= datePublished %>, retrieved <%= dateRetrieved %>
const ccyData: { [key: string]: { n: number; p: number } } = {
<% _.forOwn(currencies, function(data, key) { %>  <%= key %>: { n: <%= data.n %>, p: <%= data.p %> },
<% }); %>};

export default ccyData;
`;

const ts_list_template = `/* Automatically generated by gen_ccy_data.py */

// xe.com currency list retrieved <%= dateRetrieved %>
const ccyList: string[] = [
<% _.forOwn(currencies, function(data, key) { %>  '<%= key %>',
<% }); %>];

export default ccyList;
`;

async function main(args) {
  const ccyList = await generateList();

  // Format output data
  let fmtData = '';
  let fmtList = '';
  if (args.json) {
    fmtData = JSON.stringify(ccyList);
    fmtList = JSON.stringify(Object.keys(ccyList));
  } else {
    const options = {
      datePublished: iso4217.published,
      dateRetrieved: (new Date()).toISOString().substring(0, 10),
      currencies: ccyList,
    };

    fmtData = template(ts_data_template)(options);
    fmtList = template(ts_list_template)(options);
  }

  // Write output data
  if (!args.output || args.output === '-') {
    process.stdout.write(`${fmtData}\n`);
  } else {
    await fs.writeFile(args.output, fmtData, (err) => {
      if (err) {
        throw err;
      }
      process.stderr.write(`Wrote currency data to ${args.output}\n`);
    });
  }
}

const parser = new ArgumentParser({
  description: 'Generates currency data and the list of supported currencies '
    + 'for the Jade Tree Currency library',
});

parser.add_argument('-v', '--version', { action: 'version', version });
parser.add_argument('--json', { action: 'store_true', help: 'write data in JSON format instead of a TypeScript module'});
parser.add_argument('-o', '--output', { help: 'currency data output file (default writes to STDOUT)', default: '-' });

const args = parser.parse_args();

main(args);
